## Context

This is the Budsies Vue Storefront 1 API on Node 14 and TypeScript 3.7. The current tree already uses `node:14-alpine` (`docker/vue-storefront-api/Dockerfile:1`), engines `>=14.15.0` (`package.json:8`), and the OpenSearch client import (`src/lib/elastic.js:5`). However, typed requests, version branches and Elasticsearch tooling remain. References below were checked against the current working tree on 2026-10-26, including uncommitted Docker changes; the older research reports are discovery aids only.

`docker-compose.yml:3` already defines `os1`, the required `opensearch-vsf-api` name and `osdat1`; images are still 2.15.0, port 9300 is published, and all four brand services still receive obsolete connection variables (`docker-compose.yml:57`, `:141`, `:225`, `:309`). Preserve this work and the existing deletions of the ES7/Kibana assets. The prebuilt app image at `docker-compose.yml:42` is Node 10 according to the supervisor; local verification must build the current Node 14 source instead.

The UI supplies a logical base and entity separately, singular source filters and request/response format controls (`../vue-storefront/core/lib/search/adapter/api-search-query/searchAdapter.ts:65`, `:73`, `:85`; alternative adapter `../vue-storefront/core/lib/search/adapter/api/searchAdapter.ts:65`, `:77`). URL fallback dispatches on `_type` (`../vue-storefront/core/modules/url/store/actions.ts:191`). These are public contracts.

The indexer constructs aliases and timestamp/random physical names (`../magento2-vsbridge-indexer/src/module-vsbridge-indexer-core/Index/IndexSettings.php:112`, `:123`). Custom entities are registered in `../budsies-store-m2.4.8/app/code/Budsies/VueStorefrontIndexer/etc/di.xml:58`. Supervisor observations establish the running 2.15.0 behavior; this proposal makes no live cluster assertions.

## Goals / Non-Goals

**Goals:** One typeless OpenSearch 2.x implementation, stable REST/UI behavior, working existing GraphQL alternative, Magento-owned catalog aliases, migrated Storyblok, and removal of obsolete backend support and tooling.

**Non-Goals:** UI or Magento code changes; a query-builder fork; Apollo/GraphQL upgrades; Node beyond 14; production TLS/auth provisioning; ECR builds/pushes; a replacement for `promo_campaign`; catalog writers in the API. This proposal changes only its own OpenSpec directory.

## Decisions

### 1. One client, one alias rule

Use the installed OpenSearch client 2.4.0, preserving its current dependency range/locked resolution; do not introduce a second client or backend selector. Its source confirms `{body}` responses, `indices.delete(params, {ignore: [404]})`, and array bodies for `bulk` and `msearch` (`api/api/{search,indices,bulk,msearch}.js`, `lib/Transport.js:178`, `:400`, `:468`). Msearch sends header/body pairs as NDJSON; source filtering belongs in each search body as `_source: {includes, excludes}`, not per-search URL parameters. One declaration mismatch: the 2.4.0 `api/types.d.ts` MsearchBody omits `_source`, although runtime body objects are forwarded unchanged; preserve the body field without changing the dependency.

Retain the existing singleton client pattern, configured by `node`, optional existing `user`/`password`, and `requestTimeout`; remove `apiVersion`. Rename `src/lib/elastic.js` to `src/lib/opensearch.js` as recommended at the user checkpoint. Keep the existing small helper roles: `adjustIndexName(base, entity)` always returns `${base}_${entity}`; `adjustQuery(query, entity)` uses that helper and removes any `type` parameter; `getHits(result)` reads only `result.body.hits.hits`. Add a small numeric-total helper beside these functions, shared by REST and GraphQL. Do not create an engine adapter hierarchy. Rename internal `es`/`elastic` client variables and import aliases to meaningful OpenSearch/search names as touched.

The base is `vue_storefront_catalog_<storeId>`; Petsies is `vue_storefront_catalog_3`. Never append a store ID twice, probe physical names, or infer entity from them. All catalog search paths, including the raw HTTP proxy, use the same alias helper. Storyblok's own `storiesIndex` is already a complete index name and is used directly, never suffixed with `_story`; only its catalog datasource reads use alias resolution.

`src/db.js:3` / `:9`: import the renamed module and replace `getElasticClient` with `getOpenSearchClient: () => getClient(config)` while preserving callback initialization and `getRedisClient`. A repository search found no callers of the old context accessor; update any found on implementation recheck, without leaving a compatibility accessor. Cache/Kue/order APIs remain.

### 2. Exact configuration contract

Rename the root and every existing `storeViews.<code>.elasticsearch` member to `opensearch`. Remove `server.searchEngine`, `apiVersion`, and `indexTypes`; no replacement selectors or new options. `config/default.json:24` and `config/local.json.template:25` use the following illustrative key shape (template substitutions are rendered by the existing environment mechanism). Intentionally change default.json `index` from `vue_storefront_catalog` to `vue_storefront_catalog_1` and replace its three legacy `indices` entries with `["vue_storefront_catalog_1"]`, because Magento defaults to ID-based aliases. Move all remaining settings, including searchScoring and searchableAttributes, unchanged from each original file rather than retyping values from this illustration:

```json
{
  "opensearch": {
    "host": "localhost",
    "index": "vue_storefront_catalog_1",
    "port": 9200,
    "protocol": "http",
    "requestTimeout": 5000,
    "min_score": 0.01,
    "indices": ["vue_storefront_catalog_1"],
    "useRequestFilter": false,
    "overwriteRequestSourceParams": false,
    "requestParamsBlacklist": [],
    "cacheRequest": false,
    "searchScoring": {
      "attributes": {"attribute_code": {"scoreValues": {"attribute_value": {"weight": 1}}}},
      "fuzziness": 2,
      "cutoff_frequency": 0.01,
      "max_expansions": 3,
      "minimum_should_match": "75%",
      "prefix_length": 2,
      "boost_mode": "multiply",
      "score_mode": "multiply",
      "max_boost": 100,
      "function_min_score": 1
    },
    "searchableAttributes": {"name": {"boost": 4}, "sku": {"boost": 2}, "category.name": {"boost": 1}}
  }
}
```

For `local.json.template`, the exact differences from that object are `host: "${OPENSEARCH_HOST}"`, `index: "vue_storefront_catalog_${DEFAULT_STORE_ID}"`, `port: ${OPENSEARCH_PORT}` (numeric, unquoted), `protocol: "${OPENSEARCH_PROTOCOL}"`, `indices: ["vue_storefront_catalog_${DEFAULT_STORE_ID}"]`, and `useRequestFilter: true`. Preserve every other existing local.json.template value unchanged; the block illustrates keys, not replacement values. Existing optional `user`/`password` keys remain supported where already supplied; do not add credentials to examples. `storyblok.sync.index` remains `vue_storefront_catalog_${DEFAULT_STORE_ID}` (`config/local.json.template:183`); it is a base, not a complete entity alias.

Both checked-in configurations currently have only multistore controls and no individual store entries (`config/default.json:144`, `config/local.json.template:142`); do not invent entries. For any supplied individual store view, the search override is exactly `"opensearch": {"index": "vue_storefront_catalog_<storeId>"}` with existing additional search settings preserved under the renamed key if present. Its base must be in the root `opensearch.indices` when exposed through the catalog proxy. `getCurrentStoreView` exposes `opensearch` in its fallback (`src/lib/util.js:27`); tax/store mapping and GraphQL use the renamed store override. `config/local.json` is absent in this checkout. Regenerate it from the template in the runtime environment, or migrate only its search subtree if present there; never commit secrets.

`storefront-query-builder` itself reads `config.elasticsearch` (`node_modules/storefront-query-builder/src/elasticsearch/multimatch.ts:2`). At REST `src/api/catalog.ts:70` and GraphQL `src/graphql/elasticsearch/queryBuilder.ts:14`, pass a shallow call-local configuration object preserving other settings and exposing `elasticsearch: config.opensearch`. Keep its exported namespace/type names; use `config.opensearch.min_score` internally. Do not restore a root `elasticsearch` key, mutate shared config, patch the dependency, or remove `cutoff_frequency` (accepted by the supervisor's cluster).

### 3. Catalog proxy normalization

The route stays `/api/catalog/<base>/<entity>/_search`, GET with JSON `request`, optional `request_format=search-query`, and `response_format=compact` or standard/full response; POST uses JSON body with the same format controls. Preserve existing OPTIONS handling, processors, customer-group token handling, tax, attribute metadata, cache tags, suggestions and aggregation payloads. Fix error examples to include the entity. Parse the pathname separately from the query, require exactly the base/entity/_search segments, and keep the existing `apiError` response envelope. A base absent from `opensearch.indices` returns the current inaccessible-base error (HTTP 500) without contacting the engine. A missing/unsafe entity (anything other than a single lowercase name matching `^[a-z][a-z0-9_]*$`, including comma/wildcard/path syntax) returns HTTP 400 through `apiError`. A syntactically valid unknown entity is sent to its one alias; if absent, pass the engine error through the existing `_resBody.error` → `apiError` path with its current status behavior, with no fallback to the base or another entity. A known entity with an absent alias behaves identically. No configurable entity list replaces deleted `indexTypes`.

Replace the current two-pass URL mutation in `src/lib/elastic.js:35` / `:66` with one canonical parameter map; retain `decorateBackendUrl` only as the normalization function if useful for small tests. The algorithm applies equally to GET and POST:

1. Inputs are the parsed original URL query parameters, decoded/built search body, entity and `config.opensearch` plus `config.entities[entity]`. Do not read values back out of `req.query` after rewriting a URL. Preserve the original request object for existing product signing/processor behavior (`src/processor/product.js:79`). With no GET `request` or POST body, use `{}`.
2. Always strip `request`, `request_format`, `response_format`, `x-app-version`, `x-instance-id`, and mapping `type` from the outbound query. Consume `groupToken` / `groupId` in the body using existing logic; do not forward them. Never forward a URL `source` or `source_content_type` that could override the API's constructed JSON body; strip those two as well.
3. Canonicalize query `_source_include` and `_source_includes` together, and `_source_exclude` and `_source_excludes` together. Split comma strings and repeated values into flattened trimmed nonempty field lists; stable-deduplicate singular values first, then plural values. When `useRequestFilter` is true, apply `requestParamsBlacklist` to **all** caller query parameters even if `config.entities[entity]` is absent. Treat either spelling in the blacklist as blocking the entire corresponding caller source-filter family; otherwise alias spelling could bypass it. Blacklisting removes caller inputs, not configured filters. When `useRequestFilter` is false, ignore the configured blacklist as today.
4. If request filtering is enabled and entity configuration exists, load `includeFields` / `excludeFields` as lists (`null` means empty). With `overwriteRequestSourceParams=true`, use only configured lists, even when empty. Otherwise stable-union configuration lists first with permitted caller lists second. If filtering is disabled or entity configuration is absent, preserve permitted caller lists and ignore overwrite/configured lists. Includes and excludes remain independent; OpenSearch's exclusion wins for overlapping fields. Emit only `_source_includes` / `_source_excludes`, joined by commas; omit empty filters. Never re-add singular keys.
5. Leave body `_source` unchanged, regardless of query filters or overwrite. Source-filter policy applies only to query parameters. The forwarded body changes only by removing existing `groupToken`/`groupId` controls and body `track_total_hits`.
6. Forward all remaining nonblacklisted engine query parameters (for example `from`, `size`, `sort`, `routing`, `preference`) with proper URL encoding. Existing `cacheRequest=true` forces `request_cache=true`; otherwise preserve caller `request_cache`. Force query `track_total_hits=true` on **every** forwarded catalog search, overriding caller false/numeric thresholds, and remove any body `track_total_hits` to avoid ambiguity. Exact numeric pagination totals justify this cost. Blacklisting cannot disable this server-owned invariant. Construct `protocol://host:port/<resolved-alias>/_search` using the existing optional authentication configuration, never a typed path.

Normalize `body.hits.total` before formatting and caching: number stays number; `{value, relation}` becomes `value`; an absent total becomes `0`. Forced exact tracking ensures catalog totals are present; the helper needs no malformed-response branch. Standard responses expose numeric `hits.total`; compact exposes the same numeric `total` with the existing source-hit array. No object total leaks to clients. Existing output caches must be cleared at cutover to eliminate previously cached object totals. Existence checks in url-rewrite and Storyblok use `hits.hits.length`, never total comparisons.

### 4. URL `_type` is carried from the search request

Replace `adjustQueryForOldES`, multi-index `buildIndex`, and physical-name parsing in `src/api/url/map.ts:7`, `:45`, `:52`. Issue one typeless `client.msearch` with one header/body pair per `urlModule.map.searchedEntities` entity in configured order. Build each header with the shared alias helper: `{index: adjustIndexName(base, entity)}`. Each following body is:

```js
{
  query: { bool: { filter: { bool: { should:
    searchedFields.map(field => ({ match_phrase: { [field]: { query: url } } }))
  } } } },
  size: 1,
  track_total_hits: false,
  _source: {
    // Include this member only when request includeFields is supplied.
    includes: includeFields.concat(config.urlModule.map.includeFields),
    excludes: excludeFields
  }
}
```

Keep today's projection semantics (`src/api/url/map.ts:83`–84): when request includeFields is given, concatenate it with configured map.includeFields; otherwise omit the includes member entirely, so there is no include restriction or empty include list. Excludes are the request excludeFields; omit that member when absent. Do not fetch equality fields separately or remove internal-only fields. Source filtering belongs in each body as `_source`, not in msearch URL parameters.

Read `response.body.responses[i]` as the result for configured entity `i`; its first hit supplies the existing strict source-field equality check. Continue on no hit/mismatch and choose the first configured entity with an exact match. Assign `hit._type = searchedEntities[i]` before product processing and preserve it afterward; pass the logical base to processors. Return `null` if none matches. A sub-response carrying `error` or a top-level client failure follows the existing 500 API error path; inspect sub-response errors before selecting a match so they are not silently ignored. No totals are needed.

This keeps URL resolution to one round trip, including CMS fallback, while carrying entity identity independently of physical names or alias rollover. Keep size 1 and existing match/equality semantics.

### 5. Every internal call site and Storyblok

| Area | Concrete changes |
| --- | --- |
| `src/api/attribute/service.ts:120` | Route `_attribute` through shared query helper; remove explicit type and rename client import. |
| `src/api/extensions/elastic-stock/index.js:14` (moved to `src/api/extensions/opensearch-stock/index.js`) | Use selected store's `opensearch.index`, `_product` alias, wrapped body hits; rename the extension per checkpoint decision 3. |
| `src/api/extensions/url-rewrite/helpers.js:20` | Global base + `_url_rewrite`, no type, body-only response, empty hits length check; preserve endpoint return/error behavior. Update its `index.js` import. |
| `src/api/extensions/budsies/index.js:40`, `:69`, `:133`, `:1294`, `:1456`, `:1492` | Both rush searches, default campaigns, statistics, currencies and currency rates use shared alias resolution and global `opensearch.index`. Remove typed params and old unwrapped fallbacks. Currency output still uses `_id` as `code` (`:1479`); remove `_uid` sort (`:1466`), then sort mapped currencies in JS ascending by `code` with a deterministic lexical comparator. |
| `src/platform/magento2/tax.js:83` and `src/platform/magento1/tax.js:84` | Both remain supported and both are touched: rename client/config imports and store-index comparisons, query `_taxrule`, pass `bodybuilder().build()` instead of a builder instance. Preserve base for tax-store matching and existing price calculations. |
| `src/api/extensions/vsf-storyblok-extension/{index.js,helpers.js,sync.js}` and `scripts/storyblok.js:4` | Use shared client and wrapped `{body}` results; retain scripts, webhook/cache behavior and own stories index. |

Storyblok `src/api/extensions/vsf-storyblok-extension/helpers.js:51`, `:67`, `:103` and further searches: remove all request `type` and bulk metadata `_type`; retain `_index`, `_id` and alternating action/document bulk structure. `src/api/extensions/vsf-storyblok-extension/helpers.js:83` index creation becomes `{index: storiesIndex, body: {settings: {number_of_shards: 1, number_of_replicas: 0, 'index.mapping.total_fields.limit': fieldLimit || 1000}}}`. `src/api/extensions/vsf-storyblok-extension/sync.js:82` uses `indices.delete({index: storiesIndex}, {ignore: [404]})`, swallowing only missing-index status, not other failures; remove unsupported `ignore_unavailable` there. Bulk uses `{body: bulkOps}` and examines `response.body.errors`/failed items so partial indexing is not reported as success. No catalog lifecycle helpers are retained for Storyblok; it already has its own small creation function.

Datasource reads at `src/api/extensions/vsf-storyblok-extension/sync.js:265`, `:326`, `:348` resolve `storyblok.sync.index` + product/category/promo_campaign respectively through the helper. `promo_campaign` deliberately remains `<base>_promo_campaign`; no Magento producer exists, so the promo datasource phase fails until a replacement is separately decided. Document this and supervisor-test story sync plus product/category datasource phases separately from the unsupported promo phase, without adding a new skip option or aliasing it to default campaigns. Internal reads that only return hits do not need exact counts and do not add `track_total_hits`.

### 6. GraphQL remains supported

Rename `src/graphql/elasticsearch/` to `src/graphql/search/`; inside it, the existing product subdirectory remains `catalog/` (thus `src/graphql/search/catalog/resolver.js`, with CMS under `src/graphql/search/cms/`). Use fixed `./search/**/*.graphqls` and `./search/**/resolver.js` paths in `src/graphql/schema.js:6` and `src/graphql/resolvers.js:6`; remove now-unused config imports. Keep extension schema/resolver loading and the existing build-copy glob. Do not change routes, `/graphiql` exposure, Apollo Server 1.x or GraphQL 0.13.

Mapping selects the renamed store override or root `opensearch.indices[0]`, preserving existing store selection. Every resolver uses the shared alias helper and body-only client response. Translate public GraphQL `_sourceInclude` / `_sourceExclude` arguments to the **client's** `_source_includes` / `_source_excludes` consistently, including category, attribute, review and CMS; keep public schema argument names unchanged. The product processor's simulated HTTP query keeps its public singular source keys.

Products pass explicit `'product'` to the results processor instead of removed `indexTypes[0]` (`src/graphql/elasticsearch/catalog/resolver.js:44`), force `body.track_total_hits=true`, return numeric `total_count` via the shared helper (`:57`), and read aggregations from `response.body.aggregations` (`:70`) before attribute-metadata enrichment. Other current queries expose `hits.total` in their response bodies and MUST normalize it to a number through the shared helper without adding count tracking. CMS list resolution uses its actual `cms_page` or `cms_block` entity, fixing `'cms'` (`src/graphql/elasticsearch/cms/resolver.js:17`). Recommend removing `cmsHierarchies` resolver, schema query and orphan `CmsHierarchies` / `CmsHierarchy` types; see the explicit user checkpoint below. Do not silently wire it to another entity.

### 7. Removal inventory and retained assets

Remove package scripts **exactly** `db`, `mage2vs`, `restore`, `restore_it`, `restore_de`, `restore2main`, `dump`, `dump_it`, `dump_de`, `migrate`, `setup` (`package.json:18` onward). Remove `migrations` from `lint`'s targets without otherwise changing lint policy; required validation uses eslint without `--fix`.

Delete `scripts/db.js`, `scripts/elastic.js`, `scripts/mage2vs.js`, all of `migrations/` including `.common.js` and `1530101328854-local_es_config_fix.js`, and all `config/elastic.schema.*.json` (current eight files: attribute, category, cms_block, cms_page, index, product, promo_campaign, taxrule). Delete `putAlias`, `deleteIndex`, `reIndex`, `createIndex`, `loadSchema`, `putMappings` and their exports/imports from the shared search module; retain only runtime search helpers still used (remove unused passthrough `search` if no callers remain).

The implementer removes `elasticdump`, `mage2vuestorefront`, `migrate` from package.json only. The supervisor regenerates `yarn.lock` with `yarn install` in Node 14 and verifies removal of transitive `@elastic/elasticsearch`, `elasticsearch-deletebyquery` and other now-unreachable dependencies. Keep the OpenSearch client, `storefront-query-builder`, `bodybuilder`, Redis, Kue, cache and Storyblok scripts, `src/db.js`, workers, application `src/**/*.schema*.json` and their build-copy script. Do not remove general dependencies merely because one deleted script used them if retained code still does.

Delete remaining `docker/elasticsearch/`, retain deletions of `docker-compose.elastic7.yml`, `docker/elasticsearch7/` and `docker/kibana/`, delete the ES data exceptions at `.gitignore:15`–18, all three duplicate Compose files under `docker/varnish/docker-compose/`, and **all** `kubernetes/` (not an OpenSearch rewrite). Remove dead migrations volume mounts, including `docker-compose.nodejs.yml:17` and any brand mounts. Keep root Varnish config, update `docker/varnish/README.md` to root Compose usage, and fix root `docker-compose.varnish.yml`'s build path from `varnish/Dockerfile` to `docker/varnish/Dockerfile` so the retained documented example resolves.

### 8. Docker, documentation and final search audit

Pin `os1` and `dashboards` to 2.19.0. Keep `container_name: opensearch-vsf-api`, disabled security/demo install, current resource settings and `osdat1`. Stop publishing 9300; keep current 9200/5601 development access. All four `app-*` services and `docker/vue-storefront-api/default.env`, `dev/docker/Dockerfile` use `OPENSEARCH_HOST=os1`, `OPENSEARCH_PORT=9200`, `OPENSEARCH_PROTOCOL=http`; no `ELASTICSEARCH_*` variables. Keep `docker-compose.nodejs.yml` source-build support. Leave `docker/vue-storefront-api/Dockerfile` unchanged: it also builds the production image, while `docker/vue-storefront-api/vue-storefront-api.sh:7` runs yarn install on mounted sources at startup. The supervisor decides how to handle any local build failure; no image publication. Remove dead volume mounts and preserve unrelated user changes.

Keep `.env.example`'s default `COMPOSE_PROJECT_NAME=vue-storefront-api` (a local `-es7` suffix is only the user's second checkout and must not appear as a default), so the default Compose network is `vue-storefront-api_default`. `docker-compose.override.yml.example` keeps the user's version: `os1` attached to the external `budsies-store-common-network`. Document Magento joining the API network. Do not edit the user's actual `.env` or local override secrets.

Rewrite README setup/import/version-selection sections and `doc/1. Data schema and migrations.md` for OpenSearch-only aliases and `bin/magento vsbridge:reindex --store=3` / `--all` (verified in `../magento2-vsbridge-indexer/docs/opensearch-migration.md:44`). Describe user-owned prefix change from `vue_storefront` to `vue_storefront_catalog`, ID suffixes, rebuild/alias rollover, Dashboards, Node 14 source builds, prerequisites such as host `vm.max_map_count`, exact totals/source normalization, and the promo limitation. Update `doc/2. graphQl support.md` for fixed paths and retained query interface; review `doc/3. FAQ and Recipes.md`, query examples and architecture assets for active instructions. Update model descriptions in `src/models/catalog-{product,category}.md`. Preserve historical changelog/data, not obsolete operational instructions.

Final `rg -i elastic` is **not expected to have zero hits**. Report every remaining category and any unexpected hit with file/reason:

- External query-builder export/type names and its call-local `elasticsearch` input at the two boundaries; dependency source is external and unchanged.
- Historical `CHANGELOG.md` and inert sample strings in `var/catalog*.json` / `var/testOrderAuth.json`; these are data/history, not supported import tooling. Do not bulk-rewrite product text/URLs mentioning elastic fabrics.
- This change's historical explanation/removal inventory and any archived OpenSpec text.
- Singular `_source_include`/`_source_exclude` do not match `elastic`; preserve them regardless.

Run the normal repo `rg -i elastic` plus a bounded hidden-file inventory excluding `.git`, `node_modules` and `.codegraph`; inspect ignored local search settings separately without logging secrets. `.git` history, installed dependency caches, binary architecture images and generated artifacts are not application backend support; do not claim a normal rg scan inspects them. Active config keys, backend selectors, ES packages/lock entries, lifecycle tooling, Docker/Kubernetes assets, old internal module imports and current docs teaching ES operation must have **no** remaining hits.

## Decisions taken at the user checkpoint (2026-10-26)

The user decided the following; the artifacts use these outcomes.

1. **Keep GraphQL `cmsHierarchies`, typeless.** The query, resolver and `CmsHierarchies`/`CmsHierarchy` types stay. Like `cmsPages`/`cmsBlocks`, it resolves its entity from its `type` argument (default `cms_hierarchy`) through the shared alias helper, so it searches `<base>_cms_hierarchy`. No Magento indexer produces that entity, so the query returns the engine's missing-index error until a producer exists; this is documented in `doc/2. graphQl support.md` and is not redirected to another entity.
2. **Rename private `src/lib/elastic.js` to `src/lib/opensearch.js` and internal client/accessor identifiers.** It is a mechanical import update across already-touched call sites and removes misleading private backend terminology; no compatibility shim is needed.
3. **Rename the `elastic-stock` extension to `opensearch-stock` and migrate its code.** Move `src/api/extensions/elastic-stock/` to `src/api/extensions/opensearch-stock/`, replace `elastic-stock` with `opensearch-stock` in `registeredExtensions` of `config/default.json` and `config/local.json.template`, so its endpoint becomes `/api/ext/opensearch-stock`. No alias or redirect for the old path. The VSF UI uses `/api/stock` (`../vue-storefront/config/local.json.template:818`–819), so no known consumer breaks. `CHANGELOG.md` history stays unchanged.

## Risks / Trade-offs

- Prefix/alias mismatch → user must change Magento prefix and reindex before runtime acceptance; no API fallback. Only Petsies is locally populated; other brands' configuration can be checked but runtime availability is not asserted.
- Exact totals cost more for large searches → force them only for catalog proxy and GraphQL products; internal hit/existence queries do not require them.
- One URL msearch batches the configured entity searches and resolves collisions by configuration order → verify all three entity types, mismatch/no-hit behavior and rollover with mocked physical names and runtime probes.
- Source filter merging/blacklist fixes can alter projections that depended on bugs → table-driven tests cover both spellings, overwrite, disabled filtering and unchanged body `_source`; URL tests mock product processing.
- Dependency cleanup/client declarations may expose Node 14/TS 3.7 compatibility issues → supervisor installs/validates the locked dependency set in Node 14; do not upgrade runtime/libraries to bypass failures without revising scope.
- Unsupported promo step and `cmsHierarchies` both fail with a missing-alias error until a producer exists → document both explicitly; exclude them from successful acceptance claims.
- `/api/ext/elastic-stock` disappears in favor of `/api/ext/opensearch-stock` → no known consumer (UI uses `/api/stock`); mention in README/doc.
- Docker version 2.19.0 differs from supervisor's current 2.15.0 fixture → supervisor validates the pinned environment as well; never reuse ES data volumes or delete data as an implementation side effect.

## Migration Plan

1. Obtain the three proposal decisions; implement the ordered tasks in one checkout while preserving existing Docker/user edits.
2. Supervisor regenerates yarn.lock with yarn install in Node 14 and checks the dependency graph after package.json cleanup. Run non-runtime validation with installed dependencies in a permitted Node 14 environment: eslint without fixes, TypeScript/build-copy and Jest. The implementer records unavailable checks instead of claiming them passed.
3. Supervisor builds/runs the local source image, verifies Node 14, and coordinates the user's Magento prefix change and Petsies reindex. Do not push images. Clear catalog output cache through retained tooling before testing numeric totals.
4. Supervisor runs the full request matrix in tasks.md against aliases, including rollover and Storyblok excluding the promo phase. Record final remaining-name audit.
5. Rollback is a supervisor-operated return to the prior app/config/Compose revision and its matching search snapshot/config; never emulate ES behavior in the new code or automatically downgrade/reuse the OpenSearch data volume. Coordinate Magento alias/prefix settings separately; this proposal performs no data operations.

## Open Questions and Verification Limits

There are no implementation questions beyond the explicit user decisions. `config/local.json` is absent. Installed client conventions were checked locally as recorded in decision 1; no live engine verification was performed. CodeGraph metadata exists but its CLI is unavailable, so references were verified by direct reads/search. No network, Docker, package installation or database operations were performed. Live aliases, Node version inside prebuilt images, engine rejection/acceptance facts and the populated-store inventory are supervisor-supplied, not independently reproduced.
