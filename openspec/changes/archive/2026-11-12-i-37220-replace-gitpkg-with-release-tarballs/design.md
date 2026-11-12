# Design

## Context

See `proposal.md` for motivation. The maintained base is `budsies`, not stale remote default `optimuspro`. The mounted checkout was fast-forwarded to `2ced517` before creating `37220-replace-gitpkg-with-release-tarballs`. The existing newline-only `.env.example` edit was stashed, reapplied and verified unchanged in intent; unrelated untracked files remain untouched.

`package.json` and the Yarn Classic lockfile reference Amazon Pay at `d9f6fcd224938bbcb7472306946d2a947c3ae5e6`. `src/api/index.ts` imports the package and mounts its router at `/ext/amazon-pay` under the API prefix. The source package's `index.js` exports the existing CommonJS router factory; no install-time generation is required. The maintained build uses Node 14 and copies GraphQL/schema files after TypeScript compilation. Existing `yarn lint` applies `--fix`; acceptance uses its non-mutating equivalent.

## Goals / Non-Goals

**Goals:** Change only artifact transport and traceability while preserving the API's existing package and extension-loading contract.

**Non-Goals:** Node/Yarn upgrades, runtime source changes, payment requests, configuration/credential changes, application deployment or removal of historical dependency URLs.

## Decisions

### Consume the source repository's published package

The companion `BudsiesApp/vsf-amazon-pay` change publishes `amazon-pay.tgz` under a `packages-*` tag, initially proposed as `packages-37220-v1`. Select the real release URL:

`https://github.com/BudsiesApp/vsf-amazon-pay/releases/download/<release-tag>/amazon-pay.tgz`

Verify release metadata and SHA-256 identify the initial source commit and package `@vue-storefront-api/amazon-pay@0.1.0`. If that tag is occupied, use the publisher's new tag rather than repointing it. The packaging revision is separate from the source pin; selecting a prepared package is not permission to update its implementation.

Change the root manifest dependency and regenerate the relevant Classic lock entry in the existing API container/Node 14 toolchain, preserving all unrelated versions and the lockfile format. Final lock generation needs the real published URL; do not commit a local-file URL, an invented integrity value or a repository source archive. A subsequent `yarn install --frozen-lockfile` verifies the generated graph. Native Git/workspace dependencies would introduce repository preparation and are not used.

### Preserve extension initialization

No change is planned in `src/api/index.ts`, route code, runtime dependencies or configuration templates. A focused contract/loading check uses the installed package and initializes its router with a minimal non-production config, without invoking any payment route or reading real secrets. The factory registers handlers; external payment work occurs on handler execution, not during router creation. Keep the existing `/api/ext/amazon-pay` route contract.

### Checks and acceptance ownership

The implementer adds a focused check for the release-specific dependency/lock URL, no active GitPkg dependency references and package entry loading with preserved identity. Use the existing Jest/Node 14 tooling rather than adding a new test platform. Run targeted checks and review the dependency-only diff.

The tester owns anonymous download/checksum verification, cache-empty `yarn install --frozen-lockfile` with GitPkg unavailable, `yarn build`, non-mutating lint of `src` and `scripts` (the existing lint targets without `--fix`), `yarn test:unit` and extension initialization/mount smoke evidence. An external payment request is neither needed nor authorized. Four Compose brand services share this manifest/lock; there is no separate API app dependency branch for each brand. Record any pre-existing check failure separately rather than modifying unrelated source or claiming a pass.

## Risks / Trade-offs

- Old runtime dependency behavior is deliberately preserved → validate on the existing Node 14 API stack; do not fold security/library upgrades into this transport migration.
- Cached installed modules can hide unavailable URLs → tester performs empty-cache frozen installation, not only a build against existing `node_modules`.
- Source publication requires external authorization/access → lead resolves it before tag publication; local generation is not proof of public hosting and final URL/lock acceptance stays open until verified.
- Historical dependencies remain valid → audit maintained manifests/locks and package manifests, not historical commits or contextual OpenSpec text; retain the GitPkg deployment.

## Migration Plan

Review/implement source packaging and publish with lead authorization. Verify the public archive and provenance, then update the API dependency and lockfile and hand off maintained build/check/loading acceptance. The Storefront UI pair is independent and can be prepared in parallel. This change does not authorize merges or production operations; a later authorized rollback selects the previous consumer dependency commit without changing published assets.

## Approved preview-consumption extension

### Retained baseline and explicit handoff

The original targeted migration is implemented and accepted (D18–D21); PR #144 head `70c58053` consumes `packages-37220-v1`. Preserve that final dependency pin, its published provenance/assets and completed unchanged acceptance. The extension adds feature-testing convenience; it does not negate the original evidence or select an unrelated dependency upgrade.

The source publisher provides `python3 scripts/preview-packages.py --source-ref <branch-or-full-commit>` from a committed, pushed packaging checkout using supported existing Python/Git/authenticated `gh`. It resolves the source once, manages a `package-preview-<identity digest>` release/tag, and returns the exact archive URL and source/packaging/checksum handoff including the exact toolchain without per-iteration config/test commits or manually prepared tags. No workflow-dispatch/default-branch setup is required. After verifying provenance/checksums, maintainers still explicitly update the API manifest and regenerate its Classic lock using the existing Node 14 container.

Document selecting an unmerged feature, another iteration and finally the actual merged SHA using that same command. Use the returned immutable URL, not a branch alias. Keep this a manual consumer step; no automatic API commit/PR or publication-on-push is added.

### Contract check and generic source compatibility

`scripts/check-amazon-pay-release.js` currently accepts only `packages-*`. Extend it to the companion repository's supported explicit-release and `package-preview-<64 lowercase hex>` identities, retaining asset/repository restrictions, lock presence, no-GitPkg, package-name and router-initialization checks. Separate initial version/pin regression expectations from generic selected-preview checks so a maintainer never edits a hard-coded initial expectation per invocation. A preview's identity/version comes from its resolved source and published provenance, not an implicit source upgrade or the packaging checkout.

Focused regression cases cover release/preview URLs and unsupported old/moving dependency references. API entry loading stays non-production and does not execute payment handlers. No production configuration, package-manager version, runtime payment code or credentials change is planned.

### Acceptance without replacing final pins

Tester consumes the returned asset in an identified temporary API feature/testing graph, verifies frozen installation and targeted build/loading compatibility, and restores temporary manifest/lock/environment/dependency changes while preserving unrelated user edits. Do not commit arbitrary preview sources as the accepted final pin. Report preview evidence separately from retained original publication/cache-empty/build/router-mount evidence and its existing caveats; rerun checks actually affected by the eventual code diff rather than declaring every unchanged result invalid.

The publisher owns live command publication, branch advancement, identical reuse/conflict/partial handling and post-merge selection tests. Input-10 authorizes later preview tags/releases/assets after source checks pass in both source repositories, supplementing input-4 without authorizing merge/deployment/archive/issue transitions. Missing access must be surfaced to the lead; this specification revision performs no publication.
