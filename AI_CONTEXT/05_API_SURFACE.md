# 05 - Public API Surface

| Public surface | Behavior | Source |
| --- | --- | --- |
| `HttpClient` | get/post/put/patch/delete, getBinary (file downloads), setApiKey, clearAuth, `createdFrom` getter. Sends `X-Posty5-Client: posty5-npm/<version>`; public config `headers`, `createdFrom`, `maxRetries`, `timeout`. Retry policy `shouldRetryRequest` (4.3.0): POST/PATCH never retried after a response. | `posty5-core/src/http/client.ts`, `retry-policy.helper.ts`, `client.config.ts` |
| `StoreClient` | Seven sub-clients — `products`, `orders`, `tags`, `customers`, `shipping`, `suppliers` (dropshipping, `/api/store-suppliers`), `stores` (`/api/store/lookup`) — plus `listStores(term?)` and four legacy shorthands. | `posty5-store/src/store.client.ts` |
| `ShortLinkClient` | list/get/create/update/delete. | `posty5-short-link/src/short-link.client.ts` |
| `QRCodeClient` | create/update by QR type plus get/list/delete. | `posty5-qr-code/src/qr-code.client.ts` |
| `QRCodeTemplateClient` | listUserTemplates / listPublicTemplates (read-only). | `posty5-qr-code/src/qr-code-template.client.ts` |
| `HtmlHostingClient` | file/GitHub create/update, get/list/lookup/forms/cache/delete. | `posty5-html-hosting/src/html-hosting.client.ts` |
| `HtmlHostingVariablesClient` | create/get/update/delete/list. | `posty5-html-hosting-variables/src/html-hosting-variables.client.ts` |
| `HtmlHostingFormSubmissionClient` | get/next-previous/list/change-status/delete. | `posty5-html-hosting-form-submission/src/html-hosting-form-submission.client.ts` |
| `SocialPublisherWorkspaceClient` | list/get/get-for-new-post/create/update/delete. | `posty5-social-publisher-workspace/src/social-publisher-workspace.client.ts` |
| `SocialPublisherAccountClient` | list/lookup/get connected social accounts (read-only, no tokens). | `posty5-social-publisher-workspace/src/social-publisher-account.client.ts` |
| `AccountClient` | getCurrent (`/api/api-key/current`), getCredits, getCreditUsage, getCreditUsageSummary, getOperationCosts (`@posty5/account`, new in 4.3.0). | `posty5-account/src/account.client.ts` |
| `SocialPublisherPostClient` | list/defaults/status/navigation/remove and publish video/image/text/story (text and story added in 4.6.0). | `posty5-social-publisher-post/src/social-publisher-post.client.ts` |

This is a compatibility surface. Treat exported names, operations, parameter values, types, and behavior as semver-sensitive.

Machine-readable routing metadata lives in [ROUTE_INDEX.json](ROUTE_INDEX.json).
