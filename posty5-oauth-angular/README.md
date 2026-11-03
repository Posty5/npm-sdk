# @posty5/oauth-angular

**Login with Posty5 for Angular.** A ready "Continue with Posty5" button you can
restyle completely, plus the sign-in flow behind it: PKCE, the callback, and
ID-token verification in the browser. It talks to Posty5's OpenID Connect
provider.

- Standalone APIs only: `providePosty5Auth()`, `<button posty5SignInButton>`, `[posty5Callback]`.
- Signals and `OnPush` throughout.
- SSR-safe: every `window`, `sessionStorage`, `localStorage` and `crypto.subtle` call is guarded with `isPlatformBrowser`.
- Angular 17.3 to 20 (`@angular/core` / `@angular/common` `>=17.3.0 <21.0.0`).

| | |
| --- | --- |
| Issuer | `https://api.posty5.com` (test tier `https://test-api.posty5.com`) |
| Discovery | `{issuer}/.well-known/openid-configuration` |
| Endpoints | `/oauth/authorize` (code + PKCE S256 required), `/oauth/token`, `/oauth/userinfo`, `/oauth/jwks` (RS256) |
| Scopes | `openid profile email` |
| ID-token claims | `sub` (pairwise), `name`, `picture`, `email`, `email_verified`, `auth_time`, `nonce` |
| `prompt` | `consent`, `login` · `max_age` supported |

## Install

```bash
npm install @posty5/oauth-angular
```

## Pick a mode

| Mode | Who exchanges the code | Client secret | Use it when |
| --- | --- | --- | --- |
| `startUrl` | Your back end runs the whole flow | On your server | You already have a server-side flow (for example with [`@posty5/oauth`](../posty5-oauth)). The button only navigates to it. **Recommended.** |
| `codeHandler` | The package starts PKCE in the browser, your back end exchanges the code | On your server | The SPA owns the redirect URI but the session lives on your API. |
| `browser` | The package, as a **public client** (no secret) | None | A static or front-end-only app. Needs "Allow browser sign-in" in Posty5 Studio. |

### `startUrl`: your back end runs the flow (Trend Digest style)

```ts
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { providePosty5Auth } from '@posty5/oauth-angular';

export const appConfig: ApplicationConfig = {
    providers: [
        providePosty5Auth({
            mode: 'startUrl',
            startUrl: '/api/v1/auth/posty5/start', // your API: creates state/PKCE, redirects to Posty5
            returnUrlParam: 'returnUrl', // default
            locale: 'ar', // optional; defaults to <html lang>, then 'en'
        }),
    ],
};
```

```html
<button posty5SignInButton [returnUrl]="router.url"></button>
```

A click navigates to `/api/v1/auth/posty5/start?returnUrl=%2Ffeed`. `prompt`
and `maxAge`, when set, are added as `prompt` and `max_age`. Your back end
handles `/oauth/authorize`, the callback and the session cookie, so in this mode
there is no callback route in Angular. Once your API has the user, call
`rememberUser()` (see below) to get the "Continue as ..." button.

### `codeHandler`: PKCE in the browser, code exchanged by your back end

```ts
providePosty5Auth({
    mode: 'codeHandler',
    clientId: 'p5c_...', // Posty5 Studio > Developers Kit > OAuth apps
    redirectUri: 'https://app.example.com/auth/posty5/callback',
    codeHandlerUrl: '/api/auth/posty5/code',
});
```

On the callback, the package POSTs this JSON with `credentials: 'include'`:

```json
{ "code": "...", "state": "...", "codeVerifier": "...", "redirectUri": "https://app.example.com/auth/posty5/callback", "nonce": "..." }
```

Your back end exchanges the code with its client secret (for example
`posty5.exchangeCode({ code, codeVerifier, nonce })` from `@posty5/oauth`), sets
its session, and answers JSON. `handleCallback()` returns that JSON as
`result.response`.

### `browser`: no back end

```ts
providePosty5Auth({
    mode: 'browser',
    clientId: 'p5c_...',
    redirectUri: 'https://app.example.com/auth/posty5/callback',
    issuer: 'https://test-api.posty5.com', // optional, test tier
});
```

The package exchanges the code at `/oauth/token` as a public client. The form
body is `grant_type=authorization_code`, `code`, `redirect_uri`,
`code_verifier` and `client_id`, with no secret. It then verifies the ID token
with WebCrypto:

- the RS256 signature, using a key from the JWKS (`RSASSA-PKCS1-v1_5` / `SHA-256`); an unknown `kid` refetches the JWKS once;
- `iss`, `aud` (and `azp` when there are several audiences), `exp` and `iat` (±60 s), `sub`, `nonce`;
- `auth_time` when you passed `maxAge`.

`handleCallback()` resolves with `{ claims, idToken, accessToken, expiresIn, scope, returnUrl }`.

## Config (`providePosty5Auth`)

| Option | Modes | Default | |
| --- | --- | --- | --- |
| `mode` | all | required | `'startUrl' \| 'codeHandler' \| 'browser'` |
| `startUrl` | startUrl | required | Your back-end start endpoint (relative or absolute). |
| `returnUrlParam` | startUrl | `'returnUrl'` | Query parameter that carries the return URL. |
| `clientId` | codeHandler, browser | required | `p5c_...` |
| `redirectUri` | codeHandler, browser | required | One of the app's registered redirect URIs. |
| `codeHandlerUrl` | codeHandler | required | Receives the JSON POST. |
| `issuer` | all | `https://api.posty5.com` | Test tier: `https://test-api.posty5.com`. |
| `scope` | all | `'openid profile email'` | Must include `openid`. |
| `rememberUser` | all | `true` | Keep `{ name, picture, email }` in `localStorage` for the "Continue as ..." button. `false` turns remembering off completely. |
| `maskRememberedEmail` | all | `true` | Store the e-mail as `ah***@gmail.com`. |
| `locale` | all | `<html lang>`, then `'en'` | `'en'`, `'ar'`, or any locale you add in `labels`. `ar-EG` matches `ar`. |
| `labels` | all | built in | Per-locale overrides: `{ en: { continue_with: 'Go on with Posty5' }, fr: { ... } }`. |

The config is checked when the app starts. A missing field throws
`Posty5AuthError` with code `config_invalid`.

## The button

```html
<button posty5SignInButton></button>

<button
    posty5SignInButton
    theme="outline"
    size="medium"
    shape="pill"
    text="signin_with"
    logoAlignment="center"
    [width]="320"
    returnUrl="/dashboard"
    (posty5Click)="track($event)"
></button>

<!-- icon only -->
<button posty5SignInButton shape="circle" theme="filled"></button>
```

Import it where you use it: `imports: [Posty5SignInButtonComponent]`. The
selector is an attribute on a real `<button>`, so forms, focus and keyboard
behave like any native button. The package sets `type="button"`.

| Input | Type | Default | |
| --- | --- | --- | --- |
| `theme` | `'filled' \| 'outline' \| 'filledDark'` | `'filled'` | `filled` is Posty5 blue `#0059F7` with a white logo; `outline` is white with a blue logo; `filledDark` is for dark pages. |
| `size` | `'large' \| 'medium' \| 'small'` | `'large'` | 44 / 40 / 32 px high. |
| `shape` | `'rectangular' \| 'pill' \| 'circle' \| 'square'` | `'rectangular'` | `circle` and `square` show the logo only; the label becomes the `aria-label`. |
| `text` | `'continue_with' \| 'signin_with' \| 'signup_with' \| 'signin'` | `'continue_with'` | See the label table. |
| `logoAlignment` | `'left' \| 'center'` | `'left'` | `left`: logo at the start edge, label centred in the rest (visible with a `width`). `center`: logo next to the label. |
| `width` | `string \| number` | auto | A number is pixels; a string is any CSS width (`'100%'`). |
| `label` | `string` | | Replaces the label completely, including on the personalised button. |
| `locale` | `string` | config / `<html lang>` | Per button. |
| `showUserPicture` | `boolean` | `true` | With a remembered user: avatar, "Continue as {name}", and the e-mail. |
| `unstyled` | `boolean` | `false` | No built-in styles, only the structure and the classes. |
| `disabled` | `boolean` | `false` | |
| `returnUrl` | `string` | | Passed to `signIn()`. |
| `prompt` | `'consent' \| 'login' \| 'login consent'` | | Passed to `signIn()`. |
| `maxAge` | `number` | | Passed to `signIn()` (seconds). |
| `autoSignIn` | `boolean` | `true` | `false`: only emit `(posty5Click)`. |

| Output | Payload | |
| --- | --- | --- |
| `(posty5Click)` | `{ event: MouseEvent, user: IPosty5RememberedUser \| null }` | Emitted before the sign-in starts. Call `event.preventDefault()` to cancel the automatic sign-in for that click. |

While the sign-in starts, the button is disabled and has
`aria-busy="true"` and the class `posty5-btn--busy`.

### Labels

| `text` | en | ar |
| --- | --- | --- |
| `continue_with` | Continue with Posty5 | المتابعة باستخدام Posty5 |
| `signin_with` | Sign in with Posty5 | تسجيل الدخول باستخدام Posty5 |
| `signup_with` | Sign up with Posty5 | إنشاء حساب باستخدام Posty5 |
| `signin` | Sign in | تسجيل الدخول |
| personalised (`continue_as`) | Continue as {name} | المتابعة باسم {name} |

"Posty5" is always written in Latin script. Arabic (and `fa`, `he`, `ur`)
buttons get `dir="rtl"`. The layout uses logical properties
(`padding-inline`, `margin-inline-start`), so it mirrors without extra CSS.
The callback component uses the label keys `callback_pending`,
`callback_failed` and `callback_cancelled`.

### "Continue as Ahmed"

When a remembered user exists, the button shows the avatar, "Continue as
{name}", the (masked) e-mail, and the logo at the end, like Google's
personalised button. The user is remembered:

- automatically after a successful sign-in in `browser` mode;
- whenever you call `Posty5AuthService.rememberUser({ name, picture, email })`, for example after your back end returns the user in `startUrl` or `codeHandler` mode.

Call `forgetUser()` on sign-out or "Not you?". Only `https:` pictures are kept.
The personalised content renders only after hydration, so server HTML and the
first client render always match.

### Styling

The styles use `ViewEncapsulation.None`, and every selector is wrapped in
`:where()`, so **the built-in styles have zero specificity**. Any rule of yours
on the classes below wins without `!important`.

Classes:

| Class | Element |
| --- | --- |
| `posty5-btn` | the `<button>` |
| `posty5-btn--filled` / `--outline` / `--filledDark` | theme |
| `posty5-btn--large` / `--medium` / `--small` | size |
| `posty5-btn--rectangular` / `--pill` / `--circle` / `--square` | shape |
| `posty5-btn--logo-left` / `--logo-center` | logo alignment |
| `posty5-btn--icon-only`, `posty5-btn--personalized`, `posty5-btn--busy`, `posty5-btn--unstyled` | state |
| `posty5-btn__logo` (`posty5-btn__logo--end` on the personalised button) | the Posty5 mark (inline SVG, `currentColor`) |
| `posty5-btn__label` | the text |
| `posty5-btn__avatar`, `posty5-btn__avatar-img`, `posty5-btn__avatar-initial` | the avatar (initial letter if there is no picture or it fails to load) |
| `posty5-btn__text`, `posty5-btn__email` | the two-line block of the personalised button |

CSS custom properties. Set them on the button, on any ancestor, or on `:root`:

| Property | Default (filled / outline / filledDark) |
| --- | --- |
| `--posty5-btn-bg` | `#0059F7` / `#FFFFFF` / `#131314` |
| `--posty5-btn-color` | `#FFFFFF` / `#1F1F1F` / `#E3E3E3` |
| `--posty5-btn-border` | `1px solid transparent` / `1px solid #747775` / `1px solid #8E918F` |
| `--posty5-btn-hover-bg` | `#004BD1` / `#F0F5FF` / `#2A2A2C` |
| `--posty5-btn-active-bg` | the hover background |
| `--posty5-btn-logo-color` | `#FFFFFF` / `#0059F7` / `#FFFFFF` |
| `--posty5-btn-radius` | `4px` (pill `9999px`, circle `50%`) |
| `--posty5-btn-height` | `44px` / `40px` / `32px` (large / medium / small) |
| `--posty5-btn-padding` | `16px` / `12px` / `10px` (inline padding) |
| `--posty5-btn-font-family` | system font stack |
| `--posty5-btn-font-size` | `15px` / `14px` / `13px` |
| `--posty5-btn-font-weight` | `500` |
| `--posty5-btn-letter-spacing` | `normal` |
| `--posty5-btn-gap` | `12px` / `10px` / `8px` |
| `--posty5-btn-icon-size` | `22px` / `20px` / `18px` |
| `--posty5-btn-avatar-size` | `28px` / `24px` / `20px` |
| `--posty5-btn-avatar-radius` | `50%` |
| `--posty5-btn-avatar-bg` / `--posty5-btn-avatar-color` / `--posty5-btn-avatar-font-size` | `#F0F5FF` / `#0059F7` / the button font size |
| `--posty5-btn-email-font-size` / `--posty5-btn-email-font-weight` / `--posty5-btn-email-opacity` | `0.8em` / `normal` / `0.8` |
| `--posty5-btn-shadow` / `--posty5-btn-hover-shadow` | `none` |
| `--posty5-btn-focus-ring` | `2px solid #0059F7` (an `outline` value) |
| `--posty5-btn-focus-offset` | `2px` |
| `--posty5-btn-disabled-opacity` | `0.5` |
| `--posty5-btn-busy-opacity` | `0.8` |

```css
/* Trend Digest: pill, brand font, softer hover */
.login-card .posty5-btn {
    --posty5-btn-radius: 9999px;
    --posty5-btn-font-family: 'Cairo', sans-serif;
    --posty5-btn-hover-bg: #1a6bff;
}
```

With `unstyled`, nothing is styled. The SVG and avatar still carry small
intrinsic `width` / `height` attributes so they do not render huge, and you
style everything from the classes.

## Handling the callback (`codeHandler` and `browser`)

Route the redirect URI to the callback component. Keep the route lazy:

```ts
// app.routes.ts
export const routes: Routes = [
    {
        path: 'auth/posty5/callback',
        loadComponent: () => import('./auth/posty5-callback.page').then((m) => m.Posty5CallbackPage),
    },
];
```

```ts
// auth/posty5-callback.page.ts
@Component({
    selector: '[appPosty5CallbackPage]',
    standalone: true,
    imports: [Posty5CallbackComponent],
    template: `<div posty5Callback (signedIn)="done($event)" (failed)="failed($event)"></div>`,
})
export class Posty5CallbackPage {
    private readonly router = inject(Router);

    done(result: IPosty5CallbackResult) {
        this.router.navigateByUrl(result.returnUrl || '/');
    }

    failed(error: Posty5AuthError) {
        // error.code === 'cancelled' when the user pressed Cancel on Posty5
        this.router.navigateByUrl('/login');
    }
}
```

`[posty5Callback]` inputs: `url` (defaults to `location.href`), `autoHandle`
(default `true`; with `false`, call `run()` yourself), `hideDefaultUi` (hides
the built-in spinner and message; projected content always shows), and
`locale`. Outputs: `(signedIn)` with `IPosty5CallbackResult` and `(failed)`
with `Posty5AuthError`. Its `status()` signal is `pending`, `signedIn` or
`failed`. Its classes are `posty5-callback`, `posty5-callback--pending`,
`--failed` and `--signed-in`, and its parts are `posty5-callback__spinner`,
`__message` and `__error`. Its custom properties are
`--posty5-callback-padding`, `-color`, `-gap`, `-spinner-size`,
`-spinner-stroke`, `-spinner-color`, `-spinner-track`, `-spinner-duration` and
`-error-color`.

Without the component:

```ts
const auth = inject(Posty5AuthService);
if (auth.isCallbackUrl()) {
    const result = await auth.handleCallback();
}
```

`handleCallback(url = location.href)` does the following, in order:

1. Reads `code`, `state`, `error` and `iss` from the URL.
2. Takes this tab's pending sign-in out of `sessionStorage` (one key, `posty5.oauth.pending`) and clears it.
3. Removes the OAuth parameters from the address bar with `history.replaceState`.
4. Checks `state` in constant time, checks the sign-in is less than 10 minutes old, and checks `iss` when it is present.
5. Exchanges the code, by POST in `codeHandler` mode or at the token endpoint with ID-token verification in `browser` mode.

## `Posty5AuthService`

| Member | |
| --- | --- |
| `signIn(options?: { returnUrl?, prompt?, maxAge? }): Promise<void>` | `startUrl` mode: `location.assign(startUrl?returnUrl=...)`. Other modes: creates state, nonce and a PKCE S256 pair with WebCrypto, stores them in `sessionStorage`, then `location.assign(authorize URL)`. The discovery document is fetched once and cached for an hour. |
| `handleCallback<T>(url?): Promise<IPosty5CallbackResult<T>>` | See above. |
| `isCallbackUrl(url?): boolean` | Does the URL carry `state` plus `code` or `error`? |
| `rememberUser({ name, picture, email })` / `forgetUser()` | The "Continue as ..." user. |
| `lastUser: Signal<IPosty5RememberedUser \| null>` | The remembered user. Always `null` on the server. |
| `getProviderMetadata()` | The cached discovery document. |
| `resolvedConfig` | The config with its defaults applied. |

Errors are `Posty5AuthError` with `code`: `config_invalid`, `not_browser`,
`discovery_failed`, `jwks_failed`, `cancelled` (the user pressed Cancel,
`error=access_denied`), `authorization_error`, `state_mismatch`,
`sign_in_expired`, `token_error`, `id_token_invalid` or `code_handler_failed`.
Provider errors also carry `providerError` (the OAuth `error`), and failed
requests carry `status`.

## SSR notes

- Rendering on the server is safe. The button renders its generic label. `lastUser` is `null`. `signIn` and `handleCallback` reject with `not_browser` if they are ever called there.
- The personalised button and the callback both start after the first browser render (`afterNextRender`), so hydration never sees a mismatch and the callback never runs on the server.
- The package uses `fetch` directly, not `HttpClient`. Your interceptors never add your API's `Authorization` header to Posty5's endpoints, and nothing goes through `TransferState`.

## Security notes

- **Never put a client secret in the browser.** `codeHandler` and `browser` mode send no secret. In `startUrl` and `codeHandler` mode, the secret stays on your server.
- `browser` mode only works if the OAuth app has **"Allow browser sign-in"** turned on and the app's **allowed origins** set in Posty5 Studio > Developers Kit > OAuth apps. Without them the token endpoint refuses the public client.
- In `browser` mode, the access token and ID token are returned to your code and are **not stored** by the package. Keep them in memory. For anything that needs a long-lived session, prefer `startUrl` or `codeHandler` with an `HttpOnly` cookie.
- `state` (CSRF), `nonce` (replay) and PKCE S256 are always used. The pending sign-in lives in `sessionStorage`, so it belongs to one tab, and it expires after 10 minutes.
- The remembered user holds only the name, the `https:` picture URL and the masked e-mail. No tokens and no `sub`.
- Your `codeHandlerUrl` receives a cookie-bearing POST, so protect it like any state-changing endpoint: check `Origin`, and use SameSite cookies or a CSRF token.

## License

MIT
