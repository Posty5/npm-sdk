# Changelog

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
