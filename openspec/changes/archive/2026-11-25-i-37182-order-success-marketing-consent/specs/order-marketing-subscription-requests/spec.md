# Order Marketing Subscription Requests Delta

## Purpose

Forward order-bound marketing subscription requests to Magento without customer-token forwarding or arbitrary request-body passthrough.

## ADDED Requirements

### Requirement: Marketing requests validate the order path identifier
The VSF API SHALL expose `POST /api/ext/budsies/marketing-subscription-requests` for guest and authenticated callers. The JSON body's `orderId` SHALL be a positive integer number or a numeric string that converts to one, so the Magento confirmation's string id is accepted. Any other value, including a missing one, SHALL return `400` without calling Magento. The Magento path SHALL be built from the converted integer and appear only in `/V1/orders/:orderId/marketing-subscription-requests`, not in the body.

#### Scenario: Valid order identifier
- **WHEN** a request contains `orderId: 123` or the real confirmation-shaped `orderId: "123"`
- **THEN** the Magento request targets `/V1/orders/123/marketing-subscription-requests` and its body does not contain `orderId`

#### Scenario: Invalid order identifier
- **WHEN** `orderId` is missing, zero, negative, fractional, null, an object, or non-numeric text such as `"abc"` or path-like text
- **THEN** the VSF API returns `400` and does not call Magento

### Requirement: Proxy forwards only present consent fields without a customer token
The proxy SHALL construct a new Magento body containing only the request's present `email`, `emailConsent`, `smsConsent` and `phone` fields. Absent allowed fields SHALL remain absent, and explicit false choices SHALL remain false. Extra body fields SHALL NOT be forwarded. The customer token SHALL NOT be passed to Magento, whether supplied through the query, a request header or the body. This SHALL NOT change the existing `/mailing-list-subscriptions` route.

#### Scenario: Whitelist and absent choices
- **WHEN** a request supplies email and `emailConsent: false`, omits SMS and phone, and contains unrelated extra fields
- **THEN** the Magento body contains only email and `emailConsent: false`, without defaulted SMS, phone or extra fields

#### Scenario: Customer token supplied
- **WHEN** the caller supplies a customer token together with otherwise valid request data
- **THEN** the Magento operation receives no customer token argument and no token body field

### Requirement: Request store selects Magento and responses preserve status
The proxy SHALL select Magento configuration from the request's store using the established multi-store configuration boundary. It SHALL pass successful Magento results back through the normal API response envelope with result code `200`, without interpreting boolean results. Magento errors SHALL preserve their status code and error result through that envelope, including validation errors for a missing selected channel or an invalid phone. The proxy SHALL leave Magento authoritative for consent validation and whether the order is accepted for that store.

#### Scenario: Request selects a store
- **WHEN** a request carries the Petsies or Budsies store code
- **THEN** its Magento client is configured from that request's store, not from the order id or a hardcoded brand

#### Scenario: Magento acknowledges
- **WHEN** Magento returns a successful result, including true or false
- **THEN** the API returns that result with result code `200`

#### Scenario: Magento validation error
- **WHEN** Magento rejects a request with a validation error status such as `400`
- **THEN** the API retains that status and error result instead of converting the request into success or a generic server error
