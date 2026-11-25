# Proposal

## Why

The Order Success marketing-consent form needs an order-bound submission endpoint, including for guests and Express Checkout customers. The existing mailing-list route forwards arbitrary fields and a customer token, so it is not the appropriate boundary for this request.

## What Changes

- Add `POST /api/ext/budsies/marketing-subscription-requests` alongside the existing mailing-list route.
- Accept order ids as positive integer numbers or canonical positive decimal strings (including Magento's `"123"` confirmation shape), rejecting invalid ids before creating a Magento request; forward only allowed consent fields and put the validated id exclusively in the Magento path.
- Select Magento configuration from the request store, omit the customer token, and preserve Magento result/error statuses through `apiStatus`.
- Leave existing mailing-list behavior unchanged.

## Capabilities

### New Capabilities

- `order-marketing-subscription-requests`: Validated, whitelisted, store-aware anonymous proxy for order marketing requests.

### Modified Capabilities

None.

## Impact

- `src/api/extensions/budsies/index.js` and focused route tests under its `test/unit/` directory.
- Uses the existing Express router, `Magento2Client`, `multiStoreConfig` and `apiStatus`; no dependencies or customer-authentication flow are added.
- Requires Magento #37180 before API release. The storefront companion change has the same name and is released after this endpoint.
