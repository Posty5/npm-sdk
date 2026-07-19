# 08 - Workflows

| Workflow | Flow |
| --- | --- |
| Client call | Consumer -> feature client -> shared HttpClient -> Posty5 API -> typed response/error. |
| Signed upload | Feature client -> request upload URL -> upload File/Blob -> API operation/finalization. |
| Workspace build | npm run build:all invokes each package build (tsup). |
| Publish | Package prepublishOnly builds CJS, ESM, and declarations from src/index.ts. |
| Integration test | Jest setup reads environment and exercises the configured API. |

For common edit sequences, see [13_CHANGE_PLAYBOOK.md](13_CHANGE_PLAYBOOK.md).
