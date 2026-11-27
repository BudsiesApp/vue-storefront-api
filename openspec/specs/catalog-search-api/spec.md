# catalog-search-api Specification

## Purpose
Define the storefront's REST catalog search and URL mapping contracts when reading Magento-owned OpenSearch aliases.

## Requirements

### Requirement: Stable REST catalog interface and alias routing
The API SHALL retain GET and POST `/api/catalog/<base>/<entity>/_search`, GET JSON `request`, raw DSL and `request_format=search-query`, compact and standard/full responses, existing processors, group handling, tax, cache tags, suggestions and attribute metadata. It MUST proxy only to the typeless `<base>_<entity>/_search` path using the shared alias helper. It SHALL preserve OPTIONS handling.

#### Scenario: UI query and raw query use the same alias
- **WHEN** a client searches allowed base `vue_storefront_catalog_3` and entity `product` using either supported request format or method
- **THEN** the API searches only `vue_storefront_catalog_3_product` without a mapping type and returns the requested existing response format

#### Scenario: Inaccessible base
- **WHEN** a request base is absent from `opensearch.indices`
- **THEN** the API returns the existing inaccessible-base `apiError` envelope with HTTP 500 without contacting OpenSearch

#### Scenario: Invalid entity or path
- **WHEN** the path lacks an entity or has extra segments, or the entity fails `^[a-z][a-z0-9_]*$`
- **THEN** the API returns HTTP 400 in the existing error envelope without searching a wildcard, multi-index target or base index

#### Scenario: Unknown entity
- **WHEN** a syntactically valid unknown entity resolves to a nonexistent alias on an allowed base
- **THEN** the API returns the engine missing-index error through the existing `_resBody.error` → `apiError` path with its current status behavior and performs no fallback search

### Requirement: Canonical outbound catalog parameters
The API MUST construct one canonical query map from the original parsed URL parameters. It SHALL always strip `request`, `request_format`, `response_format`, `x-app-version`, `x-instance-id`, mapping `type`, and query `source`/`source_content_type`. It SHALL consume body group controls without forwarding them. It SHALL forward remaining permitted engine parameters with URL encoding, preserve caller request-cache settings unless `cacheRequest=true` forces `request_cache=true`, and never copy rewritten values back from `req.query`.

#### Scenario: Application controls cannot reach OpenSearch
- **WHEN** GET or POST includes format, app identity and mapping-type parameters alongside `size`, `from` and `routing`
- **THEN** only the permitted engine parameters reach the canonical typeless URL and the constructed JSON body is not overridden by query `source`

#### Scenario: Empty search body
- **WHEN** GET omits `request` or POST omits a body
- **THEN** the API uses an empty search object before applying server-owned count controls

### Requirement: Source-filter merge and blacklist policy
The API SHALL accept singular and plural source-filter query spellings and send only `_source_includes` / `_source_excludes`. It SHALL flatten comma/repeated values, trim empty fields and stable-deduplicate singular values before plural values. With `useRequestFilter=true`, it MUST blacklist caller parameters even without entity settings, treating either spelling of a source-filter family as blocking both caller spellings. With filtering disabled it SHALL ignore the configured blacklist and configured entity filters.

With filtering enabled and entity settings present, configured lists SHALL precede permitted caller lists when `overwriteRequestSourceParams=false`. When overwrite is true, only configured lists SHALL apply, including empty/null configured lists. Without entity settings, caller filters SHALL remain in effect regardless of overwrite. Empty canonical lists SHALL be omitted. Excludes SHALL retain precedence over includes: identical entries SHALL be removed from the merged include list before forwarding, without expanding wildcard patterns. If a non-empty merged include list becomes empty through this removal, the outbound filter MUST exclude all document source fields so the engine returns an empty `_source` object rather than returning other document fields or omitting `_source`. Subsequent API processing SHALL retain the existing `sgn` signature behavior; an API-generated signature in the final response is not a returned document field and need not be removed. A genuinely absent/empty include list SHALL retain unrestricted-includes behavior. This policy SHALL apply only to query parameters; body `_source` SHALL remain unchanged regardless of query filters or overwrite. The forwarded body SHALL change only by removing existing groupToken/groupId controls and body track_total_hits. Original request query values SHALL remain available to existing processors.

#### Scenario: Both spellings merge once
- **WHEN** config includes `id,name`, a caller supplies singular includes `sku,name` and plural includes `url_key`, and overwrite is false
- **THEN** the outbound `_source_includes` is `id,name,sku,url_key` with no singular parameter and no duplicate `name`

#### Scenario: Overwrite uses configured values
- **WHEN** filtering and overwrite are enabled with entity settings and the caller supplies query filters
- **THEN** only configured query includes/excludes are used, empty configured lists emit no query source restriction, and body `_source` remains unchanged

#### Scenario: Blacklist applies independently of entity configuration
- **WHEN** filtering is enabled, the blacklist contains `_source_include` and `routing`, and the caller supplies both source-include spellings and routing for an entity without settings
- **THEN** both caller include spellings and routing are omitted while unrelated permitted engine parameters remain

#### Scenario: Filtering disabled
- **WHEN** `useRequestFilter=false` and the caller supplies singular excludes
- **THEN** the caller excludes are forwarded under the plural spelling without applying configured filters or blacklist

#### Scenario: Every explicitly included category field is excluded
- **WHEN** a catalog category request excludes all nine configured category include fields
- **THEN** on OpenSearch 3.9.0 the engine returns an empty `_source` object and the final API response contains none of the document's source fields, matching the OpenSearch 2 behavior
- **AND** the API's existing generated `sgn` signature may remain; ordinary response signing is unchanged

#### Scenario: Partial overlap preserves surviving includes
- **WHEN** the merged include list is `id,name` and excludes contain `id`
- **THEN** only `name` remains included and `id` remains excluded, with no identical entry in both outbound lists

#### Scenario: No include restriction is not an exhausted include restriction
- **WHEN** the merged include list starts empty and excludes contain `id`
- **THEN** includes remain unrestricted and only the requested excludes apply; the API does not exclude every source field

### Requirement: Exact numeric public totals
Every forwarded catalog search MUST force query `track_total_hits=true` even when the caller supplies false or a numeric threshold, and MUST remove body tracking controls. The API SHALL normalize engine numeric totals unchanged and `{value, relation}` totals to the numeric value before formatting/caching. Absent totals SHALL become zero. Full `hits.total`, compact `total`, hit processing and aggregation payloads SHALL retain the public contract.

#### Scenario: Compact and full totals agree
- **WHEN** OpenSearch returns total `{value: 12001, relation: 'eq'}`
- **THEN** a full response has numeric `hits.total=12001` and a compact response has numeric `total=12001`

#### Scenario: Caller cannot request approximate totals
- **WHEN** a catalog request supplies `track_total_hits=false` in query or body
- **THEN** the forwarded query forces true, the conflicting body control is removed, and returned totals remain exact numbers

#### Scenario: Absent total
- **WHEN** the engine omits total
- **THEN** the shared normalizer returns zero

### Requirement: URL mapping carries entity identity
URL mapping MUST issue one `client.msearch` with one header/body pair per configured `urlModule.map.searchedEntities` entity in configured order. Each header SHALL contain `{index: '<base>_<entity>'}` resolved through the shared helper, and each body SHALL retain the current match-phrase filter over searched fields, `size: 1`, and `track_total_hits=false`. When request includeFields is given, it SHALL merge those entries with configured map.includeFields, then remove identical entries present in request excludeFields. Otherwise includes SHALL be unrestricted. Non-empty source include/exclude arrays SHALL be placed in each body's `_source`; empty arrays SHALL be omitted and `_source` itself SHALL be omitted when neither member remains. Wildcard patterns SHALL remain engine-owned rather than expanded. It SHALL preserve strict equality checking against the returned source fields, continue on no hit/mismatch and choose the first configured exact match. The overlap fix SHALL resolve URLs when the excluded configured include field is not needed to verify the URL, as in the specified name/id request. Excluding a matching field such as `url_path` or `identifier` SHALL retain the OpenSearch 2 exception: when no remaining returned source field verifies an exact match in any entity, the API returns HTTP 200 with null even if the engine found a document. It SHALL NOT restore the excluded verification field or introduce an independent URL-verification lookup. It MUST assign `_type` from the entity at the position of `response.body.responses[i]` before product processing and preserve it afterward, never parse physical names. It SHALL retain selected-store resolution, pass the base to processors and return null when no entity matches. Top-level failures and any sub-response carrying `error` SHALL return HTTP 500 through the existing API envelope with a readable non-empty error result rather than an empty serialized Error object; sub-response errors MUST be checked before selecting a match.

#### Scenario: Physical index suffix is irrelevant
- **WHEN** the category alias returns an exact matching hit from `vue_storefront_catalog_3_category_1793000000_abcd1234`
- **THEN** the API returns `_type='category'` regardless of the physical name

#### Scenario: Product processing retains identity
- **WHEN** the first exact match is a product
- **THEN** product tax/signature/format processing receives the logical base and the returned hit retains `_type='product'`

#### Scenario: CMS and collision resolution
- **WHEN** product and category do not exactly match but cms_page does, or multiple entities match the same URL
- **THEN** CMS returns `_type='cms_page'` in the first case and the first configured matching entity wins in the second

#### Scenario: No exact match
- **WHEN** every msearch sub-response has no hit or its hit fails strict equality
- **THEN** the API returns null

#### Scenario: Sub-response error
- **WHEN** any msearch sub-response carries an error, including a missing alias
- **THEN** URL mapping returns HTTP 500 with a readable API error result rather than returning another entity or null

#### Scenario: Configured include overlaps the caller's excludes
- **WHEN** the Petsies API receives `POST /api/url/map/` with `{"url":"c/photo-pillows-designs","includeFields":["name"],"excludeFields":["id"]}` on OpenSearch 3.9.0
- **THEN** the outbound msearch contains no identical include/exclude entry and the API returns HTTP 200 for category 80

#### Scenario: Caller excludes the field required for URL verification
- **WHEN** the Petsies API receives `POST /api/url/map/` with `{"url":"c/photo-pillows-designs","includeFields":["name"],"excludeFields":["url_path"]}` and no remaining returned source field verifies the URL
- **THEN** the API returns HTTP 200 with null, preserving OpenSearch 2 behavior despite a document matching the engine query
- **AND** the API does not reintroduce `url_path` into the projection or perform an independent verification lookup

#### Scenario: Empty options do not emit empty source filters
- **WHEN** a mapping request has `includeFields:null, excludeFields:[]`, or supplies neither option
- **THEN** it succeeds for an existing URL without emitting `_source:{}` or empty source-filter arrays
- **AND** OpenSearch 3.9.0 logs no FetchSourceContext deprecation for that request
