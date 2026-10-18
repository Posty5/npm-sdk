# Changelog

## 1.0.0

First release. Needs the API release of Login with Posty5 (the OpenID Connect
provider at `https://api.posty5.com`).

### Added

- `Posty5OAuthClient`: `discover`, `createPkce`, `createState`, `createNonce`,
  `buildAuthorizationUrl`, `readCallback`, `exchangeCode`
  (`client_secret_basic`), `verifyIdToken` (RS256 against the JWKS, `iss`,
  `aud`, `exp`, `iat`, `nonce`, `auth_time`), `getUserInfo`.
- `Posty5OAuthError` with `code`, `providerError` and `status`.
- No runtime dependencies (Node 18+: global `fetch`, `node:crypto`).
