# 03 - Folder Map

## Maintained source

| Path | Purpose |
| --- | --- |
| `posty5-core/src` | HTTP client, errors, types, pagination, and uploads. |
| `posty5-short-link/src` | Short-link client/types. |
| `posty5-qr-code/src` | QR client/types. |
| `posty5-html-hosting/src` | HTML hosting client/types. |
| `posty5-html-hosting-variables/src` | Hosting variable client/types. |
| `posty5-html-hosting-form-submission/src` | Submission client/types. |
| `posty5-social-publisher-workspace/src` | Social workspace client/types. |
| `posty5-social-publisher-post/src` | Social post/upload client/types. |
| `posty5-store/src` | Online store client/types (`@posty5/store`): `store.client.ts` facade, `clients/` (products, orders, tags, customers, shipping, suppliers), `interfaces/`, `helpers/`. |
| `posty5-account/src` | Account client (`@posty5/account`): who a key is, credits, credit history, operation prices. |
| `posty5-mcp/src` | MCP server and tool catalogue (`@posty5/mcp`): `server.ts`, `catalogue.ts`, `toolsets/` (one file per toolset), `core/` (runner, schema, errors, results, idempotency, attribution), `config/`, `interfaces/`, `bin/stdio.ts`. |
| `__tests__` | Live/integration-oriented Jest suite and media fixtures; `__tests__/mcp/` holds the offline `@posty5/mcp` suites and their stub helper. |

## Root entrypoints

| Role | Path |
| --- | --- |
| Workspace manifest | `package.json` |
| Core exports | `posty5-core/src/index.ts` |
| Core HTTP client | `posty5-core/src/http/client.ts` |
| Package clients | `posty5-short-link/src/short-link.client.ts` |
| Integration tests | `__tests__` |
| Jest config | `jest.config.js` |

## Generated/local artifacts

Do not edit or index dependency folders, build output, coverage, caches, archives, logs, IDE state, or nested Git metadata. Common examples are `node_modules`, `dist`, `coverage`, `bin`, `obj`, `.angular`, `.astro`, `.vs`, package archives, and test/build logs. If output is wrong, change its source and rebuild.
