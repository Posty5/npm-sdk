/** What can go wrong (see `Posty5OAuthError.code`). */
export type Posty5OAuthErrorCode =
    | 'config_invalid'
    | 'discovery_failed'
    | 'jwks_failed'
    | 'authorization_error'
    | 'state_mismatch'
    | 'token_error'
    | 'id_token_invalid'
    | 'userinfo_failed';

export type Posty5OAuthScope = 'openid' | 'profile' | 'email';

/** `new Posty5OAuthClient(options)` */
export interface IPosty5OAuthClientOptions {
    /** `p5c_…` from Studio → Developers Kit → OAuth apps. */
    clientId: string;
    /** `p5cs_…` — server side only. */
    clientSecret: string;
    /** Exactly one of the app's registered redirect URIs. */
    redirectUri: string;
    /** Defaults to `https://api.posty5.com`. */
    issuer?: string;
    /** Custom `fetch` (tests, proxies). Defaults to the global one (Node 18+). */
    fetch?: typeof fetch;
}

/** The parts of the discovery document the helper uses. */
export interface IPosty5ProviderMetadata {
    issuer: string;
    authorization_endpoint: string;
    token_endpoint: string;
    userinfo_endpoint: string;
    jwks_uri: string;
    code_challenge_methods_supported?: string[];
    id_token_signing_alg_values_supported?: string[];
    [key: string]: unknown;
}

export interface IPkcePair {
    /** Keep it server side (session) until the callback. */
    codeVerifier: string;
    /** Send it in the authorization URL. */
    codeChallenge: string;
}

export interface IBuildAuthorizationUrlOptions {
    state: string;
    nonce: string;
    codeChallenge: string;
    /** Space-separated; defaults to `openid profile email`. Must include `openid`. */
    scope?: string;
    /** `consent` to show the consent screen again, `login` to force a fresh Posty5 sign-in. */
    prompt?: 'consent' | 'login' | 'login consent';
    /** Maximum age of the Posty5 sign-in, in seconds (`0` = sign in now). */
    maxAge?: number;
}

export interface ICallbackParams {
    code?: string | null;
    state?: string | null;
    error?: string | null;
    error_description?: string | null;
}

export interface IExchangeCodeOptions {
    code: string;
    codeVerifier: string;
    /** The nonce sent in the authorization URL. */
    nonce: string;
    /** When set, `auth_time` must be at most this many seconds old. */
    maxAgeSeconds?: number;
}

export interface IVerifyIdTokenOptions {
    nonce?: string;
    maxAgeSeconds?: number;
}

/** Verified ID-token claims. `sub` is pairwise: stable for this app, unrelated to other apps. */
export interface IPosty5IdTokenClaims {
    iss: string;
    sub: string;
    aud: string | string[];
    exp: number;
    iat: number;
    auth_time?: number;
    nonce?: string;
    name?: string;
    picture?: string;
    email?: string;
    email_verified?: boolean;
    [claim: string]: unknown;
}

export interface IPosty5TokenResult {
    idToken: string;
    claims: IPosty5IdTokenClaims;
    accessToken: string;
    expiresIn: number;
    scope: string;
}

export interface IPosty5UserInfo {
    sub: string;
    name?: string;
    picture?: string;
    email?: string;
    email_verified?: boolean;
    [claim: string]: unknown;
}

/** One RSA public key of the JWKS. */
export interface IJsonWebKey {
    kty: string;
    kid?: string;
    use?: string;
    alg?: string;
    n?: string;
    e?: string;
    [member: string]: unknown;
}
