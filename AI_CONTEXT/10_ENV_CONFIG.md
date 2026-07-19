# 10 - Environment and Configuration

> Names and purposes only. Read actual values only when a task explicitly requires it and never copy them into documentation or output.

| Name | Purpose | Source | Category |
| --- | --- | --- | --- |
| `POSTY5_BASE_URL` | Fallback API origin when config.baseUrl is absent. | `posty5-core/src/http/client.ts` | environment |
| `POSTY5_API_KEY` | Fallback API key; secret. | `posty5-core/src/http/client.ts` | environment |
| `IPosty5Config.baseUrl` | Per-client API origin. | `posty5-core/src/types/config.ts` | runtime |
| `IPosty5Config.apiKey` | Per-client X-API-Key credential; secret. | `posty5-core/src/types/config.ts` | runtime |
| `IPosty5Config.debug` | Request/response debug logging; avoid sensitive payloads. | `posty5-core/src/types/config.ts` | runtime |

## Rules

- Keep server secrets out of browser bundles and public package metadata.
- Update all typed variants/contracts when adding a build-time key.
- Update [ENV_INDEX.json](ENV_INDEX.json) with names, purpose, owner, and sensitivity - never values.
