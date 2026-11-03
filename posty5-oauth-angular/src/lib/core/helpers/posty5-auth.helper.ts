import { Posty5AuthDefaults, Posty5CallbackParams, Posty5EmailMask } from '../config/posty5-auth.config';
import { Posty5AuthError } from '../errors/posty5-auth.error';
import type {
    IPosty5AuthConfig,
    IPosty5AuthorizationUrlParams,
    IPosty5CallbackParams,
    IPosty5ClaimsCheck,
    IPosty5DecodedJwt,
    IPosty5IdTokenClaims,
    IPosty5JsonWebKey,
    IPosty5PendingSignIn,
    IPosty5ProviderMetadata,
    IPosty5RememberedUser,
    IPosty5ResolvedAuthConfig,
    IPosty5StartUrlParams,
} from '../interfaces';

/** The issuer without a trailing slash. */
export function normalizeIssuer(issuer: unknown): string {
    return String(issuer || '').replace(/\/+$/, '');
}

/** Seconds since the epoch for an epoch-ms value. */
export function toEpochSeconds(epochMs: number): number {
    return Math.floor(epochMs / Posty5AuthDefaults.msPerSecond);
}

/**
 * Whether a provider URL may receive the code and verifier: `https:`, or
 * `http:` on this machine only. Over plain http a network attacker could swap
 * the JWKS and have forged ID tokens accepted.
 */
export function isSecureUrl(value: unknown): boolean {
    try {
        const url = new URL(String(value));
        if (url.protocol === 'https:') return true;
        return url.protocol === 'http:' && (Posty5AuthDefaults.loopbackHostnames as readonly string[]).includes(url.hostname.toLowerCase());
    } catch {
        return false;
    }
}

/** Apply the defaults and check what each mode needs. Throws `config_invalid`. */
export function resolveAuthConfig(config: IPosty5AuthConfig): IPosty5ResolvedAuthConfig {
    if (!config || !config.mode) throw new Posty5AuthError('config_invalid', 'providePosty5Auth: mode is required');
    const scope = (config.scope || Posty5AuthDefaults.scope).trim();
    if (!scope.split(/\s+/).includes(Posty5AuthDefaults.requiredScope)) {
        throw new Posty5AuthError('config_invalid', 'providePosty5Auth: scope must include openid');
    }
    const resolved: IPosty5ResolvedAuthConfig = {
        mode: config.mode,
        issuer: normalizeIssuer(config.issuer || Posty5AuthDefaults.issuer),
        scope,
        clientId: config.clientId || '',
        redirectUri: config.redirectUri || '',
        startUrl: config.mode === 'startUrl' ? config.startUrl || '' : '',
        returnUrlParam: (config.mode === 'startUrl' && config.returnUrlParam) || Posty5AuthDefaults.returnUrlParam,
        codeHandlerUrl: config.mode === 'codeHandler' ? config.codeHandlerUrl || '' : '',
        rememberUser: config.rememberUser ?? Posty5AuthDefaults.rememberUser,
        maskRememberedEmail: config.maskRememberedEmail ?? Posty5AuthDefaults.maskRememberedEmail,
        locale: config.locale || null,
        labels: config.labels || {},
    };
    if (!isSecureUrl(resolved.issuer)) {
        throw new Posty5AuthError('config_invalid', 'providePosty5Auth: issuer must be an https URL (http only on localhost)');
    }
    if (resolved.mode === 'startUrl') {
        if (!resolved.startUrl) throw new Posty5AuthError('config_invalid', 'providePosty5Auth: startUrl mode needs startUrl');
        return resolved;
    }
    if (resolved.mode !== 'codeHandler' && resolved.mode !== 'browser') {
        throw new Posty5AuthError('config_invalid', `providePosty5Auth: unknown mode ${String(resolved.mode)}`);
    }
    if (!resolved.clientId || !resolved.redirectUri) {
        throw new Posty5AuthError('config_invalid', `providePosty5Auth: ${resolved.mode} mode needs clientId and redirectUri`);
    }
    if (resolved.mode === 'codeHandler' && !resolved.codeHandlerUrl) {
        throw new Posty5AuthError('config_invalid', 'providePosty5Auth: codeHandler mode needs codeHandlerUrl');
    }
    return resolved;
}

/** Check a discovery document: same issuer, every endpoint present. Throws `discovery_failed`. */
export function assertProviderMetadata(body: unknown, issuer: string): IPosty5ProviderMetadata {
    const metadata = body as IPosty5ProviderMetadata | null;
    if (!metadata || normalizeIssuer(metadata.issuer) !== normalizeIssuer(issuer)) {
        throw new Posty5AuthError('discovery_failed', 'The discovery document names another issuer');
    }
    for (const field of ['authorization_endpoint', 'token_endpoint', 'jwks_uri', 'userinfo_endpoint']) {
        if (typeof metadata[field] !== 'string') throw new Posty5AuthError('discovery_failed', `The discovery document has no ${field}`);
        if (!isSecureUrl(metadata[field])) throw new Posty5AuthError('discovery_failed', `The discovery document's ${field} is not https`);
    }
    return metadata;
}

/** The `/oauth/authorize` URL (code + PKCE S256). */
export function buildAuthorizationUrl(params: IPosty5AuthorizationUrlParams): string {
    if (!params.state || !params.nonce || !params.codeChallenge) {
        throw new Posty5AuthError('config_invalid', 'state, nonce and codeChallenge are required');
    }
    const url = new URL(params.authorizationEndpoint);
    url.searchParams.set('response_type', Posty5AuthDefaults.responseType);
    url.searchParams.set('client_id', params.clientId);
    url.searchParams.set('redirect_uri', params.redirectUri);
    url.searchParams.set('scope', params.scope);
    url.searchParams.set('state', params.state);
    url.searchParams.set('nonce', params.nonce);
    url.searchParams.set('code_challenge', params.codeChallenge);
    url.searchParams.set('code_challenge_method', Posty5AuthDefaults.codeChallengeMethod);
    if (params.prompt) url.searchParams.set('prompt', params.prompt);
    if (typeof params.maxAge === 'number') url.searchParams.set('max_age', String(params.maxAge));
    return url.toString();
}

/**
 * `startUrl` + `?returnUrl=...` (plus `prompt` / `max_age` when given). A
 * relative `startUrl` stays relative so the request goes to the app's own
 * origin.
 */
export function buildStartUrl(params: IPosty5StartUrlParams): string {
    const url = new URL(params.startUrl, params.base);
    if (params.returnUrl) url.searchParams.set(params.returnUrlParam, params.returnUrl);
    if (params.prompt) url.searchParams.set('prompt', params.prompt);
    if (typeof params.maxAge === 'number') url.searchParams.set('max_age', String(params.maxAge));
    const isAbsolute = /^[a-z][a-z\d+\-.]*:\/\//i.test(params.startUrl);
    return isAbsolute ? url.toString() : `${url.pathname}${url.search}${url.hash}`;
}

/** The OAuth parameters of a callback URL (query string). */
export function readCallbackParams(href: string): IPosty5CallbackParams {
    const query = new URL(href).searchParams;
    return {
        code: query.get(Posty5CallbackParams.code),
        state: query.get(Posty5CallbackParams.state),
        error: query.get(Posty5CallbackParams.error),
        errorDescription: query.get(Posty5CallbackParams.errorDescription),
        iss: query.get(Posty5CallbackParams.iss),
    };
}

/** Does this URL carry an OAuth answer (`code` or `error`, with `state`)? */
export function isCallbackUrl(href: string): boolean {
    const params = readCallbackParams(href);
    return !!params.state && (!!params.code || !!params.error);
}

/** The same URL without the OAuth parameters (for `history.replaceState`). */
export function stripCallbackParams(href: string): string {
    const url = new URL(href);
    for (const name of Object.values(Posty5CallbackParams)) url.searchParams.delete(name);
    return `${url.pathname}${url.search}${url.hash}`;
}

/** Constant-time string equality (for `state` and `nonce`). Empty strings never match. */
export function safeEqual(a: string, b: string): boolean {
    const x = String(a ?? '');
    const y = String(b ?? '');
    if (!x.length || x.length !== y.length) return false;
    let diff = 0;
    for (let i = 0; i < x.length; i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
    return diff === 0;
}

/**
 * Check the callback against the pending sign-in of this tab: the state
 * must match (constant time), the sign-in must be fresh, and a provider
 * error becomes a typed error (`access_denied` -> `cancelled`). Returns the code.
 */
export function checkCallback(params: IPosty5CallbackParams, pending: IPosty5PendingSignIn | null, issuer: string, nowMs: number, ttlMs: number): string {
    if (!pending || !params.state || !safeEqual(params.state, pending.state)) {
        throw new Posty5AuthError('state_mismatch', 'The state does not match this browser session');
    }
    if (!(nowMs - pending.createdAt <= ttlMs)) {
        throw new Posty5AuthError('sign_in_expired', 'The sign-in took too long; please start again');
    }
    if (params.iss && normalizeIssuer(params.iss) !== normalizeIssuer(issuer)) {
        throw new Posty5AuthError('authorization_error', 'The callback came from another issuer', { providerError: 'invalid_issuer' });
    }
    if (params.error) {
        const code = params.error === Posty5AuthDefaults.cancelledError ? 'cancelled' : 'authorization_error';
        throw new Posty5AuthError(code, params.errorDescription || params.error, { providerError: params.error });
    }
    if (!params.code) throw new Posty5AuthError('authorization_error', 'The callback has no code', { providerError: 'invalid_request' });
    return params.code;
}

/** Read a JSON value written by the package; anything unreadable is `null`. */
export function parseStoredJson<T>(raw: string | null): T | null {
    if (!raw) return null;
    try {
        const value = JSON.parse(raw);
        return value && typeof value === 'object' ? (value as T) : null;
    } catch {
        return null;
    }
}

/** `ahmed@gmail.com` -> `ah***@gmail.com`. Not an address -> unchanged. */
export function maskEmail(email: string): string {
    const at = email.lastIndexOf('@');
    if (at <= 0) return email;
    return `${email.slice(0, Math.min(Posty5EmailMask.visibleChars, at))}${Posty5EmailMask.mask}${email.slice(at)}`;
}

/** Keep only `{ name, picture, email }` (strings), masking the e-mail when asked. `null` when nothing is left. */
export function toRememberedUser(source: Partial<Record<keyof IPosty5RememberedUser, unknown>> | null | undefined, mask: boolean): IPosty5RememberedUser | null {
    if (!source) return null;
    const user: IPosty5RememberedUser = {};
    if (typeof source.name === 'string' && source.name.trim()) user.name = source.name.trim();
    if (typeof source.picture === 'string' && /^https:\/\//i.test(source.picture)) user.picture = source.picture;
    if (typeof source.email === 'string' && source.email.trim()) user.email = mask ? maskEmail(source.email.trim()) : source.email.trim();
    return user.name || user.email ? user : null;
}

/** base64url (no padding) of bytes. */
export function base64UrlEncode(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Bytes of a base64url string. */
export function base64UrlDecode(value: string): Uint8Array {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

/** The three parts of a compact JWS (signature not checked). Throws `id_token_invalid`. */
export function decodeJwt(token: string): IPosty5DecodedJwt {
    const parts = String(token || '').split('.');
    if (parts.length !== 3) throw new Posty5AuthError('id_token_invalid', 'The ID token is not a JWT');
    try {
        const decoder = new TextDecoder();
        return {
            header: JSON.parse(decoder.decode(base64UrlDecode(parts[0]))),
            payload: JSON.parse(decoder.decode(base64UrlDecode(parts[1]))),
            signingInput: `${parts[0]}.${parts[1]}`,
            signature: base64UrlDecode(parts[2]),
        };
    } catch {
        throw new Posty5AuthError('id_token_invalid', 'The ID token could not be decoded');
    }
}

/** The RS256 signing key for `kid` from a JWKS, if any. */
export function pickSigningKey(keys: IPosty5JsonWebKey[], kid: string | undefined): IPosty5JsonWebKey | undefined {
    return keys.find(
        (k) => k.kty === 'RSA' && (!kid || k.kid === kid) && (!k.use || k.use === 'sig') && (!k.alg || k.alg === Posty5AuthDefaults.signingAlg),
    );
}

/** Check `iss`, `aud` / `azp`, `exp`, `iat`, `sub`, `nonce` and `auth_time`. Throws `id_token_invalid`. */
export function validateIdTokenClaims(payload: Record<string, unknown>, check: IPosty5ClaimsCheck): IPosty5IdTokenClaims {
    const skew = check.clockToleranceSeconds;
    const now = check.nowSeconds;
    if (normalizeIssuer(payload['iss']) !== normalizeIssuer(check.issuer)) throw new Posty5AuthError('id_token_invalid', 'The ID token was issued by someone else');
    const audiences = Array.isArray(payload['aud']) ? (payload['aud'] as unknown[]) : [payload['aud']];
    if (!audiences.includes(check.clientId)) throw new Posty5AuthError('id_token_invalid', 'The ID token is for another client');
    if (audiences.length > 1 && payload['azp'] !== check.clientId) throw new Posty5AuthError('id_token_invalid', 'The ID token azp does not match');
    const exp = payload['exp'];
    const iat = payload['iat'];
    if (typeof exp !== 'number' || exp + skew < now) throw new Posty5AuthError('id_token_invalid', 'The ID token has expired');
    if (typeof iat !== 'number' || iat - skew > now) throw new Posty5AuthError('id_token_invalid', 'The ID token was issued in the future');
    if (typeof payload['sub'] !== 'string' || !payload['sub']) throw new Posty5AuthError('id_token_invalid', 'The ID token has no subject');
    if (check.nonce !== undefined) {
        const nonce = payload['nonce'];
        if (typeof nonce !== 'string' || !safeEqual(nonce, check.nonce)) throw new Posty5AuthError('id_token_invalid', 'The ID token nonce does not match');
    }
    if (typeof check.maxAge === 'number') {
        const authTime = payload['auth_time'];
        if (typeof authTime !== 'number' || now - authTime > check.maxAge + skew) {
            throw new Posty5AuthError('id_token_invalid', 'The Posty5 sign-in is older than maxAge');
        }
    }
    return payload as IPosty5IdTokenClaims;
}

/** An abort signal that fires after `ms`, where the browser supports `AbortSignal.timeout`. */
export function createTimeoutSignal(ms: number): AbortSignal | undefined {
    return typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(ms) : undefined;
}
