# Tasks

## 1. Order marketing proxy

- [x] 1.1 Register POST `/marketing-subscription-requests` in `src/api/extensions/budsies/index.js` beside the unchanged mailing-list route; convert `orderId` with `Number()` and require a positive integer before constructing a Magento client, building the path from that number; verify numeric `123` and confirmation-shaped `"123"` both reach the correct Magento path, while other ids return `400` without a Magento call.
- [x] 1.2 Build a body with lodash `pick` from only present `email`, `emailConsent`, `smsConsent` and `phone`, put the id only in `/V1/orders/:orderId/marketing-subscription-requests`, and POST without a customer-token argument through the request-configured Magento client; verify route tests assert complete whitelist, false/absent distinctions, path, store-configuration handoff and omission of supplied token/extra fields.
- [x] 1.3 Pass Magento fulfillment and errors through `apiStatus` using the existing `200`/`error.code` pattern; verify tests preserve true/false results and Magento validation/error statuses without adding semantic consent validation to the proxy.

## 2. Implementation validation

- [x] 2.1 Run `yarn test:unit --runInBand src/api/extensions/budsies/test/unit/marketing-subscription-requests.spec.js`, relevant API regression tests and non-mutating lint/build checks; verify changed-route checks pass and existing mailing-list behavior is unchanged.
- [x] 2.2 Run `openspec validate i-37182-order-success-marketing-consent --strict`; verify the implemented endpoint matches its whitelist, anonymous-forwarding and request-store contract without unrelated routing changes.
