# @posty5/oauth

**Login with Posty5** for your back end: let your users sign in with their
Posty5 account, the way they would with Google. Posty5 is a standard OpenID
Connect provider; this package is a small, dependency-free helper for it
(authorization code + PKCE, ID-token verification, userinfo).

> Server side only: it uses your client secret. Node 18+.

## 1. Register your app

Posty5 Studio → **Developers Kit → OAuth apps → New app**. Add your exact
redirect URI (for example `https://example.com/auth/posty5/callback`). Copy the
**client ID** (`p5c_…`) and the **client secret** (`p5cs_…`) — the secret is
shown once; rotate it if you lose it.

## 2. Install

```bash
npm install @posty5/oauth
```

## 3. Use

```ts
import { Posty5OAuthClient, Posty5OAuthError } from '@posty5/oauth';

const posty5 = new Posty5OAuthClient({
  clientId: process.env.POSTY5_CLIENT_ID!,
  clientSecret: process.env.POSTY5_CLIENT_SECRET!,
  redirectUri: 'https://example.com/auth/posty5/callback',
  // issuer: 'https://test-api.posty5.com', // the test tier
});

// GET /auth/posty5/start
app.get('/auth/posty5/start', async (req, res) => {
  const { codeVerifier, codeChallenge } = posty5.createPkce();
  const state = posty5.createState();
  const nonce = posty5.createNonce();
  req.session.posty5 = { codeVerifier, state, nonce };
  res.redirect(await posty5.buildAuthorizationUrl({ state, nonce, codeChallenge }));
});

// GET /auth/posty5/callback?code=…&state=…
app.get('/auth/posty5/callback', async (req, res) => {
  const pending = req.session.posty5;
  delete req.session.posty5;
  try {
    const code = posty5.readCallback(req.query, pending?.state);
    const { claims } = await posty5.exchangeCode({ code, codeVerifier: pending.codeVerifier, nonce: pending.nonce });
    // claims.sub is stable for your app: key your user record on it.
    const user = await findOrCreateUser({ posty5Sub: claims.sub, email: claims.email, emailVerified: claims.email_verified, name: claims.name });
    signIn(req, user);
    res.redirect('/');
  } catch (error) {
    if (error instanceof Posty5OAuthError && error.providerError === 'access_denied') return res.redirect('/login?cancelled=1');
    throw error;
  }
});
```

### What you get

| Scope | Claims |
| --- | --- |
| `openid` (required) | `sub` (pairwise: stable for your app, different in other apps), `auth_time` |
| `profile` | `name`, `picture` |
| `email` | `email`, `email_verified` |

`posty5.getUserInfo(accessToken)` returns the same claims from the userinfo
endpoint (the access token lives one hour; there are no refresh tokens).

### Fresh sign-in

`buildAuthorizationUrl({ …, prompt: 'login' })` or `maxAge: 0` forces the user
to sign in to Posty5 again; pass `maxAgeSeconds` to `exchangeCode` to enforce
it on `auth_time`. `prompt: 'consent'` shows the consent screen again.

## Errors

`Posty5OAuthError.code`: `config_invalid`, `discovery_failed`, `jwks_failed`,
`authorization_error` (user cancelled → `providerError: 'access_denied'`),
`state_mismatch`, `token_error` (`providerError` e.g. `invalid_grant`),
`id_token_invalid`, `userinfo_failed`.

## Other languages

Any OpenID Connect library works with the discovery URL
`https://api.posty5.com/.well-known/openid-configuration` (code flow, PKCE
S256, `client_secret_basic`). See the developer guide: *Login with Posty5*.
