# Proposal

## Why

The API currently downloads its Amazon Pay package through the live GitPkg service. Redmine [#37220](https://redmine.gorbunov.studio/issues/37220) replaces this transport with a prepared public GitHub release asset while preserving the existing payment implementation.

The pinned migration is implemented and accepted within its original scope. The approved extension adds explicit consumption of immutable feature-branch previews, without replacing the accepted final dependency pin for demonstration.

## What Changes

- Replace the Amazon Pay dependency URL in `package.json` and the Yarn Classic lockfile with the release asset from `BudsiesApp/vsf-amazon-pay`.
- Preserve package identity, source pin, runtime dependency graph, CommonJS entry point, and existing extension registration.
- Add focused dependency-transport verification and document updates using release provenance and checksums.
- Accept the companion publisher's immutable preview URLs as well as explicit-release URLs in the API dependency contract, without weakening source traceability or router loading.
- Document command output, feature-testing manifest/lock updates, subsequent iterations and post-merge source selection; leave VSF updates explicit and preview graphs isolated from accepted final pins.

## Capabilities

### New Capabilities

- `amazon-pay-package-consumption`: reproducible API installation from a prepared Amazon Pay release asset with unchanged extension loading.

### Modified Capabilities

None. Existing Node 14 tooling and API behavior requirements remain unchanged.

## Impact

`package.json`, `yarn.lock`, focused checks and documentation in `BudsiesApp/vue-storefront-api`, based on its maintained `budsies` branch. Publication belongs to the companion source-repository change; Storefront UI publication and consumption are companion changes in two other repositories. No application/payment logic, package-manager, Node version, deployment, or GitPkg-service change.
