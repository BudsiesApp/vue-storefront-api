# Design

## Context

See [proposal.md](proposal.md) for motivation. `src/api/extensions/budsies/index.js` registers the existing routes on one Express router and creates Magento clients with `Magento2Client(multiStoreConfig(config.magento2.api, req))`. Its `/mailing-list-subscriptions` handler forwards the whole body and `getToken(req)`; the new request must not copy those two behaviors. `apiStatus` provides the normal result envelope. Jest discovers tests under `src/**/test/unit/**/*.spec.(js|ts)`.

The extension currently imports `multiStoreConfig` from `platform/magento1/util`, whose routing differs from `platform/magento2/util`. Keep that observed fact explicit when checking store routing; this change does not authorize a silent rewrite of every Budsies route.

Magento order placement returns an id such as `"123"` as a JSON string. `src/platform/magento2/o2m.js` copies its result directly into `confirmation.magentoOrderId`; a numeric storefront annotation does not convert that runtime value. The companion form/request type is `number | string` and preserves the confirmation id for validation here.

## Goals / Non-Goals

**Goals:** An order-bound anonymous proxy with one authoritative path-id check and a new whitelisted body. Reuse the existing router/client/status boundary with a small handler (cost rungs 2 and 4).

**Non-Goals:** Magento consent/order validation, new customer authentication, order/store lookup, retries or persistence, changes to the mailing-list route, broad multi-store refactoring, or frontend mounting.

## Decisions

### 1. Reject invalid ids at API intake

Register POST `/marketing-subscription-requests` next to `/mailing-list-subscriptions`. Read `orderId` from JSON, convert it with `Number()` and accept it only if `Number.isInteger()` and greater than zero, validating before constructing a client or path. A string such as `"123"` is therefore accepted like `123`. Everything else (missing, null, objects, zero, negatives, fractions, non-numeric text) gets `apiStatus(res, 'The field orderId must be a positive integer', 400)` and the handler returns. Odd numeric strings such as `"1e2"` or `" 123 "` are accepted as their number; this is safe because the Magento path is built from the integer. No additional duplicate id validation or conversion is needed in the storefront.

**Alternative:** Convert the confirmation id in the storefront and accept numbers only here. That splits the id contract across two boundaries and needlessly coerces Magento's existing decimal-string shape. Accepting both representations at API intake establishes the path invariant once with a small type/pattern check; arbitrary interpolation or deferring the check to Magento does not.

### 2. Copy only present allowed fields and omit customer authentication

Construct a fresh object by copying own present keys from `email`, `emailConsent`, `smsConsent`, `phone`; use presence, not truthiness, so `false` is preserved and absent fields stay absent. `orderId` belongs only in the path. Call the Magento client's REST POST without a customer-token argument and do not call `getToken` for this operation. A token reaching the API via TaskQueue/header configuration must not be forwarded to Magento. Existing integration authentication configured on `Magento2Client` is not customer authentication and remains unchanged.

Let Magento validate email, selected channels and phone. Do not add a second consent policy, default absent booleans, or inspect customer identity in the proxy.

**Alternative:** Reuse or modify the mailing-list route. Its body/token contract is different, and changing it risks unrelated subscription callers. A small separate route is cheaper and narrower.

### 3. Use the existing Magento client and status envelope

Create the client through `Magento2Client(multiStoreConfig(config.magento2.api, req))`. Pass the unversioned resource `/orders/${validatedOrderId}/marketing-subscription-requests` to its REST POST method, using the validated integer from intake and the `pick`-whitelisted body only. The client adds `/V1` to construct the final Magento HTTP path `/V1/orders/${validatedOrderId}/marketing-subscription-requests`. Pass fulfillment to `apiStatus(res, result, 200)` and rejection to `apiStatus(res, error, error.code)`. Do not reinterpret boolean results or convert Magento validation failures into success.

**Alternative:** Manually construct per-brand hosts/store URLs or introduce a separate HTTP client. That would duplicate configuration/protocol handling. Existing multi-store selection is the required boundary; a demonstrated mismatch must be reported rather than silently worked around in this feature.

## Risks / Trade-offs

- [Magento intentionally acknowledges some declined requests] → Preserve the result; the UI considers any `200` successful and does not query for actual acceptance.
- [Existing extension imports the Magento1 multi-store helper] → Tests establish the new handler passes the request and Magento2 base configuration into the existing boundary. Runtime verification must additionally show the Success-page store code reaches the order's Magento store for Petsies, and for Budsies after its form mounting. A direct API test is useful but cannot replace the page-level check. Report an observed mismatch without expanding scope to unrelated routes.
- [The proxy accepts partial consent data] → This is intentional: preserve absent keys and delegate semantic validation/status to Magento rather than duplicating it.

## Validation Approach

Add focused tests in `src/api/extensions/budsies/test/unit/marketing-subscription-requests.spec.js`. Invoke the registered handler with mocked router/client/configuration collaborators, capturing the REST call. Assert numeric `123` and confirmation-shaped `"123"` both pass the unversioned resource path to the client, with non-positive-integer ids rejected before a Magento call. Exercise the real client with its outbound request intercepted to verify the final HTTP path contains exactly one `/V1`. Assert the complete whitelist, absent-vs-false behavior, no customer token argument/body passthrough, id placement, request-store configuration handoff, successful true/false results and Magento error-code propagation. Keep the existing `/mailing-list-subscriptions` registration unchanged. Run the focused Jest test and relevant API lint/build checks without introducing network calls into the unit suite.

## Migration Plan

No database or configuration migration. Deploy only after Magento #37180 and before the companion storefront feature. If rollback is necessary, disable/remove the frontend caller first and then roll back the additive route. Existing mailing-list callers are unaffected. No deployment is part of implementation.
