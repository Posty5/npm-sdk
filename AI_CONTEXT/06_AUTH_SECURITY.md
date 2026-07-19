# 06 - Authentication and Security

## Rules and trust boundaries

- API keys are sent through X-API-Key and must never appear in debug output or committed test configuration.
- Debug mode currently logs response data; consumers and maintainers must treat it as sensitive.
- Only retry safe/network/idempotent requests unless an operation explicitly guarantees idempotency.
- Signed upload URLs and local File/Blob inputs are security and compatibility boundaries.
- Public types and exports are part of the semver contract.

## Secret handling

- Document configuration names and purposes only, never values.
- Never print credentials, tokens, cookies, signed URLs, private endpoints, or production payloads.
- Browser/client checks are not backend authorization.
- Read [15_RISKY_AREAS.md](15_RISKY_AREAS.md) before security-sensitive work.
