/** What can go wrong (see `Posty5OAuthError.code`). */
export type Posty5OAuthErrorCode =
    | 'config_invalid'
    | 'discovery_failed'
    | 'jwks_failed'
    | 'authorization_error'
    | 'state_mismatch'
    | 'token_error'
    | 'id_token_invalid'
    | 'userinfo_failed'
    | 'api_error';

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

/** `createLoginLink(options)` */
export interface ICreateLoginLinkOptions {
    /** Where your app sends the user after sign-in (kept inside the sealed state). Keep it short. */
    returnTo?: string;
    /** Small JSON-serialisable data to get back in `handleLoginCallback` (sealed, not readable by anyone). */
    data?: unknown;
    scope?: string;
    prompt?: 'consent' | 'login' | 'login consent';
    maxAge?: number;
    /** How long the link stays valid (default 600 s, max 3600 s). */
    ttlSeconds?: number;
}

/** What `createLoginLink` answers. */
export interface ILoginLink {
    /** Send the browser here. */
    url: string;
    /**
     * Random value binding the link to this browser: set it as an HttpOnly,
     * Secure, SameSite=Lax cookie and pass it back to `handleLoginCallback`.
     * Only its hash is inside the link.
     */
    binding: string;
    /** When the link stops working (seconds since the epoch). */
    expiresAt: number;
}

export interface IHandleLoginCallbackOptions {
    /** The `binding` cookie set when the link was created. */
    binding: string;
    maxAgeSeconds?: number;
}

/** What `handleLoginCallback` answers. */
export interface ILoginCallbackResult extends IPosty5TokenResult {
    returnTo?: string;
    data?: unknown;
}

/** The sealed `state` payload (internal). */
export interface ISealedLoginState {
    v: number;
    n: string;
    cv: string;
    b: string;
    exp: number;
    rt?: string;
    d?: unknown;
}

/** `new Posty5AppUsersClient(options)` */
export interface IPosty5AppUsersClientOptions {
    /**
     * An API key allowed to read your OAuth apps. Which apps a key may read is set on the key itself
     * (Studio → Developers Kit → API keys → Edit → OAuth access: all your apps, or selected ones). Server side only.
     */
    apiKey: string;
    /**
     * The client id (`p5c_…`) of the OAuth app whose users to read, sent as the `clientId` query parameter
     * of every request. Required when the API key can read more than one of your OAuth apps (Posty5 answers
     * 400 without it); optional when it can read exactly one, which is then used. Trimmed; an empty value
     * counts as not set.
     */
    clientId?: string;
    /** Defaults to `https://api.posty5.com`. */
    baseUrl?: string;
    fetch?: typeof fetch;
}

/** One user of your app, limited to what they granted. */
export interface IPosty5AppUser {
    sub: string;
    name?: string;
    picture?: string;
    email?: string;
    emailVerified?: boolean;
    scopes: Posty5OAuthScope[];
    grantedAt: string;
    lastUsedAt?: string | null;
}

export interface IListAppUsersOptions {
    search?: string;
    pageSize?: number;
    cursor?: string;
}

export interface IAppUsersPage {
    items: IPosty5AppUser[];
    nextCursor: string | null;
    previousCursor: string | null;
    hasMore: boolean;
    totalCount: number;
    pageSize: number;
}
