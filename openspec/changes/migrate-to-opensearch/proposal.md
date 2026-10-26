## Why

The API still sends typed Elasticsearch requests and exposes incompatible totals and source parameters despite already installing the OpenSearch client. Magento now owns catalog indexing into per-entity OpenSearch aliases; the API must read those aliases while preserving the VSF UI HTTP contract and supported GraphQL interface.

## What Changes

- Resolve every catalog entity through `<logical-store-base>_<entity>` and use only typeless OpenSearch 2.x requests.
- Normalize catalog query parameters and numeric totals; derive URL mapping `_type` from configured entity positions in one msearch while retaining existing projections.
- **BREAKING**: replace private `elasticsearch` configuration and `ELASTICSEARCH_*` environment variables with `opensearch` / `OPENSEARCH_*`; remove backend/version selectors.
- Migrate internal readers, both Magento tax adapters, Storyblok operations, and GraphQL under `src/graphql/search/`; retain Apollo 1.x, GraphQL 0.13, Node 14 and TypeScript 3.7.
- Per the user checkpoint: keep GraphQL `cmsHierarchies` as a typeless `<base>_cms_hierarchy` query (unsupported until Magento produces that entity), rename the private client module to `src/lib/opensearch.js`, and rename the `elastic-stock` extension to `opensearch-stock`.
- **BREAKING**: remove API catalog import/dump/mapping/migration tools and Elasticsearch dependencies, Docker remnants and Kubernetes assets. Complete existing Docker work using OpenSearch/Dashboards 2.19.0 and document Magento reindexing.
- Add two focused mocked unit suites and explicit supervisor lockfile regeneration and runtime validation. Keep the shared development/production Dockerfile unchanged. Storyblok `promo_campaign` remains an unavailable datasource with a documented failure, not a synonym for default campaigns.

## Capabilities

### New Capabilities

- `catalog-search-api`: Preserve REST catalog routes, request formats, projections, processors, totals and URL entity metadata.
- `search-engine-access`: Single OpenSearch client, configuration and alias rules for all internal searches and Storyblok reads/writes.
- `graphql-api`: Fixed engine-neutral loading and working typeless resolvers with numeric totals and body aggregations.
- `dev-environment-and-tooling`: OpenSearch-only local Docker environment, removal of obsolete tooling/dependencies, documentation and validation.

### Modified Capabilities

None; `openspec/specs/` contains no existing capability specifications.

## Impact

Changes affect `src/lib`, catalog/URL/attribute APIs, extensions, both Magento tax adapters, `src/db.js`, GraphQL, config templates/store views, retained Storyblok scripts, package/lockfile, Docker examples, README and `doc/`. Cache, Redis, Kue, order workers and unrelated validation schemas remain. No UI or Magento code changes, library/runtime major upgrades, production infrastructure or image pushes are included. Implementation is a later phase; this change contains specifications only.
