# 11 - Local Development

| Task | Command |
| --- | --- |
| Install | `npm ci` |
| Build all packages | `npm run build:all` |
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
