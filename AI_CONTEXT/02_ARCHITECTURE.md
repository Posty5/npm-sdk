# 02 - Architecture

## Topology

Eight publishable JavaScript/TypeScript packages sharing a core HTTP client and typed clients for Posty5 links, QR codes, hosting, form submissions, variables, and social publishing.

### Client call

Consumer -> feature client -> shared HttpClient -> Posty5 API -> typed response/error.

### Signed upload

Feature client -> request upload URL -> upload File/Blob -> API operation/finalization.

### Workspace build

npm run build:all invokes each package build (tsup).

### Publish

Package prepublishOnly builds CJS, ESM, and declarations from src/index.ts.

### Integration test

Jest setup reads environment and exercises the configured API.

## Ownership rules

- Owns client behavior and public TypeScript types, not the backend API implementation.
- Each posty5-* workspace is independently published.
- dist, coverage, logs, and test media outputs are generated/local artifacts.

## State and contracts

- HttpClient stores merged configuration and one Axios instance.
- Feature clients receive an HttpClient; they do not create hidden global clients.
- Response/error mapping is centralized in core.
- Upload workflows request signed configuration, upload binary data, then continue API operations.
- Tests read POSTY5_BASE_URL and POSTY5_API_KEY from the environment.

Use [04_MODULES.md](04_MODULES.md) for owner paths and [17_PATTERNS.md](17_PATTERNS.md) for implementation conventions.
