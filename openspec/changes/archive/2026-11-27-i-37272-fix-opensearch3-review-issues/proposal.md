# Proposal

## Why

OpenSearch 3 rejects identical source include/exclude entries and warns about empty URL-mapping source filters. Existing route lookup helpers also hide engine failures, and an unused index-backed stock extension has a truncated list response.

## What Changes

- Normalize URL-mapping source filters after merging configured includes, giving exact excludes precedence and omitting empty source filters. Preserve the existing HTTP 200/null outcome when the caller excludes a field needed to verify the URL.
- Preserve exclusion of all document source fields when catalog excludes remove every explicitly included field; keep the existing API-generated `sgn` signature behavior.
- Return actual error responses for failed Storyblok and url-rewrite lookups; keep successful missing-record responses distinct. Make missing url-rewrite request paths return 400.
- Return a readable URL-mapping error result instead of serializing an `Error` to an empty object.
- **BREAKING**: Remove `/api/ext/opensearch-stock` and its registration/documentation. Keep Magento-backed `/api/stock` unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `catalog-search-api`: OpenSearch-compatible URL-mapping filters and fully excluded catalog projections.
- `search-engine-access`: Distinct failure/miss responses for Storyblok and url-rewrite reads; remove the retired index-stock reader from the supported reader contract.
- `dev-environment-and-tooling`: Remove the obsolete index-stock extension registration and supported-endpoint documentation.

## Impact

- `src/api/url/map.ts`, `src/lib/opensearch.js` and their existing unit suites.
- Storyblok extension read helpers and HTTP routes, url-rewrite HTTP handler and focused regressions.
- `src/api/extensions/opensearch-stock/`, `config/default.json`, `config/local.json.template` and `README.md`.
- Companion storefront and theme changes use the same change name in their own OpenSpec roots. No engine or client upgrade, GraphQL/raw-body source-filter work, scoring changes, stock replacement, migration or deployment.
