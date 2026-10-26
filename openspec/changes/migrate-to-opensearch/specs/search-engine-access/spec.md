## ADDED Requirements

### Requirement: Single typeless client and alias resolver
The application MUST use only `@opensearch-project/opensearch` with the current locked 2.4.0 client line, one shared singleton and no version/backend switch or unwrapped Elasticsearch response fallback. All catalog readers MUST resolve `<base>_<entity>` through one helper, omit mapping `type`, and consume `{body}` results. Storyblok's independent stories index SHALL be used directly. The shared runtime helper SHALL contain no catalog index lifecycle or mapping installation functions.

#### Scenario: Store alias survives rollover
- **WHEN** any internal reader searches store base `vue_storefront_catalog_3` and entity `attribute` before or after an indexer rollover
- **THEN** it searches alias `vue_storefront_catalog_3_attribute` without discovering or parsing physical names

#### Scenario: Client configuration and DB context
- **WHEN** runtime initializes its database context
- **THEN** `getOpenSearchClient` returns the shared client configured with node, existing optional authentication and timeout, `getRedisClient` remains available, and no `getElasticClient` compatibility accessor or `apiVersion` is retained

### Requirement: OpenSearch configuration only
The application SHALL use `opensearch` at root and in all store search overrides, with the keys and template substitutions in design decision 2, moving existing values unchanged from each original file except for the intentional default base/indices change. Default base SHALL intentionally change from `vue_storefront_catalog` to `vue_storefront_catalog_1` and its three legacy allowed bases SHALL become only `vue_storefront_catalog_1`, matching Magento ID-based defaults; the local template SHALL use `vue_storefront_catalog_${DEFAULT_STORE_ID}` and matching `indices`. Existing store-specific settings SHALL retain their values under the renamed namespace. It MUST remove `apiVersion`, `indexTypes`, `server.searchEngine` and `ELASTICSEARCH_*` variables, introducing no new configuration options. All readers including store utilities, tax and GraphQL SHALL use the renamed settings. Credentials MUST NOT be copied into artifacts or examples.

#### Scenario: Template renders for Petsies
- **WHEN** existing environment templating supplies store ID 3 and `OPENSEARCH_HOST=os1`, port 9200 and protocol http
- **THEN** the local search configuration uses base and allowed index `vue_storefront_catalog_3`, no old backend keys, and the existing request-filter/scoring settings

#### Scenario: Store override
- **WHEN** a selected store view has `opensearch.index='vue_storefront_catalog_3'`
- **THEN** URL, stock, GraphQL and tax store matching use that base and the proxy permits it only when listed in root `indices`

### Requirement: Query-builder compatibility boundary
REST and GraphQL query-builder call sites SHALL supply a call-local settings object preserving other settings and exposing `elasticsearch: config.opensearch`. They MUST retain the dependency unchanged, including its public exports/types and accepted `cutoff_frequency`, without restoring global Elasticsearch config or forking the library.

#### Scenario: Query-builder accesses legacy input name
- **WHEN** a REST SearchQuery or GraphQL filter/search is converted to DSL
- **THEN** configured scoring/searchable attributes are available under the dependency's expected input name while all application settings remain under `opensearch`

### Requirement: Complete internal reader migration
Attribute metadata, stock, URL rewrite, both rush-upgrade searches, default campaigns, statistics, currencies, currency rates and both Magento 1 and Magento 2 tax readers MUST issue typeless searches through the alias helper. Existing global versus selected-store base selection SHALL be preserved. Tax readers MUST pass built query objects from `bodybuilder().build()`, retain logical-base tax/store matching and existing price behavior. Currencies SHALL omit `_uid` sorting, map `_id` to code and sort the output in JavaScript ascending by code. Hit existence checks SHALL use hits-array length rather than total; internal readers needing only hits SHALL not add exact-count tracking.

#### Scenario: Currency order
- **WHEN** currency hits arrive in arbitrary engine order
- **THEN** the existing currency response fields remain and currencies are sorted ascending by their code without an engine `_uid` sort

#### Scenario: Magento platform tax searches
- **WHEN** either supported Magento platform adapter processes server-side tax
- **THEN** it searches the taxrule alias with a built JSON body and existing tax calculations use the matched store settings

#### Scenario: Missing rewrite
- **WHEN** a URL-rewrite search has an empty hits array with object-shaped total
- **THEN** existing missing-rewrite behavior is used without dereferencing a nonexistent hit

### Requirement: Typeless Storyblok lifecycle and datasource reads
Storyblok scripts, webhook behavior and its independent stories index SHALL remain. Single-document operations MUST omit `type`; bulk actions MUST omit `_type` and retain `_index`/`_id` with alternating action/document bodies. Reads SHALL use `{body}` and hits-array existence checks. Own-index creation MUST use `body.settings` for shards, replicas and field limit. Deletion SHALL ignore only HTTP 404 using the client options argument. Bulk item failures MUST propagate rather than report successful sync. Catalog datasources SHALL resolve product, category and promo_campaign aliases through the shared helper.

#### Scenario: Stories rebuild and incremental writes
- **WHEN** Storyblok rebuilds an absent own index or indexes/deletes a story
- **THEN** missing-index deletion is ignored using `{ignore: [404]}`, valid settings create the independent index, and all document/bulk operations are typeless

#### Scenario: Partial bulk failure
- **WHEN** a bulk response has `body.errors=true`
- **THEN** failed items cause the sync operation to fail rather than logging overall success

#### Scenario: Unavailable promotion datasource
- **WHEN** the promo datasource phase runs without a producer for `<base>_promo_campaign`
- **THEN** it fails visibly against that alias, remains documented as unsupported, and never reads `default_promotion_campaign` as a substitute
