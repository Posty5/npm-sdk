# Changelog

## 2.0.0 — The store tools moved to StorVilo

**Breaking.** The Online Store Builder left Posty5 and is now StorVilo, a
separate platform (owner decision D22, 2026-10-26). Its MCP tools moved to
**`@storvilo/mcp`**; this package no longer has them. 73 tools (152 before).

- Removed the toolsets `store`, `store-catalog`, `store-orders`,
  `store-shipping` and `store-dropshipping` and their 79 tools. A connection
  that names one of them gets the remaining toolsets only (unknown names were
  always dropped), and `resolveToolsets` no longer adds `store`.
- Removed the `storeId` argument of `account_get_credit_usage`.
- Dropped the `@posty5/store` dependency; needs `@posty5/account` 5.0.0 (the
  credit-history filters without `storeId`).
- The server instructions no longer mention online stores, store IDs,
  supplier payments, orders or supplier pages.

**Release steps (owner, not done by this change):**

- Publish `@posty5/account` 5.0.0 before this package.
- Deprecate the removed store SDK, which is not published again:

  ```bash
  npm deprecate @posty5/store "Moved to @storvilo/sdk"
  ```

### Security

- A host's `connection()` that returns no API key now fails the call with a fixed message instead of letting the
  SDK fall back to the host process's own `POSTY5_API_KEY` (the call would have run as the operator's account).
- Tool ids can no longer rewrite the API route: needs `@posty5/core` ^5.0.2 and the SDK packages that encode ids
  (`html-hosting-variables` / `html-hosting-form-submission` / `social-publisher-workspace` ^5.0.1).
- `zod` floor raised to `^4.6.7` (memory-exhaustion advisory GHSA-mrhx-c7xc-m3w5).
- A host error from `beforeToolCall` or `connection()` no longer reaches the model (it could carry tokens or
  internal URLs): the model reads a fixed sentence, `afterToolCall` gets the real text as `outcome.errorMessage`.
- Idempotency keys are scoped by connection: the store sees `<scope>:<tool>:<idempotencyKey>`, the scope a
  short SHA-256 of the API key, so a store shared by several connections never replays one key holder's result
  to another. Results stored under the old `<tool>:<key>` form are not replayed after upgrading.
- `createPosty5McpNodeHandler({ allowedOrigins })` (optional): a browser request from an unlisted `Origin` is
  refused with 403 before `resolve` runs, the DNS-rebinding guard; requests without `Origin` are unaffected.
  The README example now listens on `127.0.0.1` and sets it.

## 1.3.0 — List date filters

Needs `@posty5/short-link` 5.1.0, `@posty5/qr-code` 5.2.0,
`@posty5/html-hosting` 5.1.0 and `@posty5/social-publisher-post` 5.1.0 (the
list date filters), and the API release with the list date filters
(redesign-dashboards API-03). 152 tools; no tool added or removed.

- `short_link_list`, `qr_code_list`, `html_page_list` and `social_post_list`
  take `fromDate` / `toDate` (`YYYY-MM-DD`, applied only as a pair, whole UTC
  days) and their descriptions say so.
- One shared date field: `core/store-date-field.helper.ts` is now
  `core/date-field.helper.ts`, and the account tools use it instead of their
  own `DATE_FIELD`. Same pattern and message (`YYYY-MM-DD`); no schema change
  for the store or account tools.
- `store_customer_search` / `store_customer_get` descriptions name each
  customer's `accountKind` (store, posty5 or guest) and `emailVerified`
  (storefront customer accounts), and `hasAccount: false` is described as
  "everyone else — guests and store-account holders", not "only guests".

## 1.2.0

Needs `@posty5/core` 5.0.1, `@posty5/qr-code` 5.1.0, `@posty5/account` 4.4.0
and `@posty5/qr-design` 4.7.1 (all published). 152 tools.

- `store_order_search` and `store_product_search` descriptions say that test-mode orders carry
  `isTest: true` and demo records `isDemo: true`, both removed when the store is published. No publish
  tool, by design (irreversible data deletion, owner-only, typed confirmation).

Needs `@posty5/account` 4.4.0 (credit transfers).

- New read tools in `account`: `account_get_credit_transfer_eligibility` and
  `account_list_credit_transfers` (credit transfers between Posty5 accounts,
  counterparty masked). No send tool: sending is session-only. The
  `account_get_credit_usage` `kind` filter accepts every ledger kind, including
  `transferOut` / `transferIn`. 152 tools.

Needs `@posty5/qr-code` 5.1.0 (`getExportUrl`, `checkScannability`) and
`@posty5/core` 5.0.1; new dependency `@posty5/qr-design` 4.7.1 (exact), for
the print preset list.

- New read tools in `qr-codes`, after `qr_code_get`: `qr_code_render` (a
  signed PNG / SVG / PDF download link with the print size it prints at and
  the minutes it lasts — no image bytes) and `qr_code_check_scannability`
  (`qrCodeId` xor `templateId`, optional print size). A plan refusal of a
  vector or print request keeps the API's message and adds the plain-PNG
  hint. 150 tools.

Needs `@posty5/short-link` / `@posty5/qr-code` with `getAnalytics()` (link-qr-visit-analytics).

- New read tools `short_link_get_analytics` and `qr_code_get_analytics`:
  visit totals, series and breakdowns, `meta.locked` passed through. 148 tools.

Needs `@posty5/short-link` 4.6.0.

- Short link controls: `short_link_create` / `short_link_update` take `tags`,
  `campaignId`, `health`, `access` (with a write-only `password`), `routing`,
  `variants`, `utm`, `pixels` and `pixelsConsentAcknowledged`; `short_link_list`
  filters by `tags` and `campaignId`. `short_link_update` no longer resends the
  deprecated `tag`. New tools: `short_link_set_rules`, `short_link_list_tags`,
  `short_link_check_health`, `short_link_campaign_list` / `_get` / `_create` /
  `_update` and `short_link_campaign_delete` (full, `confirm`, `detach`).
  Short link results never carry `access.password`. 146 tools.

Needs `@posty5/qr-code` 4.7.0.

- `qr_code_create` / `qr_code_update` take the QR content types `vcard`,
  `event`, `whatsapp`, `review`, `social` (up to 12 profiles), `appStore` and
  `file` — no new tool; the tool count is unchanged. `vcard` defaults to
  static (QT-D12); `appStore` and `file` are always dynamic (`mode: "static"`
  is refused before any call). `file` takes `fileBase64` (a `data:` URL
  prefix is stripped), `fileName` and `mimeType`, at most 5 MB decoded
  (`QR_MCP_FILE_MAX_BYTES`), uploaded through `createFile` / `updateFile`;
  an update without `fileBase64` keeps the stored file.
  `qr_code_create_many` rows keep the seven original types.

## 1.1.0

Needs `@posty5/qr-code` 4.6.0 for the dynamic QR parameters.


- `short_link_create_many` and `qr_code_create_many` (write, always `confirm`):
  1–25 rows per call, per-row results, the call's `idempotencyKey` (or the
  host's `callId`) sent as the batch key. `qr_code_create_many` with
  `zip: true` runs a QR bulk job, waits up to 45 s and answers signed,
  expiring links to the image ZIP. New read tool `qr_code_get_bulk_job`.
  138 tools. Needs `@posty5/core`, `@posty5/short-link` and `@posty5/qr-code`
  4.5.0.
- `qr_code_create` takes `mode` (`"static"` | `"dynamic"`), **default
  `"dynamic"`** so the target can be changed later with `qr_code_update`;
  Wi-Fi codes are always static (a dynamic Wi-Fi request is refused before
  any call).
- `qr_code_update` takes an optional `mode`; left out, the stored mode is kept.
- `qr_code_create` / `qr_code_update` take an optional `access` (scan rules:
  `activeFrom`, `expiresAt`, `maxVisits`, `fallbackUrl`); `null` clears, left
  out keeps. Refused before any request on Wi-Fi or an explicitly static code;
  the API's plan 403 is returned as is.
- `qr_code_list` filters by `mode`; list/get describe `mode`, `dynamicSince`
  and `qrCodeLandingPageURL`.

## 1.0.0

First release.

- 135 tools in 10 toolsets over every Posty5 SDK package; `listToolsets()`, `listTools()`.
- Store shipping prices parcels the API's current way: one size per package
  profile, priced per place (`store_shipping_get_place_prices`,
  `_save_place_prices`, `_list_parcel_prices`, `_update_parcel_price`,
  `_remove_parcel_price`). Needs `@posty5/store` 4.4.0.
- `createPosty5McpServer(options)`: access levels `read` / `write` / `full`,
  toolset selection, `confirm` on irreversible and paid tools, `aiModel` and
  `idempotencyKey` on every write, `X-Posty5-Agent` attribution, host hooks.
- `short_link_create` takes a required `templateId`, as `qr_code_create` does:
  the API refuses an API-key short-link create without one.
- `posty5-mcp` stdio binary (`npx -y @posty5/mcp`), configured by environment.
- `createPosty5McpNodeHandler`: Streamable HTTP for both protocol eras,
  per-request options, 2025-era client identity carried by a signed
  `Mcp-Session-Id`, body cap. Hosts pass `connection(call)`; the package
  builds the SDK client.
- Built on `@modelcontextprotocol/server` 2.3.1 and `/node` 2.1.1; Node.js 20 or later.
- Agent-origin normalisation matches the API's
  (`api/apps/identity-service/tests/agent-origin.test.ts`) — change both together.
