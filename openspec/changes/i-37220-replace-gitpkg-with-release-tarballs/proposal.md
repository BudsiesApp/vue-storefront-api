# Proposal

## Why

The API currently downloads its Amazon Pay package through the live GitPkg service. Redmine [#37220](https://redmine.gorbunov.studio/issues/37220) replaces this transport with a prepared public GitHub release asset while preserving the existing payment implementation.

## What Changes

- Replace the Amazon Pay dependency URL in `package.json` and the Yarn Classic lockfile with the release asset from `BudsiesApp/vsf-amazon-pay`.
- Preserve package identity, source pin, runtime dependency graph, CommonJS entry point, and existing extension registration.
- Add focused dependency-transport verification and document updates using release provenance and checksums.

## Capabilities

### New Capabilities

- `amazon-pay-package-consumption`: reproducible API installation from a prepared Amazon Pay release asset with unchanged extension loading.

### Modified Capabilities

None. Existing Node 14 tooling and API behavior requirements remain unchanged.

## Impact

`package.json`, `yarn.lock`, focused checks and documentation in `BudsiesApp/vue-storefront-api`, based on its maintained `budsies` branch. Publication belongs to the companion source-repository change; Storefront UI publication and consumption are companion changes in two other repositories. No application/payment logic, package-manager, Node version, deployment, or GitPkg-service change.
