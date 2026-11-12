# Amazon Pay package releases

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
