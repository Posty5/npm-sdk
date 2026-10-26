import { Posty5OAuthConfig } from './config';
import { Posty5OAuthError } from './errors';
import { basicAuthHeader, createPkcePair, decodeJwt, isSafeReturnTo, isSecureUrl, normalizeIssuer, nowSeconds, randomUrlSafe, safeEqual, verifyRs256 } from './helper';
import { bindingHash, sealState, unsealState } from './sealed-state.helper';
import type {
    IBuildAuthorizationUrlOptions,
    ICreateLoginLinkOptions,
    IHandleLoginCallbackOptions,
    ILoginCallbackResult,
    ILoginLink,
    ICallbackParams,
    IExchangeCodeOptions,
    IJsonWebKey,
    IPkcePair,
    IPosty5IdTokenClaims,
    IPosty5OAuthClientOptions,
    IPosty5ProviderMetadata,
    IPosty5TokenResult,
    IPosty5UserInfo,
    IVerifyIdTokenOptions,
} from './interfaces';

/**
 * Login with Posty5 for a back end: authorization code + PKCE against
 * Posty5's OpenID Connect provider, with the ID token verified locally
 * against the provider's JWKS. Server side only: it holds the client secret.
 *
 * ```ts
 * const posty5 = new Posty5OAuthClient({ clientId, clientSecret, redirectUri });
 * // 1. start
 * const { codeVerifier, codeChallenge } = posty5.createPkce();
 * const state = posty5.createState(), nonce = posty5.createNonce();
 * res.redirect(await posty5.buildAuthorizationUrl({ state, nonce, codeChallenge }));
 * // 2. callback
 * const code = posty5.readCallback(req.query, session.state);
 * const { claims } = await posty5.exchangeCode({ code, codeVerifier: session.codeVerifier, nonce: session.nonce });
 * ```
 */
export class Posty5OAuthClient {
    private readonly clientId: string;
    private readonly clientSecret: string;
    private readonly redirectUri: string;
    private readonly issuer: string;
    private readonly fetchImpl: typeof fetch;
    private metadata: { value: IPosty5ProviderMetadata; at: number } | null = null;
    private jwks: { keys: IJsonWebKey[]; at: number } | null = null;

    constructor(options: IPosty5OAuthClientOptions) {
        if (!options?.clientId || !options?.clientSecret || !options?.redirectUri) {
            throw new Posty5OAuthError('config_invalid', 'clientId, clientSecret and redirectUri are required');
        }
        this.clientId = options.clientId;
        this.clientSecret = options.clientSecret;
        this.redirectUri = options.redirectUri;
        this.issuer = normalizeIssuer(options.issuer || Posty5OAuthConfig.defaultIssuer);
        if (!isSecureUrl(this.issuer)) throw new Posty5OAuthError('config_invalid', 'issuer must be an https URL (http only on localhost)');
        const fetchImpl = options.fetch || (globalThis as any).fetch;
        if (typeof fetchImpl !== 'function') throw new Posty5OAuthError('config_invalid', 'No fetch available: use Node 18+ or pass options.fetch');
        this.fetchImpl = fetchImpl;
    }

    /** A new PKCE pair (S256). */
    createPkce(): IPkcePair {
        return createPkcePair();
    }

    /** A new `state` (CSRF protection of the callback). */
    createState(): string {
        return randomUrlSafe();
    }

    /** A new `nonce` (binds the ID token to this sign-in). */
    createNonce(): string {
        return randomUrlSafe();
    }

    /** The discovery document (cached one hour). Its issuer must be exactly the configured one. */
    async discover(): Promise<IPosty5ProviderMetadata> {
        if (this.metadata && Date.now() - this.metadata.at < Posty5OAuthConfig.metadataCacheMs) return this.metadata.value;
        const body = await this.getJson(`${this.issuer}${Posty5OAuthConfig.discoveryPath}`, 'discovery_failed');
        if (normalizeIssuer(body?.issuer) !== this.issuer) throw new Posty5OAuthError('discovery_failed', 'The discovery document names another issuer');
        for (const field of ['authorization_endpoint', 'token_endpoint', 'jwks_uri', 'userinfo_endpoint']) {
            if (typeof body?.[field] !== 'string') throw new Posty5OAuthError('discovery_failed', `The discovery document has no ${field}`);
            if (!isSecureUrl(body[field])) throw new Posty5OAuthError('discovery_failed', `The discovery document's ${field} is not https`);
        }
        this.metadata = { value: body as IPosty5ProviderMetadata, at: Date.now() };
        return this.metadata.value;
    }

    /** The URL to send the user's browser to. */
    async buildAuthorizationUrl(options: IBuildAuthorizationUrlOptions): Promise<string> {
        const scope = options.scope || Posty5OAuthConfig.defaultScope;
        if (!scope.split(' ').includes('openid')) throw new Posty5OAuthError('config_invalid', 'scope must include openid');
        if (!options.state || !options.nonce || !options.codeChallenge) throw new Posty5OAuthError('config_invalid', 'state, nonce and codeChallenge are required');
        const metadata = await this.discover();
        const url = new URL(metadata.authorization_endpoint);
        url.searchParams.set('response_type', 'code');
        url.searchParams.set('client_id', this.clientId);
        url.searchParams.set('redirect_uri', this.redirectUri);
        url.searchParams.set('scope', scope);
        url.searchParams.set('state', options.state);
        url.searchParams.set('nonce', options.nonce);
        url.searchParams.set('code_challenge', options.codeChallenge);
        url.searchParams.set('code_challenge_method', 'S256');
        if (options.prompt) url.searchParams.set('prompt', options.prompt);
        if (typeof options.maxAge === 'number') url.searchParams.set('max_age', String(options.maxAge));
        return url.toString();
    }

    /**
     * Read the callback query: checks `state` (constant time) and turns a
     * provider error (`access_denied` when the user pressed Cancel) into a
     * `Posty5OAuthError` with `code: 'authorization_error'`. Returns the code.
     */
    readCallback(params: ICallbackParams, expectedState: string): string {
        if (!params?.state || !expectedState || !safeEqual(String(params.state), expectedState)) {
            throw new Posty5OAuthError('state_mismatch', 'The state does not match this browser session');
        }
        if (params.error) {
            throw new Posty5OAuthError('authorization_error', params.error_description || params.error, { providerError: String(params.error) });
        }
        if (!params.code) throw new Posty5OAuthError('authorization_error', 'The callback has no code', { providerError: 'invalid_request' });
        return String(params.code);
    }

    /** Exchange the code (client_secret_basic) and verify the ID token. */
    async exchangeCode(options: IExchangeCodeOptions): Promise<IPosty5TokenResult> {
        const metadata = await this.discover();
        const body = new URLSearchParams({
            grant_type: 'authorization_code',
            code: options.code,
            redirect_uri: this.redirectUri,
            code_verifier: options.codeVerifier,
        });
        const response = await this.request(metadata.token_endpoint, {
            method: 'POST',
            headers: { authorization: basicAuthHeader(this.clientId, this.clientSecret), 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
            body: body.toString(),
        }, 'token_error');
        const json = await this.readJson(response, 'token_error');
        if (!response.ok) {
            throw new Posty5OAuthError('token_error', json?.error_description || `Token request failed (${response.status})`, { providerError: json?.error, status: response.status });
        }
        if (typeof json?.id_token !== 'string' || typeof json?.access_token !== 'string') throw new Posty5OAuthError('token_error', 'The token response has no id_token or access_token');
        const claims = await this.verifyIdToken(json.id_token, { nonce: options.nonce, maxAgeSeconds: options.maxAgeSeconds });
        return { idToken: json.id_token, claims, accessToken: json.access_token, expiresIn: Number(json.expires_in) || 0, scope: String(json.scope || '') };
    }

    /** Verify an ID token: RS256 signature from the JWKS, `iss`, `aud`, `exp`, `iat`, and `nonce` / `auth_time` when asked. */
    async verifyIdToken(idToken: string, options: IVerifyIdTokenOptions = {}): Promise<IPosty5IdTokenClaims> {
        const { header, payload, signingInput, signature } = decodeJwt(idToken);
        if (header.alg !== Posty5OAuthConfig.signingAlg) throw new Posty5OAuthError('id_token_invalid', `Unexpected signing algorithm ${header.alg}`);
        const key = await this.findKey(header.kid);
        if (!verifyRs256(key, signingInput, signature)) throw new Posty5OAuthError('id_token_invalid', 'The ID token signature is invalid');

        const skew = Posty5OAuthConfig.clockToleranceSeconds;
        const now = nowSeconds();
        if (normalizeIssuer(payload.iss) !== this.issuer) throw new Posty5OAuthError('id_token_invalid', 'The ID token was issued by someone else');
        const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
        if (!audiences.includes(this.clientId)) throw new Posty5OAuthError('id_token_invalid', 'The ID token is for another client');
        if (audiences.length > 1 && payload.azp !== this.clientId) throw new Posty5OAuthError('id_token_invalid', 'The ID token azp does not match');
        if (typeof payload.exp !== 'number' || payload.exp + skew < now) throw new Posty5OAuthError('id_token_invalid', 'The ID token has expired');
        if (typeof payload.iat !== 'number' || payload.iat - skew > now) throw new Posty5OAuthError('id_token_invalid', 'The ID token was issued in the future');
        if (typeof payload.sub !== 'string' || !payload.sub) throw new Posty5OAuthError('id_token_invalid', 'The ID token has no subject');
        if (options.nonce !== undefined && (typeof payload.nonce !== 'string' || !safeEqual(payload.nonce, options.nonce))) {
            throw new Posty5OAuthError('id_token_invalid', 'The ID token nonce does not match');
        }
        if (typeof options.maxAgeSeconds === 'number') {
            if (typeof payload.auth_time !== 'number' || now - payload.auth_time > options.maxAgeSeconds + skew) {
                throw new Posty5OAuthError('id_token_invalid', 'The Posty5 sign-in is older than maxAgeSeconds');
            }
        }
        return payload as IPosty5IdTokenClaims;
    }

    /**
     * A ready sign-in link, no session store needed: nonce, PKCE verifier,
     * `returnTo`, `data` and expiry travel inside `state`, sealed with a key
     * derived from your client secret (AES-256-GCM). Set `binding` as a cookie
     * on the browser that gets the link and give it back to
     * `handleLoginCallback` — that binds the link to this browser.
     */
    async createLoginLink(options: ICreateLoginLinkOptions = {}): Promise<ILoginLink> {
        const c = Posty5OAuthConfig.loginLink;
        if (options.returnTo && !isSafeReturnTo(options.returnTo)) {
            throw new Posty5OAuthError('config_invalid', 'returnTo must be a path on your site, starting with a single "/"');
        }
        const ttl = Math.min(Math.max(1, options.ttlSeconds ?? c.defaultTtlSeconds), c.maxTtlSeconds);
        const { codeVerifier, codeChallenge } = createPkcePair();
        const nonce = randomUrlSafe();
        const binding = randomUrlSafe();
        const expiresAt = nowSeconds() + ttl;
        const state = sealState(this.clientSecret, {
            v: c.version,
            n: nonce,
            cv: codeVerifier,
            b: bindingHash(binding),
            exp: expiresAt,
            ...(options.returnTo ? { rt: options.returnTo } : {}),
            ...(options.data !== undefined ? { d: options.data } : {}),
        });
        const url = await this.buildAuthorizationUrl({ state, nonce, codeChallenge, scope: options.scope, prompt: options.prompt, maxAge: options.maxAge });
        return { url, binding, expiresAt };
    }

    /**
     * The callback of a `createLoginLink` link: unseals and checks the state
     * (expiry, browser binding), turns `error=access_denied` into
     * `Posty5OAuthError('authorization_error')`, exchanges the code and
     * verifies the ID token. Answers the tokens plus your `returnTo` and `data`.
     */
    async handleLoginCallback(params: ICallbackParams, options: IHandleLoginCallbackOptions): Promise<ILoginCallbackResult> {
        if (!params?.state) throw new Posty5OAuthError('state_mismatch', 'The callback has no state');
        const sealed = unsealState(this.clientSecret, String(params.state));
        if (!options?.binding || !safeEqual(bindingHash(options.binding), sealed.b)) {
            throw new Posty5OAuthError('state_mismatch', 'The login link was opened in another browser');
        }
        if (params.error) throw new Posty5OAuthError('authorization_error', params.error_description || params.error, { providerError: String(params.error) });
        if (!params.code) throw new Posty5OAuthError('authorization_error', 'The callback has no code', { providerError: 'invalid_request' });
        const tokens = await this.exchangeCode({ code: String(params.code), codeVerifier: sealed.cv, nonce: sealed.n, maxAgeSeconds: options.maxAgeSeconds });
        return { ...tokens, returnTo: sealed.rt, data: sealed.d };
    }

    /** The userinfo claims for an access token. */
    async getUserInfo(accessToken: string): Promise<IPosty5UserInfo> {
        const metadata = await this.discover();
        const response = await this.request(metadata.userinfo_endpoint, { headers: { authorization: `Bearer ${accessToken}`, accept: 'application/json' } }, 'userinfo_failed');
        const json = await this.readJson(response, 'userinfo_failed');
        if (!response.ok || typeof json?.sub !== 'string') {
            throw new Posty5OAuthError('userinfo_failed', `Userinfo failed (${response.status})`, { providerError: json?.error, status: response.status });
        }
        return json as IPosty5UserInfo;
    }

    /** The JWK for `kid`; refetches the JWKS once (rate-limited) when the kid is unknown (key rotation). */
    private async findKey(kid: string | undefined): Promise<IJsonWebKey> {
        const pick = (keys: IJsonWebKey[]) => keys.find((k) => k.kty === 'RSA' && (!kid || k.kid === kid) && (!k.use || k.use === 'sig') && (!k.alg || k.alg === Posty5OAuthConfig.signingAlg));
        const fresh = !this.jwks || Date.now() - this.jwks.at >= Posty5OAuthConfig.metadataCacheMs;
        if (fresh) await this.loadJwks();
        let key = pick(this.jwks!.keys);
        if (!key && this.jwks && Date.now() - this.jwks.at >= Posty5OAuthConfig.jwksRefetchMinIntervalMs) {
            await this.loadJwks();
            key = pick(this.jwks!.keys);
        }
        if (!key) throw new Posty5OAuthError('id_token_invalid', 'No matching signing key in the JWKS');
        return key;
    }

    private async loadJwks(): Promise<void> {
        const metadata = await this.discover();
        const body = await this.getJson(metadata.jwks_uri, 'jwks_failed');
        if (!Array.isArray(body?.keys)) throw new Posty5OAuthError('jwks_failed', 'The JWKS has no keys');
        this.jwks = { keys: body.keys, at: Date.now() };
    }

    private async getJson(url: string, code: 'discovery_failed' | 'jwks_failed'): Promise<any> {
        const response = await this.request(url, { headers: { accept: 'application/json' } }, code);
        if (!response.ok) throw new Posty5OAuthError(code, `GET ${url} answered ${response.status}`, { status: response.status });
        return this.readJson(response, code);
    }

    private async request(url: string, init: RequestInit, code: 'discovery_failed' | 'jwks_failed' | 'token_error' | 'userinfo_failed'): Promise<Response> {
        try {
            return await this.fetchImpl(url, { ...init, redirect: 'error', signal: AbortSignal.timeout(Posty5OAuthConfig.requestTimeoutMs) });
        } catch (error: any) {
            throw new Posty5OAuthError(code, `Request to ${url} failed: ${error?.message || error}`);
        }
    }

    private async readJson(response: Response, code: 'discovery_failed' | 'jwks_failed' | 'token_error' | 'userinfo_failed'): Promise<any> {
        try {
            return await response.json();
        } catch {
            throw new Posty5OAuthError(code, `Invalid JSON from the provider (${response.status})`, { status: response.status });
        }
    }
}
