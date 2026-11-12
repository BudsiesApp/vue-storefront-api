# Tasks

## 1. Amazon Pay dependency transport

- [x] 1.1 Replace the Amazon Pay direct URL with the verified source repository release asset and regenerate its Yarn Classic lock entry in the existing API container/Node 14 toolchain; verify the scoped diff preserves source pin, package/runtime identity, unrelated locked versions and lockfile format with no active GitPkg dependency references.
- [x] 1.2 Add a focused dependency/entry-loading contract check using existing tooling; verify the manifest/lock select the release asset and the installed `@vue-storefront-api/amazon-pay@0.1.0` entry creates its existing router with non-production configuration without invoking payment handlers.
- [x] 1.3 Document published provenance/checksum inspection, container lockfile updates and retained historical URLs; verify examples match actual release assets and distinguish packaging revision from package source commit.

## Workflow follow-up

- Actual source publication and anonymous-download/checksum evidence precede final URL/lock regeneration; ask the lead for missing authorization/access rather than committing a local package URL or invented integrity.
- Tester owns cache-empty `yarn install --frozen-lockfile` with GitPkg unavailable, `yarn build`, non-mutating lint over `src`/`scripts`, `yarn test:unit` and existing extension mount/loading evidence. Do not invoke real payment operations.
- Preserve unrelated local edits/configuration. Archive only when selected by the operator; merges and deployment remain separate work.
