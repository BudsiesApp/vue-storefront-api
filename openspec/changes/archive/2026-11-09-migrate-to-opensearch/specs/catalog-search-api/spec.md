## ADDED Requirements

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

With filtering enabled and entity settings present, configured lists SHALL precede permitted caller lists when `overwriteRequestSourceParams=false`. When overwrite is true, only configured lists SHALL apply, including empty/null configured lists. Without entity settings, caller filters SHALL remain in effect regardless of overwrite. Empty canonical lists SHALL be omitted. Excludes SHALL retain engine precedence over includes. This policy SHALL apply only to query parameters; body `_source` SHALL remain unchanged regardless of query filters or overwrite. The forwarded body SHALL change only by removing existing groupToken/groupId controls and body track_total_hits. Original request query values SHALL remain available to existing processors.

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
URL mapping MUST issue one `client.msearch` with one header/body pair per configured `urlModule.map.searchedEntities` entity in configured order. Each header SHALL contain `{index: '<base>_<entity>'}` resolved through the shared helper, and each body SHALL retain the current match-phrase filter over searched fields, `size: 1`, and `track_total_hits=false`. It SHALL put source filtering in each body as `_source`: includes are request includeFields concatenated with configured map.includeFields when request includeFields is given, otherwise the includes member SHALL be omitted without an empty include list; excludes are request excludeFields. It SHALL preserve strict source-field equality checking, continue on no hit/mismatch and choose the first configured exact match. It MUST assign `_type` from the entity at the position of `response.body.responses[i]` before product processing and preserve it afterward, never parse physical names. It SHALL retain selected-store resolution, pass the base to processors and return null when no entity matches. Top-level failures and any sub-response carrying `error` SHALL follow the existing 500 path; sub-response errors MUST be checked before selecting a match.
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
- **THEN** URL mapping follows the existing 500 error path rather than returning another entity or null
