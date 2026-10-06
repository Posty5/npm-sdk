# 18 - Decisions

## D01 - Feature packages share @posty5/core rather than duplicating transport.

**Status:** observed in current source. Revisit only with compatibility, migration, and verification impact documented.

## D02 - Packages publish CJS, ESM, and type declarations from dist.

**Status:** observed in current source. Revisit only with compatibility, migration, and verification impact documented.

## D03 - The root package is private and orchestrates eight workspaces.

**Status:** observed in current source. Revisit only with compatibility, migration, and verification impact documented.

## D04 - Feature clients expose typed domain operations rather than raw endpoint strings.

**Status:** observed in current source. Revisit only with compatibility, migration, and verification impact documented.

## D05 - ROUTE_INDEX is empty because this repository is a client SDK.

**Status:** observed in current source. Revisit only with compatibility, migration, and verification impact documented.

## D06 - A request key the API never accepted is deprecated and stripped, not deleted, in a minor.

**Status:** decided 2026-10-05 (link + QR truth pass, owner decision TP-D5 default).
`isEnableMonetization` on `@posty5/short-link` and `@posty5/qr-code` was typed,
documented and sent, but every API Joi schema rejects it, so any request that
carried it answered 400. In 4.3.0 it stays in the types as `@deprecated` and the
clients delete it from every body and query (`ShortLinkDeprecatedRequestKeysConst`,
`QrCodeDeprecatedRequestKeysConst`), so old code compiles and stops failing. It
is deleted in 5.0.0. Deleting it in the minor would break compilation for code
that only ever named it. The legacy list key `"pageinfo.title"` follows the same
rule: deprecated, sent as `"pageInfo.title"`.

## D07 - The server, not the SDK, builds the text a QR code encodes.

**Status:** decided 2026-10-05 (link + QR truth pass, feature contract "API
changes (QR code)"). The API builds `options.text` for all seven types from
`qrCodeTarget` with one escaping encoder and ignores a client-sent value, so its
URL safety checks inspect exactly what the image encodes. `QRCodeClient` sends
`qrCodeTarget` only for `email`, `wifi`, `call`, `sms`, `url`, `geolocation`; free
text keeps `options.text = text` (the same value as `freeText.text`). The SDK's
old encoders were unescaped and sent `undefined` for omitted fields. Never add a
client-side encoder back as the source of the stored text.

## D08 - `statistics()` waited for C2 (added in 4.4.0).

**Status:** deferred 2026-10-05 (owner decision TP-D6 default). The statistics
route groups links by **creation** date, and contract C2 of the link + QR
roadmap redefines `daily`. Publishing today's meaning in a typed client would
freeze a meaning the visitor-analytics feature (VA) changes; VA's SDK task adds
the method after C2.

**Update 2026-10-05 (VA):** VA's npm-sdk task
(`.agent/tasks/link-qr-visit-analytics/npm-sdk/link-qr-analytics-methods`)
first shipped `getAnalytics()` only. The owner then decided to add
`statistics()` in the same 4.4.0 release, now that `daily` means visits per
UTC day (C2): `ShortLinkClient.statistics()` / `QRCodeClient.statistics()`,
`GET /api/{short-link,qr-code}/statistics` with `period` / `from` / `to`. Top
rows carry `visitsInRange`; records with no visits in the range are left out
of the top list. D08 is resolved.

## D09 - Link analytics types and query serialization live in `@posty5/core`.

**Status:** decided 2026-10-05 (VA npm-sdk task). The short-link and QR-code
analytics answers are the same shape (C2), so `ILinkAnalyticsQuery`,
`ILinkAnalyticsResponse` and the unions are declared once in
`posty5-core/src/types/link-analytics.interface.ts` (the task plan named
`src/interfaces/`; core keeps its interfaces under `src/types/`) and
re-exported as types by both packages. `toLinkAnalyticsQuery` joins a breakdown
list with `,` (axios would send `breakdown[]=…`), passes `"all"` through, omits
an empty list (an omitted `breakdown` means every breakdown the plan allows), and sends a `Date` as its **UTC** calendar day via
`toIsoDateString` — a `Date` is an instant, and the API reads `from`/`to` as days
in `tz`, so callers who care pass `YYYY-MM-DD` strings. The 403 of a gated
breakdown is the core `AuthorizationError` with the API's message; the SDK names
no plan (C4). A missing record answers 400 (`ValidationError`, "The Short Link
Is Not Found" / "The QR Code Is Not Found"), not 404. The statistics envelope, range, visit totals and daily row are declared in
`posty5-core/src/types/link-statistics.interface.ts`; each package declares
its own `totals` and top row. Consequence: `@posty5/core`, `@posty5/short-link`
and `@posty5/qr-code` all go to 4.4.0 with a `^4.4.0` core peer — core skips
nothing: 4.3.0 is the MCP release (`mcp-wave-2`), which merges first. The packages were
already out of lockstep after the truth pass (core 4.2.0, short-link/qr-code/
store 4.3.0).

## D10 - The QR design engine lives in npm-sdk and is an in-house composer.

**Status:** decided 2026-10-06 (`qr-design-and-export`, QD-D1/D2/D8 defaults).

- **Where it lives (QD-D2).** `@posty5/qr-design` lives here because:
  - the api cannot consume ui-shared, which is Angular-bound;
  - three copies would drift.

  The api, dashboard and web install it at an exact version.
- **Renderer (QD-D1).** The engine is an in-house SVG composer, not `qr-code-styling`. Legacy (v1) designs stay on EasyQRCode and are not rendered here.
- **Encoder.** `qrcode-generator` 2.0.4 is bundled; it is small and dependency-free with deterministic mask choice.
- **Frame text (QD-D8).** Frame text is drawn as outlines. The spike found that opentype.js 2.0 throws on Noto Sans Arabic's GSUB (lookup type 6). The engine therefore:
  - shapes Arabic to Unicode presentation forms itself;
  - draws pre-extracted glyph outlines, so no font is parsed at runtime.

  HarfBuzz (wasm) was not needed. Known limits: no kerning, and harakat are dropped.
- **Test decoder.** Fixtures are decoded with ZXing (`@zxing/library`), not jsQR. jsQR failed on shrunk dots and on circle/diamond eyes that ZXing reads; a module-centre sampling check confirmed the geometry was correct.

Do not invent historical rationale. Record evidence-based current decisions and label unknown rationale explicitly.

## 2026-10-05 — agent gaps (mcp-server feature, wave 2)

- **POST and PATCH are never retried once the server answered** (`shouldRetryRequest`).
  The old condition retried any 5xx whatever the method, which could publish a
  post or charge credits twice. A POST is retried only when the connection was
  never made (`NEVER_CONNECTED_ERROR_CODES`).
- **`X-Posty5-Client` on every request**, overridable through `headers` so an
  integration (the MCP server) can name itself; `X-API-Key` is set after the
  user headers and always wins.
- **`createdFrom` is a config option, read by every create method** through
  `HttpClient.createdFrom`. Store manual orders keep to the API's accepted list
  (`STORE_ORDER_CREATED_FROM_VALUES`) and fall back to `"npmPackage"`.
- **`CORE_VERSION` is a constant, not a `package.json` import** — the manifest is
  outside `rootDir`; `__tests__/agent-gaps.test.ts` fails when they differ.
- **`@posty5/account` is one client over three API bases** (`/api/api-key/current`,
  `/api/user/current/*`, `/api/plans/operation-costs`): one purpose, read-only.
- **`@posty5/social-publisher-post` 4.6.0** declares `@posty5/core` as a peer
  dependency. 4.2.0 shipped `"dependencies": { "@posty5/core": "file:../posty5-core" }`,
  which cannot install outside this repo. Its version jumps from 4.2.0 to 4.6.0
  because its CHANGELOG already recorded 4.3.0–4.5.0 that never reached npm.

## 2026-10-06 — link bulk + webhooks (link-qr-bulk-and-webhooks)

- **Bulk machinery lives once in `@posty5/core`** (`runLinkBulkCreate`,
  `LinkBulkJobApi`, the bulk interfaces), as link analytics did in 4.4.0. The
  plan put copies in each package; the public methods are still on
  `ShortLinkClient` and `QRCodeClient` (C5), each delegating to core.
- **`createMany` retries chunks itself**, not through axios-retry: core never
  retries a POST after an answer, but a bulk chunk carries an
  `Idempotency-Key` and the API dedupes, so a same-key retry on network
  error/5xx is safe. Every chunk is sent with `skipRetry: true`.
- **`verifyWebhookSignature` is Node only** (`node:crypto`, `Buffer`); the
  clients stay isomorphic. The raw body is required.
- **MCP batch tools always need `confirm: true`** (`short_link_create_many`,
  `qr_code_create_many`, BW-D12): a batch spends up to N times the base price,
  so even a 2-row batch is quoted first (live price of one create via
  `costFeaturePath`). Capped at `MCP_BULK_MAX_ROWS` = 25; bigger files are a
  dashboard upload. `zip: true` runs a QR bulk job and answers only signed,
  expiring links (`qr_code_get_bulk_job` refreshes them) — never bytes.
  Rows take `qr_code_create`'s flat per-type fields (same schema object, not a
  copied discriminated union) and default to `dynamic` like it.
- **No MCP webhook-endpoint tools** (BW-D12): an agent that can register an
  endpoint can be prompt-injected into sending visit data to a URL it chose.
  No export or short-link bulk-job tools either.
