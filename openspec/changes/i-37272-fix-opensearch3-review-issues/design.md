# Design

## Context

See [proposal.md](proposal.md) for motivation. The branch contains `6da8adc`: `adjustBackendProxyUrl` already parses and merges catalog source filters and removes exact include/exclude overlaps, but omits includes when every entry is removed. That changes an explicit empty projection into unrestricted source selection. URL mapping builds `_source` independently and still sends conflicts and empty objects/arrays.

Storyblok `getStory` and `checkStoryExist` catch all exceptions as successful misses. Their four read routes and url-rewrite's async `/redirect` handler are Express 4 handlers: an awaited rejection needs an explicit HTTP boundary catch, or the request can stay pending. The existing `apiStatus` helper supplies the `{code,result}` response envelope. URL mapping is different: success is a raw hit or null, and errors use apiStatus.

## Goals / Non-Goals

**Goals:** Correct the two existing source-filter boundaries, distinguish successful misses from backend failures and remove the unused stock implementation without replacing it.

**Non-Goals:** No engine/client upgrade, new runtime configuration, dependency fork, general async-router framework, wildcard expansion, GraphQL/body source-filter normalization or change to live Magento stock.

## Decisions

### 1. Extend the existing filter normalization in place

Keep catalog normalization in `src/lib/opensearch.js` with a small correction. After existing merge/blacklist/overwrite handling, remember whether the merged include list was non-empty, then remove only exact include entries that are also excluded. When that non-empty list is exhausted, emit `_source_excludes=*`. Otherwise retain surviving includes and configured/caller excludes as today. Originally absent/empty includes remain unrestricted.

`_source=false` is rejected because downstream processors read `hit._source`; excluding all fields leaves the required empty object on each hit. Do not add a wildcard matcher: the engine already accepts overlapping patterns, and only identical entries cause the OpenSearch 3 error. Preserve the request object, counts, alias routing, blacklist behavior, query encoding and body controls.

In `src/api/url/map.ts`, first merge request includeFields with configured map.includeFields when includes were supplied, then remove exact entries found in excludeFields. Emit only non-empty source arrays and omit `_source` entirely when neither remains. Keep this small local construction instead of introducing a configurable shared filter subsystem: catalog query strings and mapping body arrays have different existing inputs/contracts. Preserve entity identity, exact URL matching, store selection and product processing. Return the constant readable string `OpenSearch search error` through apiStatus on failure instead of an Error instance; keep detailed exceptions in existing server logging, not the public payload.

### 2. Identify missing Storyblok records from successful hits, not exceptions

In the two read helpers, await the engine and inspect hits-array length. Only an empty successful result becomes the existing `{story:false}` or false result. A found story still goes through existing decoding; a search/decoding rejection is not a miss. Avoid changing the shared story decoder's missing-record behavior for unrelated callers.

Catch these errors in all four HTTP read handlers (home and path variants for story/existence), log at that response-owning boundary and send a stable HTTP 500 apiStatus error result. This is a small correction using existing helpers, not a new middleware or Express upgrade. Simply deleting the helper catches is insufficient under Express 4.

### 3. Complete every url-rewrite response at the HTTP boundary

The `/redirect` handler returns apiStatus 400 immediately for absent requestPath. Wrap its awaited search in try/catch: retain 200 for an existing rewrite and 404 for a successful miss, and return a stable 500 error envelope on failure. Keep helper rejection behavior; do not change global Express error handling or add a timeout to compensate for the unhandled rejection. The storefront companion consumes 404 as absence and throws on other non-200 API codes.

### 4. Delete the unused stock extension rather than repairing it

Remove `src/api/extensions/opensearch-stock/`, both registeredExtensions entries and README support text. Keep `/api/stock`, its Magento adapters, configuration and storefront consumers untouched. Removing unused code has lower ongoing cost than adding a size policy to an unused index-backed stock path.

Update the active OpenSpec reader/naming contracts with deltas; do not rewrite historical archived changes. The removal contract necessarily names retired URLs to establish their 404 behavior, but no active requirement continues to say the extension is registered/served. Existing local secret-bearing config is not edited or copied into source; a stale explicit registration there is a local environment concern, not a tracked source change.

### 5. Extend existing focused suites and add only missing HTTP-boundary coverage

Reuse `opensearch.spec.ts` and `map.spec.ts` for exhausted/partial/absent includes, empty mapping filters and readable mapping failures. Add focused Storyblok and url-rewrite helper/handler regressions with mocked engine clients and external integrations, using the existing Jest discovery. The updated tooling spec replaces the previous upgrade-specific restriction on additional suites with these ongoing behavioral checks. No new test framework or live engine dependency is required for unit tests. Actual deprecation absence and empty-source behavior require local OpenSearch 3.9.0 checks; mocked outbound requests alone do not prove engine behavior.

## Risks / Trade-offs

- Stock URLs intentionally break → No current storefront caller; Magento-backed stock is unchanged and the retired routes have no alias.
- Caller wildcard patterns remain engine-owned → Accepted; exact string conflicts are fixed without inventing another pattern evaluator.
- GraphQL and raw body `_source` inputs can still conflict → Explicitly outside scope; no current caller supplies conflicting lists there.
- Engine deprecation messages are node-deduplicated → Inspect outbound payloads as well as a suitable local engine log window; absence of a repeated log line alone is insufficient proof.
- API errors expose stable text, not engine exception detail → Existing server-side diagnostics retain the detailed failure without publishing internals.

## Migration Plan

No schema, data, index or dependency migration. Release with the same-named storefront and theme changes. Normal source rollback restores the previous endpoints and behavior; no persisted state conversion is required. No engine upgrade, production operation or deployment execution is part of this change.
