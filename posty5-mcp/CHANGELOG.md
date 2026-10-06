# Changelog

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
