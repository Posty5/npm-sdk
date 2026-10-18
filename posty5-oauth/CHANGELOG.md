# Changelog

## 1.1.0

### Added

- `createLoginLink({ returnTo?, data?, scope?, prompt?, maxAge?, ttlSeconds? })` → `{ url, binding, expiresAt }`:
  a ready sign-in link whose `state` is sealed (AES-256-GCM, key derived from the client secret by HKDF) and
  carries the nonce, PKCE verifier, `returnTo`, `data` and expiry — no session store needed. `binding` goes in a
  cookie and ties the link to the browser.
- `handleLoginCallback(query, { binding, maxAgeSeconds? })` → tokens + verified claims + `returnTo` + `data`.
- `Posty5AppUsersClient({ apiKey })`: `list({ search?, pageSize?, cursor? })` and `get(sub)` over
  `GET /api/oauth-users` — the users of the OAuth app the API key is attached to, limited to what each granted.

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
