import type { IPosty5LabelOverrides } from './posty5-labels.interface';

/** How the package completes the sign-in. */
export type Posty5AuthMode = 'startUrl' | 'codeHandler' | 'browser';

/** `prompt` values Posty5 understands. */
export type Posty5Prompt = 'consent' | 'login' | 'login consent';

/** Options every mode shares. */
export interface IPosty5AuthBaseConfig {
    /** Defaults to `https://api.posty5.com` (test tier: `https://test-api.posty5.com`). */
    issuer?: string;
    /** Space-separated, must include `openid`. Defaults to `openid profile email`. */
    scope?: string;
    /**
     * Keep `{ name, picture, email }` of the last signed-in user in
     * `localStorage` so the button can say "Continue as Ahmed" with the
     * avatar. Defaults to `true`.
     */
    rememberUser?: boolean;
    /** Store the remembered e-mail masked (`ah***@gmail.com`). Defaults to `true`. */
    maskRememberedEmail?: boolean;
    /** `en`, `ar` or any locale you add in `labels`. Defaults to the `<html lang>`, then `en`. */
    locale?: 'en' | 'ar' | string;
    /** Per-locale label overrides, e.g. `{ en: { continue_with: 'Go on with Posty5' } }`. */
    labels?: IPosty5LabelOverrides;
}

/**
 * `startUrl` mode: your back end runs the whole flow (it holds the client
 * secret, e.g. with `@posty5/oauth`). The button only navigates to
 * `startUrl?returnUrl=...`.
 */
export interface IPosty5AuthStartUrlConfig extends IPosty5AuthBaseConfig {
    mode: 'startUrl';
    /** Your back-end endpoint that starts the flow, e.g. `/api/auth/posty5/start`. */
    startUrl: string;
    /** Name of the query parameter that carries the return URL. Defaults to `returnUrl`. */
    returnUrlParam?: string;
    clientId?: string;
    redirectUri?: string;
}

/**
 * `codeHandler` mode: the package starts the PKCE flow in the browser, then
 * POSTs `{ code, state, codeVerifier, redirectUri, nonce }` to your back
 * end, which exchanges the code with its client secret.
 */
export interface IPosty5AuthCodeHandlerConfig extends IPosty5AuthBaseConfig {
    mode: 'codeHandler';
    /** `p5c_...` from Posty5 Studio > Developers Kit > OAuth apps. */
    clientId: string;
    /** One of the app's registered redirect URIs (the route that renders the callback). */
    redirectUri: string;
    /** Your back-end endpoint that receives the code (JSON POST, `credentials: 'include'`). */
    codeHandlerUrl: string;
}

/**
 * `browser` mode: the package exchanges the code at the token endpoint as a
 * public client (no secret) and verifies the ID token with WebCrypto. The
 * app must have "Allow browser sign-in" and its allowed origins set in
 * Posty5 Studio.
 */
export interface IPosty5AuthBrowserConfig extends IPosty5AuthBaseConfig {
    mode: 'browser';
    clientId: string;
    redirectUri: string;
}

/** `providePosty5Auth(config)` */
export type IPosty5AuthConfig = IPosty5AuthStartUrlConfig | IPosty5AuthCodeHandlerConfig | IPosty5AuthBrowserConfig;

/** The config after defaults were applied (what the services read). */
export interface IPosty5ResolvedAuthConfig {
    mode: Posty5AuthMode;
    issuer: string;
    scope: string;
    clientId: string;
    redirectUri: string;
    startUrl: string;
    returnUrlParam: string;
    codeHandlerUrl: string;
    rememberUser: boolean;
    maskRememberedEmail: boolean;
    locale: string | null;
    labels: IPosty5LabelOverrides;
}
