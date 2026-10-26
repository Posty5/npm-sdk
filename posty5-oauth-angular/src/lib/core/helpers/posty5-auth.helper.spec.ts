import { Posty5AuthDefaults } from '../config/posty5-auth.config';
import { Posty5AuthError } from '../errors/posty5-auth.error';
import type { IPosty5CallbackParams, IPosty5PendingSignIn } from '../interfaces';
import {
    assertProviderMetadata,
    base64UrlDecode,
    base64UrlEncode,
    buildAuthorizationUrl,
    buildStartUrl,
    checkCallback,
    decodeJwt,
    isCallbackUrl,
    maskEmail,
    normalizeIssuer,
    parseStoredJson,
    pickSigningKey,
    readCallbackParams,
    resolveAuthConfig,
    safeEqual,
    stripCallbackParams,
    toRememberedUser,
    validateIdTokenClaims,
} from './posty5-auth.helper';

function expectAuthError(fn: () => unknown, code: string): void {
    try {
        fn();
    } catch (error) {
        expect(error instanceof Posty5AuthError).toBeTrue();
        expect((error as Posty5AuthError).code).toBe(code as Posty5AuthError['code']);
        return;
    }
    fail(`expected Posty5AuthError ${code}`);
}

const issuer = 'https://api.posty5.com';
const now = 1_800_000_000_000;
const pending: IPosty5PendingSignIn = {
    state: 'state-123',
    nonce: 'nonce-456',
    codeVerifier: 'verifier',
    redirectUri: 'https://app.example/auth/callback',
    createdAt: now - 1000,
};
const callback = (overrides: Partial<IPosty5CallbackParams> = {}): IPosty5CallbackParams => ({
    code: 'the-code',
    state: 'state-123',
    error: null,
    errorDescription: null,
    iss: null,
    ...overrides,
});

describe('posty5-auth.helper', () => {
    describe('resolveAuthConfig', () => {
        it('applies the defaults', () => {
            const config = resolveAuthConfig({ mode: 'startUrl', startUrl: '/api/auth/posty5/start' });
            expect(config.issuer).toBe(Posty5AuthDefaults.issuer);
            expect(config.scope).toBe('openid profile email');
            expect(config.returnUrlParam).toBe('returnUrl');
            expect(config.rememberUser).toBeTrue();
            expect(config.maskRememberedEmail).toBeTrue();
        });

        it('strips a trailing slash from the issuer', () => {
            const config = resolveAuthConfig({ mode: 'browser', clientId: 'p5c_x', redirectUri: 'https://a/cb', issuer: 'https://test-api.posty5.com/' });
            expect(config.issuer).toBe('https://test-api.posty5.com');
        });

        it('requires what each mode needs', () => {
            expectAuthError(() => resolveAuthConfig({ mode: 'startUrl', startUrl: '' }), 'config_invalid');
            expectAuthError(() => resolveAuthConfig({ mode: 'browser', clientId: '', redirectUri: 'https://a/cb' }), 'config_invalid');
            expectAuthError(() => resolveAuthConfig({ mode: 'codeHandler', clientId: 'p5c_x', redirectUri: 'https://a/cb', codeHandlerUrl: '' }), 'config_invalid');
        });

        it('requires an https issuer, allowing http on localhost only', () => {
            expectAuthError(() => resolveAuthConfig({ mode: 'browser', clientId: 'p5c_x', redirectUri: 'https://a/cb', issuer: 'http://api.posty5.com' }), 'config_invalid');
            expect(resolveAuthConfig({ mode: 'browser', clientId: 'p5c_x', redirectUri: 'https://a/cb', issuer: 'http://localhost:3000' }).issuer).toBe('http://localhost:3000');
        });

        it('requires openid in the scope', () => {
            expectAuthError(() => resolveAuthConfig({ mode: 'browser', clientId: 'p5c_x', redirectUri: 'https://a/cb', scope: 'profile email' }), 'config_invalid');
        });
    });

    describe('buildAuthorizationUrl', () => {
        it('builds a code + PKCE S256 request', () => {
            const url = new URL(
                buildAuthorizationUrl({
                    authorizationEndpoint: 'https://api.posty5.com/oauth/authorize',
                    clientId: 'p5c_abc',
                    redirectUri: 'https://app.example/auth/callback',
                    scope: 'openid profile email',
                    state: 's',
                    nonce: 'n',
                    codeChallenge: 'c',
                    prompt: 'consent',
                    maxAge: 0,
                }),
            );
            expect(url.origin + url.pathname).toBe('https://api.posty5.com/oauth/authorize');
            expect(url.searchParams.get('response_type')).toBe('code');
            expect(url.searchParams.get('client_id')).toBe('p5c_abc');
            expect(url.searchParams.get('redirect_uri')).toBe('https://app.example/auth/callback');
            expect(url.searchParams.get('scope')).toBe('openid profile email');
            expect(url.searchParams.get('state')).toBe('s');
            expect(url.searchParams.get('nonce')).toBe('n');
            expect(url.searchParams.get('code_challenge')).toBe('c');
            expect(url.searchParams.get('code_challenge_method')).toBe('S256');
            expect(url.searchParams.get('prompt')).toBe('consent');
            expect(url.searchParams.get('max_age')).toBe('0');
        });

        it('leaves prompt and max_age out when not given', () => {
            const url = new URL(
                buildAuthorizationUrl({
                    authorizationEndpoint: 'https://api.posty5.com/oauth/authorize',
                    clientId: 'p5c_abc',
                    redirectUri: 'https://a/cb',
                    scope: 'openid',
                    state: 's',
                    nonce: 'n',
                    codeChallenge: 'c',
                }),
            );
            expect(url.searchParams.has('prompt')).toBeFalse();
            expect(url.searchParams.has('max_age')).toBeFalse();
        });

        it('refuses a request without state, nonce or challenge', () => {
            expectAuthError(
                () =>
                    buildAuthorizationUrl({
                        authorizationEndpoint: 'https://api.posty5.com/oauth/authorize',
                        clientId: 'p5c_abc',
                        redirectUri: 'https://a/cb',
                        scope: 'openid',
                        state: '',
                        nonce: 'n',
                        codeChallenge: 'c',
                    }),
                'config_invalid',
            );
        });
    });

    describe('buildStartUrl', () => {
        it('keeps a relative start URL relative and appends the return URL', () => {
            expect(buildStartUrl({ startUrl: '/api/auth/posty5/start', returnUrlParam: 'returnUrl', returnUrl: '/feed?tab=1', base: 'https://trenddigest.example/en' })).toBe(
                '/api/auth/posty5/start?returnUrl=%2Ffeed%3Ftab%3D1',
            );
        });

        it('uses the configured parameter name and keeps existing query parameters', () => {
            expect(buildStartUrl({ startUrl: 'https://api.example/start?x=1', returnUrlParam: 'next', returnUrl: '/a', prompt: 'login', base: 'https://app.example/' })).toBe(
                'https://api.example/start?x=1&next=%2Fa&prompt=login',
            );
        });

        it('adds nothing when there is no return URL', () => {
            expect(buildStartUrl({ startUrl: '/start', returnUrlParam: 'returnUrl', base: 'https://app.example/' })).toBe('/start');
        });
    });

    describe('callback URL', () => {
        const href = 'https://app.example/auth/callback?code=abc&state=xyz&iss=https%3A%2F%2Fapi.posty5.com&keep=1#top';

        it('reads the OAuth parameters', () => {
            expect(readCallbackParams(href)).toEqual({ code: 'abc', state: 'xyz', error: null, errorDescription: null, iss: 'https://api.posty5.com' });
        });

        it('recognises a callback URL', () => {
            expect(isCallbackUrl(href)).toBeTrue();
            expect(isCallbackUrl('https://app.example/auth/callback?error=access_denied&state=xyz')).toBeTrue();
            expect(isCallbackUrl('https://app.example/auth/callback?code=abc')).toBeFalse();
        });

        it('strips the OAuth parameters and keeps the rest', () => {
            expect(stripCallbackParams(href)).toBe('/auth/callback?keep=1#top');
        });
    });

    describe('safeEqual', () => {
        it('compares strings', () => {
            expect(safeEqual('abc', 'abc')).toBeTrue();
            expect(safeEqual('abc', 'abd')).toBeFalse();
            expect(safeEqual('abc', 'abcd')).toBeFalse();
            expect(safeEqual('', '')).toBeFalse();
        });
    });

    describe('checkCallback (state checks)', () => {
        const ttl = Posty5AuthDefaults.pendingSignInTtlMs;

        it('returns the code when the state matches', () => {
            expect(checkCallback(callback(), pending, issuer, now, ttl)).toBe('the-code');
        });

        it('refuses a different state', () => {
            expectAuthError(() => checkCallback(callback({ state: 'other' }), pending, issuer, now, ttl), 'state_mismatch');
        });

        it('refuses a callback without a pending sign-in', () => {
            expectAuthError(() => checkCallback(callback(), null, issuer, now, ttl), 'state_mismatch');
        });

        it('refuses a callback without state', () => {
            expectAuthError(() => checkCallback(callback({ state: null }), pending, issuer, now, ttl), 'state_mismatch');
        });

        it('refuses a stale pending sign-in', () => {
            expectAuthError(() => checkCallback(callback(), { ...pending, createdAt: now - ttl - 1 }, issuer, now, ttl), 'sign_in_expired');
        });

        it('turns access_denied into cancelled', () => {
            expectAuthError(() => checkCallback(callback({ code: null, error: 'access_denied' }), pending, issuer, now, ttl), 'cancelled');
        });

        it('turns other provider errors into authorization_error', () => {
            expectAuthError(() => checkCallback(callback({ code: null, error: 'invalid_scope' }), pending, issuer, now, ttl), 'authorization_error');
        });

        it('refuses another issuer (RFC 9207 iss)', () => {
            expectAuthError(() => checkCallback(callback({ iss: 'https://evil.example' }), pending, issuer, now, ttl), 'authorization_error');
        });

        it('refuses a callback without code', () => {
            expectAuthError(() => checkCallback(callback({ code: null }), pending, issuer, now, ttl), 'authorization_error');
        });
    });

    describe('assertProviderMetadata', () => {
        const metadata = {
            issuer,
            authorization_endpoint: `${issuer}/oauth/authorize`,
            token_endpoint: `${issuer}/oauth/token`,
            userinfo_endpoint: `${issuer}/oauth/userinfo`,
            jwks_uri: `${issuer}/oauth/jwks`,
        };

        it('accepts the Posty5 document', () => {
            expect(assertProviderMetadata(metadata, `${issuer}/`).token_endpoint).toBe(`${issuer}/oauth/token`);
        });

        it('refuses another issuer or a missing endpoint', () => {
            expectAuthError(() => assertProviderMetadata({ ...metadata, issuer: 'https://evil.example' }, issuer), 'discovery_failed');
            expectAuthError(() => assertProviderMetadata({ ...metadata, jwks_uri: undefined }, issuer), 'discovery_failed');
        });

        it('refuses an endpoint over plain http', () => {
            expectAuthError(() => assertProviderMetadata({ ...metadata, jwks_uri: 'http://evil.example/jwks' }, issuer), 'discovery_failed');
        });
    });

    describe('validateIdTokenClaims', () => {
        const nowSeconds = 1_800_000_000;
        const claims = { iss: issuer, aud: 'p5c_abc', sub: 'pairwise-sub', exp: nowSeconds + 300, iat: nowSeconds - 5, nonce: 'n', auth_time: nowSeconds - 30 };
        const check = { issuer, clientId: 'p5c_abc', nonce: 'n', nowSeconds, clockToleranceSeconds: 60 };

        it('accepts valid claims', () => {
            expect(validateIdTokenClaims(claims, check).sub).toBe('pairwise-sub');
        });

        it('checks iss, aud, exp, iat, sub and nonce', () => {
            expectAuthError(() => validateIdTokenClaims({ ...claims, iss: 'https://evil.example' }, check), 'id_token_invalid');
            expectAuthError(() => validateIdTokenClaims({ ...claims, aud: 'p5c_other' }, check), 'id_token_invalid');
            expectAuthError(() => validateIdTokenClaims({ ...claims, exp: nowSeconds - 61 }, check), 'id_token_invalid');
            expectAuthError(() => validateIdTokenClaims({ ...claims, iat: nowSeconds + 61 }, check), 'id_token_invalid');
            expectAuthError(() => validateIdTokenClaims({ ...claims, sub: '' }, check), 'id_token_invalid');
            expectAuthError(() => validateIdTokenClaims({ ...claims, nonce: 'x' }, check), 'id_token_invalid');
        });

        it('tolerates 60 s of clock skew', () => {
            expect(validateIdTokenClaims({ ...claims, exp: nowSeconds - 59, iat: nowSeconds + 59 }, check).sub).toBe('pairwise-sub');
        });

        it('requires azp with several audiences', () => {
            expectAuthError(() => validateIdTokenClaims({ ...claims, aud: ['p5c_abc', 'other'] }, check), 'id_token_invalid');
            expect(validateIdTokenClaims({ ...claims, aud: ['p5c_abc', 'other'], azp: 'p5c_abc' }, check).sub).toBe('pairwise-sub');
        });

        it('checks auth_time against maxAge', () => {
            expect(validateIdTokenClaims(claims, { ...check, maxAge: 60 }).sub).toBe('pairwise-sub');
            expectAuthError(() => validateIdTokenClaims({ ...claims, auth_time: nowSeconds - 200 }, { ...check, maxAge: 60 }), 'id_token_invalid');
        });
    });

    describe('JWT and base64url', () => {
        it('round-trips base64url', () => {
            const bytes = new Uint8Array([0, 251, 255, 1, 2, 3]);
            expect(Array.from(base64UrlDecode(base64UrlEncode(bytes)))).toEqual(Array.from(bytes));
            expect(base64UrlEncode(bytes)).not.toMatch(/[+/=]/);
        });

        it('decodes a compact JWS', () => {
            const encode = (value: object) => base64UrlEncode(new TextEncoder().encode(JSON.stringify(value)));
            const token = `${encode({ alg: 'RS256', kid: 'k1' })}.${encode({ sub: 'x' })}.${base64UrlEncode(new Uint8Array([1, 2]))}`;
            const decoded = decodeJwt(token);
            expect(decoded.header['kid']).toBe('k1');
            expect(decoded.payload['sub']).toBe('x');
            expect(Array.from(decoded.signature)).toEqual([1, 2]);
        });

        it('refuses a token that is not a JWT', () => {
            expectAuthError(() => decodeJwt('not-a-jwt'), 'id_token_invalid');
        });

        it('picks the RS256 signing key for the kid', () => {
            const keys = [
                { kty: 'RSA', kid: 'old', use: 'sig', alg: 'RS256' },
                { kty: 'RSA', kid: 'new', use: 'sig', alg: 'RS256' },
                { kty: 'EC', kid: 'ec' },
            ];
            expect(pickSigningKey(keys, 'new')?.kid).toBe('new');
            expect(pickSigningKey(keys, 'ec')).toBeUndefined();
            expect(pickSigningKey(keys, 'missing')).toBeUndefined();
        });
    });

    describe('remembered user', () => {
        it('masks the e-mail', () => {
            expect(maskEmail('ahmed@gmail.com')).toBe('ah***@gmail.com');
            expect(maskEmail('a@x.com')).toBe('a***@x.com');
            expect(maskEmail('not-an-email')).toBe('not-an-email');
        });

        it('keeps only name, https picture and e-mail', () => {
            expect(toRememberedUser({ name: ' Ahmed ', picture: 'https://cdn/a.png', email: 'ahmed@gmail.com' }, true)).toEqual({
                name: 'Ahmed',
                picture: 'https://cdn/a.png',
                email: 'ah***@gmail.com',
            });
            expect(toRememberedUser({ name: 'Ahmed', picture: 'javascript:alert(1)' }, true)).toEqual({ name: 'Ahmed' });
            expect(toRememberedUser({ picture: 'https://cdn/a.png' }, true)).toBeNull();
            expect(toRememberedUser({ email: 'ahmed@gmail.com' }, false)).toEqual({ email: 'ahmed@gmail.com' });
        });

        it('reads stored JSON safely', () => {
            expect(parseStoredJson<{ a: number }>('{"a":1}')).toEqual({ a: 1 });
            expect(parseStoredJson('not json')).toBeNull();
            expect(parseStoredJson('"string"')).toBeNull();
            expect(parseStoredJson(null)).toBeNull();
        });
    });

    it('normalizes the issuer', () => {
        expect(normalizeIssuer('https://api.posty5.com///')).toBe('https://api.posty5.com');
    });
});
