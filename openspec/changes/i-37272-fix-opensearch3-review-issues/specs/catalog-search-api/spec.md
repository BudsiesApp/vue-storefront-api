# Spec Delta

## MODIFIED Requirements

### Requirement: Source-filter merge and blacklist policy
The API SHALL accept singular and plural source-filter query spellings and send only `_source_includes` / `_source_excludes`. It SHALL flatten comma/repeated values, trim empty fields and stable-deduplicate singular values before plural values. With `useRequestFilter=true`, it MUST blacklist caller parameters even without entity settings, treating either spelling of a source-filter family as blocking both caller spellings. With filtering disabled it SHALL ignore the configured blacklist and configured entity filters.

With filtering enabled and entity settings present, configured lists SHALL precede permitted caller lists when `overwriteRequestSourceParams=false`. When overwrite is true, only configured lists SHALL apply, including empty/null configured lists. Without entity settings, caller filters SHALL remain in effect regardless of overwrite. Empty canonical lists SHALL be omitted. Excludes SHALL retain precedence over includes: identical entries SHALL be removed from the merged include list before forwarding, without expanding wildcard patterns. If a non-empty merged include list becomes empty through this removal, the outbound filter MUST exclude all source fields so each hit retains an empty `_source` object rather than returning all other fields or omitting `_source`. A genuinely absent/empty include list SHALL retain unrestricted-includes behavior. This policy SHALL apply only to query parameters; body `_source` SHALL remain unchanged regardless of query filters or overwrite. The forwarded body SHALL change only by removing existing groupToken/groupId controls and body track_total_hits. Original request query values SHALL remain available to existing processors.

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
- **THEN** on OpenSearch 3.9.0 each returned hit has an empty `_source` object, matching the OpenSearch 2 result
- **AND** the API does not accidentally return the document's other source fields

#### Scenario: Partial overlap preserves surviving includes
- **WHEN** the merged include list is `id,name` and excludes contain `id`
- **THEN** only `name` remains included and `id` remains excluded, with no identical entry in both outbound lists

#### Scenario: No include restriction is not an exhausted include restriction
- **WHEN** the merged include list starts empty and excludes contain `id`
- **THEN** includes remain unrestricted and only the requested excludes apply; the API does not exclude every source field

### Requirement: URL mapping carries entity identity
URL mapping MUST issue one `client.msearch` with one header/body pair per configured `urlModule.map.searchedEntities` entity in configured order. Each header SHALL contain `{index: '<base>_<entity>'}` resolved through the shared helper, and each body SHALL retain the current match-phrase filter over searched fields, `size: 1`, and `track_total_hits=false`. When request includeFields is given, it SHALL merge those entries with configured map.includeFields, then remove identical entries present in request excludeFields. Otherwise includes SHALL be unrestricted. Non-empty source include/exclude arrays SHALL be placed in each body's `_source`; empty arrays SHALL be omitted and `_source` itself SHALL be omitted when neither member remains. Wildcard patterns SHALL remain engine-owned rather than expanded. It SHALL preserve strict source-field equality checking, continue on no hit/mismatch and choose the first configured exact match. It MUST assign `_type` from the entity at the position of `response.body.responses[i]` before product processing and preserve it afterward, never parse physical names. It SHALL retain selected-store resolution, pass the base to processors and return null when no entity matches. Top-level failures and any sub-response carrying `error` SHALL return HTTP 500 through the existing API envelope with a readable non-empty error result rather than an empty serialized Error object; sub-response errors MUST be checked before selecting a match.

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

#### Scenario: Empty options do not emit empty source filters
- **WHEN** a mapping request has `includeFields:null, excludeFields:[]`, or supplies neither option
- **THEN** it succeeds for an existing URL without emitting `_source:{}` or empty source-filter arrays
- **AND** OpenSearch 3.9.0 logs no FetchSourceContext deprecation for that request
