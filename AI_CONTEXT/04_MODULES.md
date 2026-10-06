# 04 - Modules and Ownership

| Area | Purpose | Primary path |
| --- | --- | --- |
| `core` | HttpClient, retry/error handling, common types, pagination, and signed uploads; shared bulk plumbing (`http/link-bulk-job.api.ts` `LinkBulkJobApi`, `utils/link-bulk.helper.ts` chunked `createMany` with per-chunk `Idempotency-Key`, `types/link-bulk.interface.ts`). | `posty5-core/src` |
| `short-link` | Short-link CRUD/list client; `createMany` (sync `POST /api/short-link/bulk`, 100-row chunks), bulk jobs (`createBulkJob`/`getBulkJob`/`getBulkJobResultUrl`/`cancelBulkJob`/`waitForBulkJob`, kind `shortLinks`), `export` (CSV/JSON). | `posty5-short-link/src` |
| `qr-code` | Seven QR types with create/update/get/list/delete; `createMany` (sync `POST /api/qr-code/bulk`), bulk jobs (kind `qrCodes`, `options.image`, `result-url?file=zip`), `export`. | `posty5-qr-code/src` |
| `html-hosting` | File/GitHub create/update and hosting management. | `posty5-html-hosting/src` |
| `html-hosting-variables` | pst5_-prefixed hosting variable CRUD/list. | `posty5-html-hosting-variables/src` |
| `html-hosting-form-submission` | Submission get/navigation/list/status/delete. | `posty5-html-hosting-form-submission/src` |
| `social-publisher-workspace` | Workspace CRUD/list and signed logo upload. | `posty5-social-publisher-workspace/src` |
| `social-publisher-post` | Video/image publishing, upload orchestration, status and list. | `posty5-social-publisher-post/src` |
| `webhooks` | `WebhookEndpointClient` over `/api/webhook-endpoints` (list/get/create → `{ endpoint, secret }`/update/delete/rotateSecret/sendTest/listDeliveries with `status`+`eventType`/redeliver/listEventTypes) and the Node-only Standard Webhooks verifier `verifyWebhookSignature` / `signWebhookPayload`. | `posty5-webhooks/src` |

## Bulk and webhooks (4.5.0)

- Bulk-job methods are duplicated per package (`ShortLinkClient`, `QRCodeClient`) as thin wrappers over core's `LinkBulkJobApi(http, kind)`; there is no separate bulk package.
- `createMany` splits rows into chunks, sends each with `Idempotency-Key: <key>-<chunk>` and retries a chunk only on a network error / 5xx (`isRetryableBulkError`), so a resend never double-creates.
- `@posty5/webhooks` is not exposed through MCP (api BW-D12). The verifier needs Node `crypto`.
- Request/response shapes mirror `api/AI_CONTEXT/modules/link-tools-service/link-bulk-job.md` and `webhook-endpoint.md`.

## Editing rule

Start changes in the owning module. Move code to shared/core only after more than one feature genuinely owns the behavior. Update this file and [MODULE_INDEX.json](MODULE_INDEX.json) when ownership changes.
