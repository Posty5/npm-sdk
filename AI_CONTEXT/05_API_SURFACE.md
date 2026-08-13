# 05 - Public API Surface

| Public surface | Behavior | Source |
| --- | --- | --- |
| `HttpClient` | get/post/put/patch/delete, getBinary (file downloads), setApiKey, clearAuth. | `posty5-core/src/http/client.ts` |
| `StoreClient` | Five sub-clients — `products`, `orders`, `tags`, `customers`, `shipping` — plus four legacy shorthands. | `posty5-store/src/store.client.ts` |
| `ShortLinkClient` | list/get/create/update/delete. | `posty5-short-link/src/short-link.client.ts` |
| `QRCodeClient` | create/update by QR type plus get/list/delete. | `posty5-qr-code/src/qr-code.client.ts` |
| `HtmlHostingClient` | file/GitHub create/update, get/list/lookup/forms/cache/delete. | `posty5-html-hosting/src/html-hosting.client.ts` |
| `HtmlHostingVariablesClient` | create/get/update/delete/list. | `posty5-html-hosting-variables/src/html-hosting-variables.client.ts` |
| `HtmlHostingFormSubmissionClient` | get/next-previous/list/change-status/delete. | `posty5-html-hosting-form-submission/src/html-hosting-form-submission.client.ts` |
| `SocialPublisherWorkspaceClient` | list/get/get-for-new-post/create/update/delete. | `posty5-social-publisher-workspace/src/social-publisher-workspace.client.ts` |
| `SocialPublisherPostClient` | list/defaults/status/navigation/remove and publish video/image. | `posty5-social-publisher-post/src/social-publisher-post.client.ts` |

This is a compatibility surface. Treat exported names, operations, parameter values, types, and behavior as semver-sensitive.

Machine-readable routing metadata lives in [ROUTE_INDEX.json](ROUTE_INDEX.json).
