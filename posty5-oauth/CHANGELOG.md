# Changelog

## 1.2.0

Needs the API release where an API key's OAuth access is set on the key
(`oauthAccess`: none / all / selected apps) and `GET /api/oauth-users` accepts `?clientId=`.

### Added

- `Posty5AppUsersClient({ apiKey, clientId? })`: optional `clientId` (the app's `p5c_…` client id), sent as the
  `clientId` query parameter of `list()` and `get()`. Required when the API key can read more than one of your
  OAuth apps (Posty5 answers 400 without it); optional when it can read exactly one. Trimmed; empty counts as
  not set; a non-string throws `config_invalid`.

### Changed

- Docs: which OAuth apps an API key may read is now set on the key (Studio → Developers Kit → API keys → Edit →
  OAuth access), not attached on the OAuth app's page. A 403 `api_error` means the key has no access to the app.
  Without `clientId` the client behaves exactly as in 1.1.0.

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
