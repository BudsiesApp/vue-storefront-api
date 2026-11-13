# Amazon Pay package releases

Push a non-maintained package branch containing the branch preview workflow to
publish a public `<branch>_<short-sha>` prerelease from the pushed commit. Its
workflow summary provides the asset URL, manifest and checksums. Update the API
URL and lockfile for testing; publication does not change or deploy the API.

Alternatively, for an unmerged package feature, run `python3 scripts/preview-packages.py
--source-ref <branch-or-full-sha>` in the committed, pushed Amazon Pay publisher
checkout. Verify the returned source/packaging SHAs and manifest/checksum URLs.
Use its exact URL in a temporary API testing graph, regenerate the lock in the
Node 14 container, test router initialization without invoking payment handlers,
then restore accepted pins. Rerun for an advanced branch and pass the actual
merged SHA after merge. No publisher config/test commit or manual tag is needed.

The API consumes `amazon-pay.tgz` from `BudsiesApp/vsf-amazon-pay` releases.
Download `release-manifest.json`, `SHA256SUMS` and the archive anonymously,
run `sha256sum -c SHA256SUMS`, and verify the package source commit independently
from the packaging commit. Initial tag `packages-37220-v1` selects source
`d9f6fcd224938bbcb7472306946d2a947c3ae5e6`.

For a later release, update the `@vue-storefront-api/amazon-pay` URL, run
`docker compose exec app-petsies yarn install`, and commit the generated Yarn
Classic lockfile and manifest. Run `docker compose exec app-petsies node
scripts/check-amazon-pay-release.js`, the frozen install and maintained API
checks. The contract initializes the router without invoking payment handlers.
Retain previous release assets and GitPkg URLs used by historical revisions.
