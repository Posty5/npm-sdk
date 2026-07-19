# 17 - Established Patterns

| Pattern | Rule | Example |
| --- | --- | --- |
| Injected client | Feature clients accept HttpClient in their constructor. | `posty5-short-link/src/short-link.client.ts` |
| Barrel export | Each package exports its client and public interfaces from src/index.ts. | `posty5-qr-code/src/index.ts` |
| Shared response/error handling | Transport and error transformation live in core. | `posty5-core/src/http/client.ts` |
| Request/response interface split | Feature interfaces are grouped under interfaces/requests and responses. | `posty5-html-hosting/src/interfaces` |
| Workspace release | Each package owns tsup build and prepublish scripts. | `posty5-html-hosting/package.json` |

Patterns describe current source, not aspirational refactors. Add a pattern only when multiple maintained examples or a clear architectural boundary support it.
