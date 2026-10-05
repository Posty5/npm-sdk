# Changelog

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
