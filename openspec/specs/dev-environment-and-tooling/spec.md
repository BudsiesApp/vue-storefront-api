# dev-environment-and-tooling Specification

## Purpose
Define the supported OpenSearch development environment, retained tooling, documentation and validation responsibilities for the API.

## Requirements

Environment scope: the 3.9.0 images below (#37169; previously 2.15.0) are development recipes and a tested fixture, not a production version selection. Production has run OpenSearch 3.9.0 since 2026-11-17 (#37169).

### Requirement: OpenSearch-only Docker development environment
The Compose environment SHALL preserve existing os1/osdat1 changes, fixed container name `opensearch-vsf-api`, disabled local security and current resource settings. OpenSearch and Dashboards MUST use the 3.9.0 images; port 9300 MUST NOT be published. All four brand services, default.env and dev/docker/Dockerfile MUST supply `OPENSEARCH_HOST=os1`, `OPENSEARCH_PORT=9200`, `OPENSEARCH_PROTOCOL=http`. Local acceptance SHALL use the current sources with Node 14.21.3, including the updated prebuilt brand image or a local source build, without pushing an image for local testing. docker/vue-storefront-api/Dockerfile SHALL remain unchanged; the startup script runs yarn install on mounted sources, and any build failure SHALL be referred to the supervisor.

#### Scenario: Brand connectivity
- **WHEN** any of the four local brand services is configured from the migrated Compose files
- **THEN** its search connection resolves os1:9200 over http using only OPENSEARCH variables

#### Scenario: Local source build
- **WHEN** the supervisor builds the local source using docker-compose.nodejs.yml or a local brand override
- **THEN** acceptance verifies Node 14 and the startup script installs dependencies from mounted sources; the supervisor handles any build failure without requiring a Dockerfile change in this migration

### Requirement: Remove obsolete tooling and deployment assets
The repository MUST remove package scripts db, mage2vs, restore, restore_it, restore_de, restore2main, dump, dump_it, dump_de, migrate and setup; scripts/db.js, scripts/elastic.js, scripts/mage2vs.js; migrations including hidden helpers; all config/elastic.schema.*.json; remaining docker/elasticsearch assets and existing ES7/Kibana deletions; ES-specific .gitignore entries; duplicate docker/varnish/docker-compose files; and all kubernetes assets. Retained Compose/lint commands MUST no longer reference migrations. Dependencies elasticdump, mage2vuestorefront and migrate MUST be removed from package.json by the implementer. The supervisor SHALL regenerate yarn.lock with yarn install in Node 14 and verify that @elastic/elasticsearch and elasticsearch-deletebyquery are gone; lockfile regeneration is not an implementer task. Cache, Kue, Storyblok, application DB context, workers and application validation-schema copying SHALL remain.

#### Scenario: Catalog rebuild procedure
- **WHEN** a developer needs catalog data
- **THEN** documentation directs them to Magento vsbridge:reindex and no supported API import/dump/mapping command remains

#### Scenario: Dependency and asset audit
- **WHEN** the cleaned package graph and tracked assets are inspected
- **THEN** no ES client/tool dependency or deleted deployment asset remains and unrelated cache/queue/Storyblok capabilities remain available

### Requirement: Aligned examples and current documentation
.env.example SHALL keep the default project name `vue-storefront-api` (default network `vue-storefront-api_default`); no checkout-specific suffix SHALL appear as a default project or network name. README, doc/, model descriptions and retained Varnish tutorial SHALL describe OpenSearch-only setup, alias configuration, Magento prefix/reindex responsibility, supported GraphQL paths, Node 14 source validation and the unsupported promo datasource. The retained root Varnish example SHALL reference its actual Dockerfile path. Actual secret-bearing local settings SHALL not be copied or overwritten.

#### Scenario: Fresh local configuration
- **WHEN** a developer follows the examples
- **THEN** the project/network names match the actual project identifier, GraphQL paths exist, and reindex instructions use logical per-store bases and entity aliases instead of typed mappings or removed import scripts

### Requirement: Deliberate naming checkpoint and audit
The private search module SHALL remain `src/lib/opensearch.js` with OpenSearch-named client identifiers. The obsolete index-backed stock extension SHALL be absent from source, registeredExtensions in default configuration and the local configuration template, and supported-endpoint documentation. No compatibility route SHALL replace it. The implementation MUST have no internal Elasticsearch support paths or compatibility accessor. Remaining `elastic` name matches SHALL be limited to dependency-boundary exports/input names, historical changelog/sample data and OpenSpec history, not active old configuration, packages, backend branches, operational docs or deleted tooling.

#### Scenario: Compatibility names remain deliberate
- **WHEN** active source and configuration are inspected
- **THEN** private imports use lib/opensearch, no index-backed stock extension is registered or documented as supported, and remaining legacy names have an external-contract or inert-history/data reason

#### Scenario: Retired stock routes are absent
- **WHEN** a client requests `/api/ext/opensearch-stock/check/<sku>`, `/api/ext/opensearch-stock/check?sku=<sku>` or `/api/ext/opensearch-stock/list?skus=<skus>`
- **THEN** each returns HTTP 404 without an alias or replacement implementation

#### Scenario: Live stock remains Magento-backed
- **WHEN** a client requests `/api/stock/check/<sku>` or `/api/stock/list?skus=<skus>`
- **THEN** the API retains the previous Magento-backed response behavior and does not substitute indexed stock

### Requirement: Focused tests and supervisor runtime acceptance
The API SHALL retain the existing boost and Storyblok sync-target tests and focused coverage for alias/proxy parameter normalization, numeric totals and URL msearch entity derivation. Regression coverage SHALL additionally verify exact source-filter overlap, fully excluded catalog projections, empty URL-mapping filters, and failure-versus-miss HTTP behavior for Storyblok and url-rewrite. Tests MUST mock external clients and relevant processors/store utilities so importing test targets does not open engine or Redis connections. Local static validation SHALL include eslint without --fix on src and scripts, TypeScript build, schema copying and yarn test:unit under the supported Node 14 runtime. Engine-backed validation SHALL use OpenSearch 3.9.0 and distinguish observed engine responses/logs from mocked unit results.

#### Scenario: Reproducible checks
- **WHEN** the maintained API checks and focused regressions run
- **THEN** they exercise source-filter and lookup error contracts without requiring live external clients for unit tests, and engine-specific claims are supported by engine-backed checks rather than mocks alone
