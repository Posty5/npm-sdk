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
