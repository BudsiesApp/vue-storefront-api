# Spec Delta

## MODIFIED Requirements

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
