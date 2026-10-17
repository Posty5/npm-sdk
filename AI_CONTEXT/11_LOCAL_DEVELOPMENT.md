# 11 - Local Development

| Task | Command |
| --- | --- |
| Install | `npm ci` |
| Build all packages | `npm run build:all` |

`build:all` builds the workspaces in the order the root `package.json` lists them, not by dependency. A package must come after every workspace whose types it imports: `posty5-qr-design` before `posty5-qr-code`, both before `posty5-mcp`. On a clean checkout (CI, the api's `setup-npm-sdk` action), the wrong order leaves `posty5-qr-code` without `dist/index.d.ts`, and `posty5-mcp`'s DTS build then fails with TS7016.
| Clean all packages | `npm run clean` |
| Tests | `npm test` |
| Watch tests | `npm run test:watch` |
| Coverage | `npm run test:coverage` |
| Per-package typecheck | `npm run typecheck --workspace <package>` |
| Per-package build | `npm run build --workspace <package>` |

## Working rules

- Prefer clean installs from the lockfile.
- Run commands from the `npm-sdk/` project root.
- Do not commit generated output, dependencies, archives, credentials, or local logs.
- Confirm command names against the current manifest/project files when documentation and source disagree.
