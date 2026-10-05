# 05 - Public API Surface

| Public surface | Behavior | Source |
| --- | --- | --- |
| `HttpClient` | get/post/put/patch/delete, getBinary (file downloads), setApiKey, clearAuth. | `posty5-core/src/http/client.ts` |
| `StoreClient` | Six sub-clients — `products`, `orders`, `tags`, `customers`, `shipping`, `suppliers` (dropshipping, `/api/store-suppliers`) — plus four legacy shorthands. | `posty5-store/src/store.client.ts` |
| `ShortLinkClient` | list/get/create/update/delete. `templateId` required on create/update; `androidUrl`/`iosUrl` (create/update) and `isEnableLandingPage` (create, list filter); `get`/`create`/`update` return full details. `isEnableMonetization` is `@deprecated` and stripped from every body and query; `"pageinfo.title"` is `@deprecated` and sent as `"pageInfo.title"`. `getAnalytics(id, query?)` → `GET /api/short-link/:id/analytics` and `statistics(query?)` → `GET /api/short-link/statistics` (4.4.0, VA; shared types and query helpers in core, D08/D09). | `posty5-short-link/src/short-link.client.ts` |
| `QRCodeClient` | create/update by QR type plus get/list/delete. Structured types send `qrCodeTarget` only — the API builds the encoded `options.text`; free text sends `options.text = text`. `isEnableMonetization` `@deprecated` and stripped; `isEnableLandingPage` on requests and as a list filter. Requests are not mutated. `getAnalytics(id, query?)` → `GET /api/qr-code/:id/analytics` and `statistics(query?)` → `GET /api/qr-code/statistics` (4.4.0, VA; visits of the codes' Posty5 pages, not scans of a static image). | `posty5-qr-code/src/qr-code.client.ts` |
| `HtmlHostingClient` | file/GitHub create/update, get/list/lookup/forms/cache/delete. | `posty5-html-hosting/src/html-hosting.client.ts` |
| `HtmlHostingVariablesClient` | create/get/update/delete/list. | `posty5-html-hosting-variables/src/html-hosting-variables.client.ts` |
| `HtmlHostingFormSubmissionClient` | get/next-previous/list/change-status/delete. | `posty5-html-hosting-form-submission/src/html-hosting-form-submission.client.ts` |
| `SocialPublisherWorkspaceClient` | list/get/get-for-new-post/create/update/delete. | `posty5-social-publisher-workspace/src/social-publisher-workspace.client.ts` |
| `SocialPublisherPostClient` | list/defaults/status/navigation/remove and publish video/image. | `posty5-social-publisher-post/src/social-publisher-post.client.ts` |

This is a compatibility surface. Treat exported names, operations, parameter values, types, and behavior as semver-sensitive.

Machine-readable routing metadata lives in [ROUTE_INDEX.json](ROUTE_INDEX.json).
