import type { Posty5Prompt } from './posty5-auth-config.interface';

/** The parts of the discovery document the package uses. */
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

/** One RSA public key of the JWKS. */
export interface IPosty5JsonWebKey {
    kty: string;
    kid?: string;
    use?: string;
    alg?: string;
    n?: string;
    e?: string;
    [member: string]: unknown;
}

export interface IPosty5Jwks {
    keys: IPosty5JsonWebKey[];
}

/** The token endpoint's success answer. */
export interface IPosty5TokenResponse {
    id_token: string;
    access_token: string;
    token_type?: string;
    expires_in?: number;
    scope?: string;
    [member: string]: unknown;
}

/** RFC 7636 S256 pair. */
export interface IPosty5PkcePair {
    codeVerifier: string;
    codeChallenge: string;
}

/** What `signIn` keeps in `sessionStorage` (one key) until the callback. */
export interface IPosty5PendingSignIn {
    state: string;
    nonce: string;
    codeVerifier: string;
    redirectUri: string;
    returnUrl?: string;
    maxAge?: number;
    /** Epoch ms; a pending sign-in older than the configured TTL is refused. */
    createdAt: number;
}

/** Input of `buildAuthorizationUrl`. */
export interface IPosty5AuthorizationUrlParams {
    authorizationEndpoint: string;
    clientId: string;
    redirectUri: string;
    scope: string;
    state: string;
    nonce: string;
    codeChallenge: string;
    prompt?: Posty5Prompt;
    maxAge?: number;
}

/** Input of `buildStartUrl`. */
export interface IPosty5StartUrlParams {
    startUrl: string;
    returnUrlParam: string;
    returnUrl?: string;
    prompt?: Posty5Prompt;
    maxAge?: number;
    /** Base for a relative `startUrl` (the page's `location.href`). */
    base: string;
}

/** The OAuth parameters found on the callback URL. */
export interface IPosty5CallbackParams {
    code: string | null;
    state: string | null;
    error: string | null;
    errorDescription: string | null;
    iss: string | null;
}

/** Input of `validateIdTokenClaims`. */
export interface IPosty5ClaimsCheck {
    issuer: string;
    clientId: string;
    nonce?: string;
    maxAge?: number;
    nowSeconds: number;
    clockToleranceSeconds: number;
}

/** A compact JWS, decoded (signature not checked). */
export interface IPosty5DecodedJwt {
    header: Record<string, unknown>;
    payload: Record<string, unknown>;
    signingInput: string;
    signature: Uint8Array;
}

/** A cached value and when it was fetched (epoch ms). */
export interface IPosty5Cached<T> {
    value: T;
    at: number;
}
