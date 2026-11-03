# 06 - Authentication and Security

## Rules and trust boundaries

- API keys are sent through X-API-Key and must never appear in debug output or committed test configuration.
- Debug mode currently logs response data; consumers and maintainers must treat it as sensitive. It logs only the message of a failed request, never the axios error (its config holds the key).
- `HttpClient` keeps the key in a module `WeakMap`, not on the instance, so inspecting or serializing a client never shows it; `transformError` redacts it from the axios error kept as `details.originalError` (`redactApiKey`).
- A redirect that leaves the base URL's origin drops `X-API-Key` (`apiKeyRedirectGuard`); a plain-`http:` non-loopback `baseUrl` warns.
- Every id interpolated into a request path goes through `encodeURIComponent`, and `HttpClient` refuses a `.`/`..` segment (`INVALID_PATH`): an id must never rewrite the route it is sent to.
- `@posty5/mcp`: a host's own error text never reaches the model (fixed sentence; detail to `afterToolCall`); idempotency store keys are scoped by a hash of the connection's API key; `createPosty5McpNodeHandler` takes `allowedOrigins` against DNS rebinding.
- `@posty5/oauth` / `oauth-angular`: issuer and discovered endpoints must be https (http on loopback only); `createLoginLink` accepts only a same-site path as `returnTo`.
- Only retry safe/network/idempotent requests unless an operation explicitly guarantees idempotency.
- Signed upload URLs and local File/Blob inputs are security and compatibility boundaries.
- Public types and exports are part of the semver contract.

## Secret handling

- Document configuration names and purposes only, never values.
- Never print credentials, tokens, cookies, signed URLs, private endpoints, or production payloads.
- Browser/client checks are not backend authorization.
- Read [15_RISKY_AREAS.md](15_RISKY_AREAS.md) before security-sensitive work.
