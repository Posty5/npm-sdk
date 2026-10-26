# Changelog

All notable changes to `@posty5/oauth-angular` are documented here.

## 1.0.1 — Security

- The `issuer` and the endpoints its discovery document names must be `https:` (`http:` only on `localhost` /
  `127.0.0.1` / `[::1]`); otherwise `config_invalid` / `discovery_failed`. Over plain http a network attacker
  could swap the JWKS and have forged ID tokens accepted.

## 1.0.0 — 2026-10-18

First release: Login with Posty5 for Angular (17.3 to 20, standalone, SSR-safe).

### Added

- `providePosty5Auth(config)` with three modes:
  - `startUrl`: the button navigates to your back end's start endpoint (`?returnUrl=`).
  - `codeHandler`: PKCE starts in the browser, and `{ code, state, codeVerifier, redirectUri, nonce }` is POSTed to your back end with `credentials: 'include'`.
  - `browser`: public-client code exchange plus ID-token verification with WebCrypto (RS256 via JWKS, `iss`, `aud`/`azp`, `exp`/`iat` ±60 s, `nonce`, `auth_time` for `maxAge`).
- `Posty5AuthService`: `signIn`, `handleCallback`, `isCallbackUrl`, `rememberUser`, `forgetUser`, `lastUser` signal, `getProviderMetadata`.
- `button[posty5SignInButton]`: a "Continue with Posty5" button with Google-GSI-style options:
  - `theme`, `size`, `shape` (including icon-only `circle` and `square`), `text`, `logoAlignment`, `width`, `label`, `locale`;
  - `showUserPicture`, a personalised "Continue as {name}" with the avatar and the masked e-mail;
  - `unstyled`, `disabled`, `returnUrl`, `prompt`, `maxAge`, `autoSignIn`, and the `(posty5Click)` output.
- Styling: zero-specificity built-in styles, stable `posty5-btn*` classes, and `--posty5-btn-*` CSS custom properties for every colour, size, radius, font, gap, border and focus ring. The layout uses logical properties, so RTL works.
- English and Arabic labels, per-locale overrides through `labels`, and `dir="rtl"` for RTL locales.
- `[posty5Callback]` component with `(signedIn)` and `(failed)` outputs, a default spinner and error message, and content projection.
- `Posty5AuthError` with typed codes. `cancelled` means the user pressed Cancel on Posty5.
