import type { Posty5Prompt } from './posty5-auth-config.interface';
import type { IPosty5IdTokenClaims } from './posty5-user.interface';

/** `Posty5AuthService.signIn(options)` */
export interface IPosty5SignInOptions {
    /** Where the app should go after the sign-in (kept until the callback; sent to `startUrl`). */
    returnUrl?: string;
    /** `consent` shows the consent screen again; `login` forces a fresh Posty5 sign-in. */
    prompt?: Posty5Prompt;
    /** Maximum age of the Posty5 sign-in in seconds (`0` = sign in now). Checked on `auth_time` in browser mode. */
    maxAge?: number;
}

/** `handleCallback` result in `browser` mode. */
export interface IPosty5BrowserCallbackResult {
    mode: 'browser';
    claims: IPosty5IdTokenClaims;
    idToken: string;
    accessToken: string;
    expiresIn: number;
    scope: string;
    returnUrl?: string;
}

/** `handleCallback` result in `codeHandler` mode: `response` is your back end's JSON. */
export interface IPosty5CodeHandlerCallbackResult<TResponse = unknown> {
    mode: 'codeHandler';
    response: TResponse;
    returnUrl?: string;
}

export type IPosty5CallbackResult<TResponse = unknown> = IPosty5BrowserCallbackResult | IPosty5CodeHandlerCallbackResult<TResponse>;

/** The JSON body POSTed to `codeHandlerUrl`. */
export interface IPosty5CodeHandlerPayload {
    code: string;
    state: string;
    codeVerifier: string;
    redirectUri: string;
    nonce: string;
}

/** State of `Posty5CallbackComponent`. */
export type Posty5CallbackStatus = 'idle' | 'pending' | 'signedIn' | 'failed';
