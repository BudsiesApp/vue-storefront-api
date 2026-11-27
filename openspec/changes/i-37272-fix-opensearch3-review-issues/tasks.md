# Tasks

## 1. Source-filter compatibility

- [x] 1.1 Update `adjustBackendProxyUrl` so exhausting a non-empty merged include list emits `_source_excludes=*`, while originally absent/empty includes stay unrestricted; extend `src/lib/test/unit/opensearch.spec.ts` and verify exhausted, partial and absent includes for GET/POST without changing existing blacklist/overwrite/body-preservation tests.
- [x] 1.2 Normalize mapping source filters after configured includes are merged, drop exact excluded entries, omit empty arrays and omit an empty `_source`; extend `src/api/url/test/unit/map.spec.ts` and verify overlap, null/empty options, absent options and existing entity/processor behavior.
- [x] 1.3 Return a readable `OpenSearch search error` result on mapping failure; update the mapping error assertions and verify top-level and sub-response failures return 500 with non-empty serializable text rather than an Error object.

## 2. Route lookup errors

- [x] 2.1 Change Storyblok read helpers to identify misses only from successful empty hits and propagate search/decoding errors; verify focused tests cover found, missing, failed search and invalid found-story JSON without changing unrelated decoder consumers.
- [x] 2.2 Catch propagated errors in all four Storyblok read handlers, returning an HTTP 500 apiStatus envelope; verify mocked HTTP-handler tests cover both home/path story and existence routes, retain successful miss payloads and settle without an unhandled rejection.
- [x] 2.3 Make url-rewrite `/redirect` return 400 for missing requestPath and catch search failures into 500; verify focused handler tests settle with 400/404/200/500 as appropriate and do not search when requestPath is absent.

## 3. Retire index stock

- [x] 3.1 Remove the index-stock extension directory, default/template registrations and README endpoint sentence, without changing Magento stock routes/adapters/configuration; verify a targeted source/config audit finds no active registration or support text, retired routes return 404 in a local smoke check and the existing `/api/stock` implementation is unchanged.

## 4. Focused validation

- [x] 4.1 Run `yarn test:unit`, `yarn eslint --ext .js,.ts src scripts` without `--fix`, and `yarn build` under Node 14, including GraphQL/schema copying; verify the changed behavior passes its focused regressions and the maintained checks introduce no regressions.
- [x] 4.2 Smoke-check the changed source-filter requests on local OpenSearch 3.9.0: Petsies `c/photo-pillows-designs` with includes `name`/excludes `id` resolves category 80, null/empty and absent mapping options resolve without empty `_source` filters, and excluding all configured category includes yields empty hit `_source`; verify the corresponding outbound payloads and engine deprecation log window rather than treating mocked tests as engine proof.
