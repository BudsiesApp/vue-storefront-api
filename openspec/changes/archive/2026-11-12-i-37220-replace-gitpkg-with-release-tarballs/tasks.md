# Tasks

## 1. Amazon Pay dependency transport

- [x] 1.1 Replace the Amazon Pay direct URL with the verified source repository release asset and regenerate its Yarn Classic lock entry in the existing API container/Node 14 toolchain; verify the scoped diff preserves source pin, package/runtime identity, unrelated locked versions and lockfile format with no active GitPkg dependency references.
- [x] 1.2 Add a focused dependency/entry-loading contract check using existing tooling; verify the manifest/lock select the release asset and the installed `@vue-storefront-api/amazon-pay@0.1.0` entry creates its existing router with non-production configuration without invoking payment handlers.
- [x] 1.3 Document published provenance/checksum inspection, container lockfile updates and retained historical URLs; verify examples match actual release assets and distinguish packaging revision from package source commit.

## 2. Explicit preview consumption

- [x] 2.1 Update the dependency/router contract to accept supported immutable preview identities and separate generic selected-preview checks from initial-pin/version regression expectations; verify release/preview cases retain repository/asset, lock, no-GitPkg and non-payment router-loading checks without changing the accepted final manifest/lock pin.
- [x] 2.2 Document the source command and exact handoff, feature iteration and merged-source selection, explicit Node 14 container URL/lock updates and isolated testing/restoration; verify examples need no publisher config/test commit or manually prepared tag and retain historical assets and payment-handler boundaries.

## Workflow follow-up

- Actual source publication and anonymous-download/checksum evidence precede final URL/lock regeneration; ask the lead for missing authorization/access rather than committing a local package URL or invented integrity.
- Tester owns cache-empty `yarn install --frozen-lockfile` with GitPkg unavailable, `yarn build`, non-mutating lint over `src`/`scripts`, `yarn test:unit` and existing extension mount/loading evidence. Do not invoke real payment operations.
- Preserve unrelated local edits/configuration. Archive only when selected by the operator; merges and deployment remain separate work.
- Preview extension: tester consumes the returned URL in an intended feature/testing graph, checks frozen install and targeted build/router compatibility, and restores accepted final pins/configuration. Preserve completed migration evidence; choose additional regressions from the actual diff. No automatic API commits or arbitrary final-pin replacement is authorized.
