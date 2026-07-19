# 00 - Start Here

> Orientation for AI assistants. Continue with [14_AI_TASK_ROUTING.md](14_AI_TASK_ROUTING.md) for task-specific files.

## What this project does

Eight publishable JavaScript/TypeScript packages sharing a core HTTP client and typed clients for Posty5 links, QR codes, hosting, form submissions, variables, and social publishing.

## Quick facts

| Fact | Value |
| --- | --- |
| Project | Posty5 JavaScript SDK |
| Type | npm workspaces TypeScript SDK monorepo |
| Runtime | Node.js 16+ and compatible browser runtimes |
| Package/build system | npm workspaces |
| Scope root | npm-sdk/ |
| Generated context date | 2026-07-19 |

## Main entrypoints

| Role | Path |
| --- | --- |
| Workspace manifest | `package.json` |
| Core exports | `posty5-core/src/index.ts` |
| Core HTTP client | `posty5-core/src/http/client.ts` |
| Package clients | `posty5-short-link/src/short-link.client.ts` |
| Integration tests | `__tests__` |
| Jest config | `jest.config.js` |

## Runtime/control flow

Consumer -> feature client -> shared HttpClient -> Posty5 API -> typed response/error.

## How to approach changes

1. Use [14_AI_TASK_ROUTING.md](14_AI_TASK_ROUTING.md) to find the owning area.
2. Read its entry in [04_MODULES.md](04_MODULES.md) and the matching JSON index.
3. Check [15_RISKY_AREAS.md](15_RISKY_AREAS.md).
4. Change maintained source only; do not edit generated artifacts.
5. Run the checks in [11_LOCAL_DEVELOPMENT.md](11_LOCAL_DEVELOPMENT.md).
6. Update context per [16_DOCUMENTATION_MAINTENANCE.md](16_DOCUMENTATION_MAINTENANCE.md).
