import { Injectable, PLATFORM_ID, Signal, inject, signal } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Posty5AuthDefaults } from '../core/config/posty5-auth.config';
import { Posty5AuthError } from '../core/errors/posty5-auth.error';
import {
    assertProviderMetadata,
    buildAuthorizationUrl,
    buildStartUrl,
    checkCallback,
    decodeJwt,
    isCallbackUrl,
    pickSigningKey,
    readCallbackParams,
    stripCallbackParams,
    toEpochSeconds,
    toRememberedUser,
    validateIdTokenClaims,
} from '../core/helpers/posty5-auth.helper';
import { createPkcePair, randomUrlSafe, verifyRs256 } from '../core/helpers/posty5-crypto.helper';
import type {
    IPosty5BrowserCallbackResult,
    IPosty5Cached,
    IPosty5CallbackResult,
    IPosty5IdTokenClaims,
    IPosty5JsonWebKey,
    IPosty5PendingSignIn,
    IPosty5ProviderMetadata,
    IPosty5RememberedUser,
    IPosty5ResolvedAuthConfig,
    IPosty5SignInOptions,
} from '../core/interfaces';
import { Posty5AuthConfigToken } from '../core/tokens/posty5-auth-config.token';
import { Posty5AuthStorageService } from './posty5-auth-storage.service';
import { Posty5OidcHttpService } from './posty5-oidc-http.service';

/**
 * Login with Posty5 in the browser: starts the sign-in, completes the
 * callback, and remembers the last user for the "Continue as ..." button.
 * Every browser API is behind `isPlatformBrowser`; on the server `signIn`
 * and `handleCallback` reject with `not_browser` and `lastUser` is `null`.
 */
@Injectable({ providedIn: 'root' })
export class Posty5AuthService {
    /** The resolved config (throws `config_invalid` when `providePosty5Auth` is missing). */
    get resolvedConfig(): IPosty5ResolvedAuthConfig {
        if (!this.config) throw new Posty5AuthError('config_invalid', 'Add providePosty5Auth(config) to your application providers');
        return this.config;
    }

    private readonly config = inject(Posty5AuthConfigToken, { optional: true });
    private readonly http = inject(Posty5OidcHttpService);
    private readonly storage = inject(Posty5AuthStorageService);
    private readonly document = inject(DOCUMENT);
    private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
    private readonly lastUserState = signal<IPosty5RememberedUser | null>(null);
    private metadata: IPosty5Cached<Promise<IPosty5ProviderMetadata>> | null = null;
    private jwks: IPosty5Cached<IPosty5JsonWebKey[]> | null = null;

    /** The remembered user (`null` on the server, when none, or with `rememberUser: false`). */
    readonly lastUser: Signal<IPosty5RememberedUser | null> = this.lastUserState.asReadonly();

    constructor() {
        if (this.isBrowser && this.config?.rememberUser) this.lastUserState.set(this.storage.readUser());
    }

    /**
     * Start the sign-in. `startUrl` mode navigates to your back end; the other
     * modes create state, nonce and a PKCE pair, keep them in
     * `sessionStorage` and navigate to Posty5's authorize endpoint.
     */
    async signIn(options: IPosty5SignInOptions = {}): Promise<void> {
        const config = this.resolvedConfig;
        const location = this.browserLocation();
        if (config.mode === 'startUrl') {
            location.assign(
                buildStartUrl({
                    startUrl: config.startUrl,
                    returnUrlParam: config.returnUrlParam,
                    returnUrl: options.returnUrl,
                    prompt: options.prompt,
                    maxAge: options.maxAge,
                    base: location.href,
                }),
            );
            return;
        }
        const crypto = this.browserCrypto();
        const metadata = await this.getProviderMetadata();
        const { codeVerifier, codeChallenge } = await createPkcePair(crypto);
        const pending: IPosty5PendingSignIn = {
            state: randomUrlSafe(crypto),
            nonce: randomUrlSafe(crypto),
            codeVerifier,
            redirectUri: config.redirectUri,
            returnUrl: options.returnUrl,
            maxAge: options.maxAge,
            createdAt: Date.now(),
        };
        this.storage.writePending(pending);
        location.assign(
            buildAuthorizationUrl({
                authorizationEndpoint: metadata.authorization_endpoint,
                clientId: config.clientId,
                redirectUri: config.redirectUri,
                scope: config.scope,
                state: pending.state,
                nonce: pending.nonce,
                codeChallenge,
                prompt: options.prompt,
                maxAge: options.maxAge,
            }),
        );
    }

    /** Does the URL (default: the current one) carry a Posty5 answer? */
    isCallbackUrl(url?: string): boolean {
        if (!url && !this.isBrowser) return false;
        return isCallbackUrl(url || this.browserLocation().href);
    }

    /**
     * Complete the sign-in on the redirect URI: check `state` against this
     * tab's pending sign-in, clear it, remove the OAuth parameters from the
     * address bar, then POST the code to your back end (`codeHandler`) or
     * exchange it and verify the ID token here (`browser`). The user pressing
     * Cancel rejects with `Posty5AuthError` code `cancelled`.
     */
    async handleCallback<TResponse = unknown>(url?: string): Promise<IPosty5CallbackResult<TResponse>> {
        const config = this.resolvedConfig;
        if (config.mode === 'startUrl') {
            throw new Posty5AuthError('config_invalid', 'In startUrl mode your back end handles the callback');
        }
        const location = this.browserLocation();
        const href = url || location.href;
        const params = readCallbackParams(href);
        const pending = this.storage.readPending();
        this.storage.clearPending();
        this.cleanAddressBar(href);
        const code = checkCallback(params, pending, config.issuer, Date.now(), Posty5AuthDefaults.pendingSignInTtlMs);
        const signIn = pending as IPosty5PendingSignIn;

        if (config.mode === 'codeHandler') {
            const response = await this.http.postCodeHandler<TResponse>(config.codeHandlerUrl, {
                code,
                state: signIn.state,
                codeVerifier: signIn.codeVerifier,
                redirectUri: signIn.redirectUri,
                nonce: signIn.nonce,
            });
            return { mode: 'codeHandler', response, returnUrl: signIn.returnUrl };
        }
        return this.exchangeInBrowser(config, code, signIn);
    }

    /** Remember `{ name, picture, email }` for the "Continue as ..." button (no-op with `rememberUser: false`). */
    rememberUser(user: IPosty5RememberedUser): void {
        const config = this.resolvedConfig;
        if (!config.rememberUser) return;
        const remembered = toRememberedUser(user, config.maskRememberedEmail);
        if (!remembered) return;
        this.storage.writeUser(remembered);
        this.lastUserState.set(remembered);
    }

    /** Forget the remembered user (call it on sign-out or "Not you?"). */
    forgetUser(): void {
        this.storage.clearUser();
        this.lastUserState.set(null);
    }

    /** The discovery document (fetched once, cached one hour). */
    getProviderMetadata(): Promise<IPosty5ProviderMetadata> {
        const config = this.resolvedConfig;
        if (this.metadata && Date.now() - this.metadata.at < Posty5AuthDefaults.metadataCacheMs) return this.metadata.value;
        const value = this.http.getDiscovery(config.issuer).then((body) => assertProviderMetadata(body, config.issuer));
        this.metadata = { value, at: Date.now() };
        value.catch(() => (this.metadata = null));
        return value;
    }

    private async exchangeInBrowser(config: IPosty5ResolvedAuthConfig, code: string, pending: IPosty5PendingSignIn): Promise<IPosty5BrowserCallbackResult> {
        const metadata = await this.getProviderMetadata();
        const tokens = await this.http.exchangeCode(
            metadata.token_endpoint,
            new URLSearchParams({
                grant_type: Posty5AuthDefaults.grantType,
                code,
                redirect_uri: pending.redirectUri,
                code_verifier: pending.codeVerifier,
                client_id: config.clientId,
            }),
        );
        const claims = await this.verifyIdToken(config, metadata, tokens.id_token, pending);
        this.rememberUser({ name: claims.name, picture: claims.picture, email: claims.email });
        return {
            mode: 'browser',
            claims,
            idToken: tokens.id_token,
            accessToken: tokens.access_token,
            expiresIn: Number(tokens.expires_in) || 0,
            scope: String(tokens.scope || ''),
            returnUrl: pending.returnUrl,
        };
    }

    private async verifyIdToken(
        config: IPosty5ResolvedAuthConfig,
        metadata: IPosty5ProviderMetadata,
        idToken: string,
        pending: IPosty5PendingSignIn,
    ): Promise<IPosty5IdTokenClaims> {
        const { header, payload, signingInput, signature } = decodeJwt(idToken);
        if (header['alg'] !== Posty5AuthDefaults.signingAlg) throw new Posty5AuthError('id_token_invalid', `Unexpected signing algorithm ${String(header['alg'])}`);
        const key = await this.findKey(metadata, typeof header['kid'] === 'string' ? header['kid'] : undefined);
        let valid = false;
        try {
            valid = await verifyRs256(this.browserCrypto(), key, signingInput, signature);
        } catch {
            valid = false;
        }
        if (!valid) throw new Posty5AuthError('id_token_invalid', 'The ID token signature is invalid');
        return validateIdTokenClaims(payload, {
            issuer: config.issuer,
            clientId: config.clientId,
            nonce: pending.nonce,
            maxAge: pending.maxAge,
            nowSeconds: toEpochSeconds(Date.now()),
            clockToleranceSeconds: Posty5AuthDefaults.clockToleranceSeconds,
        });
    }

    /** The JWK for `kid`; refetches the JWKS once (rate-limited) when the kid is unknown (key rotation). */
    private async findKey(metadata: IPosty5ProviderMetadata, kid: string | undefined): Promise<IPosty5JsonWebKey> {
        if (!this.jwks || Date.now() - this.jwks.at >= Posty5AuthDefaults.metadataCacheMs) await this.loadJwks(metadata);
        let key = pickSigningKey(this.jwks?.value || [], kid);
        if (!key && this.jwks && Date.now() - this.jwks.at >= Posty5AuthDefaults.jwksRefetchMinIntervalMs) {
            await this.loadJwks(metadata);
            key = pickSigningKey(this.jwks?.value || [], kid);
        }
        if (!key) throw new Posty5AuthError('id_token_invalid', 'No matching signing key in the JWKS');
        return key;
    }

    private async loadJwks(metadata: IPosty5ProviderMetadata): Promise<void> {
        const body = await this.http.getJwks(metadata.jwks_uri);
        this.jwks = { value: body.keys, at: Date.now() };
    }

    /** Remove `code`, `state`, `error` ... from the address bar without a navigation. */
    private cleanAddressBar(href: string): void {
        const view = this.document.defaultView;
        if (!view || href !== view.location.href) return;
        try {
            view.history.replaceState(view.history.state, '', stripCallbackParams(href));
        } catch {
            // A sandboxed frame may refuse replaceState; the code is single-use anyway.
        }
    }

    private browserLocation(): Location {
        const view = this.document.defaultView;
        if (!this.isBrowser || !view) throw new Posty5AuthError('not_browser', 'Login with Posty5 runs in the browser only');
        return view.location;
    }

    private browserCrypto(): Crypto {
        const crypto = this.document.defaultView?.crypto;
        if (!this.isBrowser || !crypto?.subtle) {
            throw new Posty5AuthError('not_browser', 'WebCrypto is not available (the page must be served over HTTPS or from localhost)');
        }
        return crypto;
    }
}
