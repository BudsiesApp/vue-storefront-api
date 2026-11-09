# Vue Storefront API

Budsies' Vue Storefront 1 API reads the catalog from OpenSearch and proxies commerce operations to Magento. Redis provides caching and Kue order queues. Catalog indexing belongs to Magento; the API does not create catalog indices, mappings or aliases.

## Local setup

Use Node 14.21.3, Yarn, Docker and Docker Compose for this release. On the Docker host, configure `vm.max_map_count` to at least 262144 and provide enough memory for OpenSearch. Compose uses the official `opensearchproject/opensearch:2.15.0` and `opensearchproject/opensearch-dashboards:2.15.0` images directly; development settings, including disabled security and the 512 MB OpenSearch JVM heap, are configured in `docker-compose.yml`. No custom search image builds or ECR repositories are required. OpenSearch is available on port 9200 and Dashboards on port 5601.

Copy `.env.example` to `.env` and supply your local domains and service credentials. Use `docker-compose.override.yml.example` as the basis of your local override. The default project name is `vue-storefront-api`; Magento must join the API network `vue-storefront-api_default` to reach `os1:9200`.

Build the current Node 14 sources for local validation:

```sh
docker-compose -f docker-compose.yml -f docker-compose.nodejs.yml up -d --build os1 dashboards redis app
```

Brand services in `docker-compose.yml` use the prebuilt image with Node 14.21.3. A local source-build override is optional; to build a brand service locally, use `docker/vue-storefront-api/Dockerfile` in the override. The existing startup script installs dependencies on the mounted sources. Keep the shared development/production Dockerfile unchanged; refer local build failures to the environment supervisor. Do not publish an image for local testing.

`config/local.json` is generated from `config/local.json.template` at startup. Do not commit generated settings or credentials. Connections use `OPENSEARCH_HOST=os1`, `OPENSEARCH_PORT=9200` and `OPENSEARCH_PROTOCOL=http` in containers (`localhost` for a host process). Optional existing `opensearch.user` / `password` settings are supported.

## Catalog configuration and cutover

The #37156 development/test matrix is API Node 14.21.3 / TypeScript 3.7, OpenSearch server 2.15.0, JavaScript client 2.4.0, and Magento PHP client `opensearch-project/opensearch-php` 2.4.2 on PHP 8.2. The PHP client is a Magento dependency, not an API dependency. Production OpenSearch infrastructure is already 2.19.7, as recorded in the ticket's 2026-11-08 access-only rollout notes; application acceptance against it remains pending. Development recipes and the tested 2.15.0 fixture do not select a production downgrade or certify production application compatibility.

Set Magento's indexer `index_name` prefix to `vue_storefront_catalog`. Magento appends the store ID, so Petsies store 3 uses logical base `vue_storefront_catalog_3`. Align root `opensearch.index`, the proxy allowlist `opensearch.indices`, any `storeViews.<code>.opensearch.index` override and `storyblok.sync.index` with the intended store base. Defaults use store 1; the template uses `DEFAULT_STORE_ID`. Do not append the ID twice.

The user runs the Magento indexer in the Magento environment:

```sh
bin/magento vsbridge:reindex --store=3
# Or rebuild all stores:
bin/magento vsbridge:reindex --all
```

Magento publishes aliases such as `vue_storefront_catalog_3_product`, `_category`, `_attribute`, `_cms_page` and `_taxrule` and owns rollover to new physical indices. The API always reads `<base>_<entity>` aliases, including after reindexing. In Dashboards, create a `vue_storefront_catalog_*` index pattern to inspect the catalog. No API import, dump, mapping installer or migration command remains. See [catalog ownership and cutover](doc/1.%20Data%20schema%20and%20migrations.md).

Clear the catalog output cache at cutover, before validating numeric totals, using the retained tooling:

```sh
npm run cache clear
npm run cache clear -- --tag=product,category
```

Only Petsies is populated locally. Other brands require their own indexing before runtime acceptance. The supervisor must coordinate the engine version transition and preserve data volumes.

## API access

Search with GET or POST `/api/catalog/<base>/<entity>/_search`:

```sh
curl 'http://localhost:8080/api/catalog/vue_storefront_catalog_3/product/_search?size=1'
curl -H 'Content-Type: application/json' -d '{"query":{"match_all":{}}}' \
  'http://localhost:8080/api/catalog/vue_storefront_catalog_3/product/_search?response_format=compact'
```

GET accepts JSON in `request`; `request_format=search-query` translates the existing query-builder format. Full responses expose numeric `hits.total`; compact responses expose numeric `total`. Exact totals are forced. Singular and plural query source filters are normalized to plural engine parameters, merging configured filters first unless overwrite is enabled. Body `_source` is preserved. Unsafe paths/entities return HTTP 400, inaccessible bases HTTP 500, and missing aliases use the existing engine-error envelope without fallback.

URL mapping retains `_type` for storefront dispatch, derived from the configured search order. Stock extension requests use `/api/ext/opensearch-stock`; there is no alias for the former endpoint. Magento-backed `/api/stock` remains available.

[GraphQL documentation](doc/2.%20graphQl%20support.md) covers the unchanged `/graphql` and `/graphiql` routes. The architecture PNG and compressed XML in `doc/` are historical sketches, not current deployment instructions. Product/category data shapes are described in [product](src/models/catalog-product.md) and [category](src/models/catalog-category.md) models.

## Storyblok

The Storyblok webhook and `storyblok:sync:stories`, `storyblok:sync:datasources` and `storyblok:sync:all` commands remain. Story rebuilds manage only the independent complete `storiesIndex`, using typeless documents/bulk actions and failing on partial bulk errors. This index is never suffixed with `_story`.

Validate story rebuild/read/write/delete/bulk and product/category datasource behavior separately. Catalog datasources read aliases under `storyblok.sync.index`. No producer exists for `<base>_promo_campaign`: that phase must fail visibly until a replacement is separately approved. Do not claim full datasource or all-sync success, substitute default campaigns or silently skip the phase. `storyblok:sync:all` lets both phases finish before it reports any failure, so a failed datasource phase does not interrupt the stories rebuild; the command still exits non-zero. While the promo alias is unavailable, use `storyblok:sync:stories` for a successful stories rebuild. Likewise GraphQL `cmsHierarchies` searches `<base>_cms_hierarchy`, which has no producer.

## Development

Run checks with Node 14:

```sh
yarn eslint --ext .js,.ts src scripts
yarn build
yarn test:unit
```

The lint script uses `--fix`; use the explicit eslint command above for review. Focused unit tests mock engine/store/processor I/O and require no services. Runtime acceptance also requires populated aliases, Magento, Redis and Storyblok credentials. Cache, Kue/dashboard, order workers, application validation schemas and extension workspaces remain supported. Place custom extension dependencies in their workspace `package.json`.

For self-signed service certificates, put trusted certificates in `config/certs`. See the [Varnish example](docker/varnish/README.md) and [FAQ](doc/3.%20FAQ%20and%20Recipes.md).

[MIT license](LICENSE)
