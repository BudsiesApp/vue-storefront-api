# amazon-pay-package-consumption Specification

## Purpose

Install the prepared Amazon Pay API release package reproducibly without GitPkg while preserving the API's existing extension entry point and runtime behavior.

## Requirements

### Requirement: Release asset dependency
The API manifest and Yarn Classic lockfile SHALL reference the prepared public GitHub release asset for `@vue-storefront-api/amazon-pay`. Maintained dependency and packaged manifests and lock entries MUST contain no GitPkg dependency URLs.

#### Scenario: Cache-empty frozen installation
- **WHEN** the API installs its committed graph with the existing Yarn Classic toolchain, empty dependency caches and GitPkg unavailable
- **THEN** frozen-lockfile installation succeeds without preparing the Amazon Pay source repository or requesting a GitPkg URL

### Requirement: Initial source compatibility
The initial migration SHALL preserve Amazon Pay sources at `d9f6fcd224938bbcb7472306946d2a947c3ae5e6`, package name `@vue-storefront-api/amazon-pay`, version `0.1.0`, runtime dependencies and payment implementation apart from documented packaging changes.

#### Scenario: Dependency update is inspected
- **WHEN** the manifest, lockfile and release provenance are compared with the initial dependency pin
- **THEN** they identify the same source commit and package identity without unrelated dependency upgrades or payment logic changes

### Requirement: Existing extension loading
The API SHALL continue loading the installed Amazon Pay entry point and mounting its router at the existing extension path. The migration MUST preserve the API build and maintained static/unit checks under the existing Node 14 toolchain.

#### Scenario: API is built and checked
- **WHEN** the API build, non-mutating lint and maintained unit checks run with the published package
- **THEN** they pass without migration-related dependency or module-resolution failures

#### Scenario: Amazon Pay router is initialized
- **WHEN** the API initializes its existing Amazon Pay extension with non-production configuration
- **THEN** the package loads and its router mounts at `/api/ext/amazon-pay` without changing its existing exports or routes

### Requirement: Traceable dependency maintenance
Maintenance documentation SHALL explain selecting a published asset, verifying its source commit and checksum, updating the manifest and frozen lockfile, and retaining release URLs used by historical API revisions.

#### Scenario: Maintainer updates the package
- **WHEN** a maintainer follows the documented procedure
- **THEN** the API can consume the new prepared asset without GitPkg, a package-manager migration or removal of historical releases

### Requirement: Explicit immutable preview consumption
The API SHALL accept the publisher's immutable public preview asset through explicit manifest and Yarn Classic lock updates. Dependency checks MUST accept supported release and preview identities while retaining package provenance, no-GitPkg and router-loading checks. Preview testing MUST NOT require moving branch URLs or consumer-wide lifecycle suppression.

#### Scenario: Returned preview is tested
- **WHEN** a maintainer selects the returned Amazon Pay URL in an intended API feature/testing graph and regenerates its lockfile using the existing Node 14 container workflow
- **THEN** frozen installation and targeted compatibility checks can use that source package and initialize the existing router without invoking payment handlers

#### Scenario: Automatically published branch preview is tested
- **WHEN** a maintainer selects a `<branch>_<short-sha>` prerelease, including a URL-encoded branch name
- **THEN** the dependency check accepts its asset URL while retaining the lockfile and router-loading checks

#### Scenario: Maintainer iterates and selects merged sources
- **WHEN** a maintainer requests a later feature or merged source revision through the publisher command
- **THEN** documentation directs them to verify returned provenance/checksums and explicitly update the package URL and lockfile, rather than track a moving source branch

### Requirement: Preserve accepted final graph and evidence
Preview acceptance SHALL remain separate from the already-accepted pinned migration. Arbitrary preview source changes MUST stay in the intended feature/testing graph and MUST NOT silently replace accepted final dependency pins. Completed unchanged migration evidence and historical assets SHALL remain valid; regression checks MUST cover the affected preview-consumption behavior.

#### Scenario: Preview validation finishes
- **WHEN** preview consumption is demonstrated and the mounted API configuration is restored
- **THEN** the accepted final dependency pin remains unchanged unless a separate intentional dependency update was requested, and preview evidence is reported separately from retained pinned-migration evidence
