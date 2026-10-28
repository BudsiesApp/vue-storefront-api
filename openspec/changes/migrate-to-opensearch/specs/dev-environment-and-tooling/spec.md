## ADDED Requirements

### Requirement: OpenSearch-only Docker development environment
The Compose environment SHALL preserve existing os1/osdat1 changes, fixed container name `opensearch-vsf-api`, disabled local security and current resource settings. OpenSearch and Dashboards MUST be pinned to 2.19.0; port 9300 MUST NOT be published. All four brand services, default.env and dev/docker/Dockerfile MUST supply `OPENSEARCH_HOST=os1`, `OPENSEARCH_PORT=9200`, `OPENSEARCH_PROTOCOL=http`. Local acceptance SHALL use the current Node 14 sources rather than the prebuilt Node 10 image, without pushing an image. docker/vue-storefront-api/Dockerfile SHALL remain unchanged; the startup script runs yarn install on mounted sources, and any build failure SHALL be referred to the supervisor.

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
Per the user checkpoint, the private search module SHALL be `src/lib/opensearch.js` with OpenSearch-named client identifiers, and the stock extension SHALL be renamed from `elastic-stock` to `opensearch-stock` (directory, `registeredExtensions` entries and `/api/ext/opensearch-stock` path, with no alias for the old path). The implementation MUST have no internal Elasticsearch support paths or compatibility accessor. Final `rg -i elastic` results SHALL be classified by file and reason: dependency-boundary exports/input names, historical changelog/sample data, and OpenSpec history are allowed; active old configuration, packages, backend branches, operational docs and deleted tooling are not.

#### Scenario: Compatibility names remain deliberate
- **WHEN** the final source audit runs
- **THEN** private imports use lib/opensearch, the stock extension is registered and served as opensearch-stock, and every other remaining match has a recorded external-contract or inert-history/data reason

### Requirement: Focused tests and supervisor runtime acceptance
The implementation SHALL retain existing boost tests, recheck discovered tests for old imports/config/removed helpers, and add only the focused src/lib/test/unit/opensearch.spec.ts and src/api/url/test/unit/map.spec.ts suites using existing Jest discovery for alias/proxy parameter normalization, numeric totals and URL msearch entity derivation. Tests MUST mock the client and relevant processors/store utilities and verify imports do not open engine or Redis connections. If URL route isolation requires heavy mocking, the implementer SHALL report that limitation and cover only its pure-function portion. Other runtime paths SHALL be covered by the supervisor matrix rather than additional regression suites. Validation MUST include eslint without --fix on src and scripts, TypeScript build, schema copying and yarn test:unit under Node 14; unavailable implementer checks SHALL be reported explicitly. Runtime acceptance SHALL be performed by the supervisor against Petsies after the user's Magento prefix change/reindex, including the full REST/extension/tax/GraphQL/Storyblok matrix in tasks.md, excluding the unsupported promo phase from successful sync claims.

#### Scenario: Reproducible checks
- **WHEN** implementation is ready for review
- **THEN** the report distinguishes Node 14 static/unit results from supervisor runtime results and includes the remaining-name audit rather than claiming unperformed checks passed
