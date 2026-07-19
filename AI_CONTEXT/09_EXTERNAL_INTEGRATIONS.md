# 09 - External Integrations

| System | Purpose | Owner/config source |
| --- | --- | --- |
| Posty5 API | All SDK operations | `posty5-core/src/http/client.ts` |
| Axios/axios-retry | HTTP transport and retry behavior | `posty5-core/package.json` |
| Signed object storage | Direct uploads for hosting, workspace logos, and social media | `posty5-core/src/utils/upload.ts` |
| npm registry | Eight public packages | `package.json` |

## Change rule

When an integration changes, update its owner, configuration names, error/retry behavior, tests, [INTEGRATION_INDEX.json](INTEGRATION_INDEX.json), and risky-area notes. Never document credential values.
