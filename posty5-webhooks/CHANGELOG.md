# Changelog

## 4.5.1

### Security

- Ids are percent-encoded (`encodeURIComponent`) before they go into a request path. An id such as `../webhook-endpoints` or `x?y=1` used to rewrite the route (axios resolves `..`), so a caller passing user input as an id could reach a different API endpoint with its own API key. Valid ids are unchanged on the wire.
- `verifyWebhookSignature` / `signWebhookPayload` throw a `TypeError` when the secret is missing or decodes to
  fewer than 16 bytes (an unset env var, a truncated paste). An empty HMAC key is one anyone can compute, so
  forged deliveries used to verify.
- A `toleranceSeconds` that is `NaN`, infinite or negative falls back to the default 300 s instead of disabling
  the replay window.

## 4.5.0

First release. Needs `@posty5/core` 4.5.0 and the API release of visit
webhooks.

### Added

- `WebhookEndpointClient` over `/api/webhook-endpoints`: `list`, `get`,
  `create`, `update`, `delete`, `rotateSecret`, `sendTest`, `listDeliveries`,
  `redeliver`, `listEventTypes`.
- `verifyWebhookSignature` (Standard Webhooks, 300 s tolerance, rotation,
  `timingSafeEqual`), `signWebhookPayload`, `Posty5WebhookSignatureError`
  with `reason`.
- Event envelope types (`Posty5WebhookEvent`, `IShortLinkVisitedEvent`,
  `IQrCodeScannedEvent`, milestone events, `webhook.test`, `batch`).
