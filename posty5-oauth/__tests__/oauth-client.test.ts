import { createHash, createSign, generateKeyPairSync, KeyObject } from 'node:crypto';
import { Posty5OAuthClient, Posty5OAuthError } from '../src';

const ISSUER = 'https://issuer.test';
const CLIENT_ID = 'p5c_testclient';
const CLIENT_SECRET = 'p5cs_testsecret';
const REDIRECT = 'https://app.test/callback';

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = publicKey.export({ format: 'jwk' }) as any;
const KID = 'kid-1';

function sign(payload: Record<string, unknown>, key: KeyObject = privateKey, header: Record<string, unknown> = { alg: 'RS256', kid: KID, typ: 'JWT' }): string {
    const enc = (v: unknown) => Buffer.from(JSON.stringify(v)).toString('base64url');
    const input = `${enc(header)}.${enc(payload)}`;
    return `${input}.${createSign('RSA-SHA256').update(input).sign(key).toString('base64url')}`;
}

function claims(overrides: Record<string, unknown> = {}) {
    const now = Math.floor(Date.now() / 1000);
    return { iss: ISSUER, sub: 'pairwise-sub', aud: CLIENT_ID, iat: now, exp: now + 600, auth_time: now, nonce: 'n-1', email: 'a@b.test', email_verified: true, ...overrides };
}

const discovery = {
    issuer: ISSUER,
    authorization_endpoint: `${ISSUER}/oauth/authorize`,
    token_endpoint: `${ISSUER}/oauth/token`,
    userinfo_endpoint: `${ISSUER}/oauth/userinfo`,
    jwks_uri: `${ISSUER}/oauth/jwks`,
};

function json(body: unknown, status = 200) {
    return { ok: status >= 200 && status < 300, status, json: async () => body } as any;
}

function client(tokenBody: unknown = null, tokenStatus = 200, calls: any[] = []) {
    const fetchStub = (async (url: string, init: any = {}) => {
        calls.push({ url, init });
        if (url.endsWith('/.well-known/openid-configuration')) return json(discovery);
        if (url.endsWith('/oauth/jwks')) return json({ keys: [{ ...jwk, kid: KID, use: 'sig', alg: 'RS256' }] });
        if (url.endsWith('/oauth/token')) return json(tokenBody, tokenStatus);
        if (url.endsWith('/oauth/userinfo')) return json({ sub: 'pairwise-sub', name: 'A' });
        return json({}, 404);
    }) as any;
    return new Posty5OAuthClient({ clientId: CLIENT_ID, clientSecret: CLIENT_SECRET, redirectUri: REDIRECT, issuer: ISSUER, fetch: fetchStub });
}

describe('Posty5OAuthClient', () => {
    it('creates an S256 PKCE pair', () => {
        const { codeVerifier, codeChallenge } = client().createPkce();
        expect(codeVerifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
        expect(codeChallenge).toBe(createHash('sha256').update(codeVerifier).digest('base64url'));
    });

    it('builds the authorization URL from discovery', async () => {
        const url = new URL(await client().buildAuthorizationUrl({ state: 's', nonce: 'n', codeChallenge: 'c'.repeat(43), prompt: 'login', maxAge: 0 }));
        expect(url.origin + url.pathname).toBe(discovery.authorization_endpoint);
        expect(url.searchParams.get('response_type')).toBe('code');
        expect(url.searchParams.get('client_id')).toBe(CLIENT_ID);
        expect(url.searchParams.get('redirect_uri')).toBe(REDIRECT);
        expect(url.searchParams.get('scope')).toBe('openid profile email');
        expect(url.searchParams.get('code_challenge_method')).toBe('S256');
        expect(url.searchParams.get('prompt')).toBe('login');
        expect(url.searchParams.get('max_age')).toBe('0');
    });

    it('refuses a discovery document of another issuer', async () => {
        const c = new Posty5OAuthClient({ clientId: CLIENT_ID, clientSecret: CLIENT_SECRET, redirectUri: REDIRECT, issuer: ISSUER, fetch: (async () => json({ ...discovery, issuer: 'https://evil.test' })) as any });
        await expect(c.discover()).rejects.toMatchObject({ code: 'discovery_failed' });
    });

    it('reads the callback: state checked, provider errors raised', () => {
        const c = client();
        expect(c.readCallback({ code: 'abc', state: 'st' }, 'st')).toBe('abc');
        expect(() => c.readCallback({ code: 'abc', state: 'other' }, 'st')).toThrow(Posty5OAuthError);
        expect(() => c.readCallback({ error: 'access_denied', state: 'st' }, 'st')).toThrow(expect.objectContaining({ code: 'authorization_error', providerError: 'access_denied' }));
    });

    it('exchanges the code with client_secret_basic and verifies the ID token', async () => {
        const calls: any[] = [];
        const c = client({ access_token: 'at', id_token: sign(claims()), token_type: 'Bearer', expires_in: 3600, scope: 'openid email' }, 200, calls);
        const result = await c.exchangeCode({ code: 'code-1', codeVerifier: 'v'.repeat(43), nonce: 'n-1' });
        expect(result.claims.sub).toBe('pairwise-sub');
        expect(result.accessToken).toBe('at');
        const tokenCall = calls.find((call) => call.url.endsWith('/oauth/token'));
        expect(tokenCall.init.headers.authorization).toBe(`Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`);
        const body = new URLSearchParams(tokenCall.init.body);
        expect(body.get('grant_type')).toBe('authorization_code');
        expect(body.get('redirect_uri')).toBe(REDIRECT);
        expect(body.get('code_verifier')).toBe('v'.repeat(43));
    });

    it('surfaces token errors with the provider code', async () => {
        const c = client({ error: 'invalid_grant', error_description: 'used' }, 400);
        await expect(c.exchangeCode({ code: 'x', codeVerifier: 'v'.repeat(43), nonce: 'n-1' })).rejects.toMatchObject({ code: 'token_error', providerError: 'invalid_grant', status: 400 });
    });

    it.each([
        ['wrong nonce', claims({ nonce: 'other' })],
        ['wrong audience', claims({ aud: 'p5c_other' })],
        ['wrong issuer', claims({ iss: 'https://evil.test' })],
        ['expired', claims({ exp: Math.floor(Date.now() / 1000) - 3600 })],
    ])('rejects an ID token with %s', async (_label, payload) => {
        await expect(client().verifyIdToken(sign(payload), { nonce: 'n-1' })).rejects.toMatchObject({ code: 'id_token_invalid' });
    });

    it('rejects a token signed by another key or with alg none', async () => {
        const other = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey;
        await expect(client().verifyIdToken(sign(claims(), other))).rejects.toMatchObject({ code: 'id_token_invalid' });
        const none = `${Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url')}.${Buffer.from(JSON.stringify(claims())).toString('base64url')}.`;
        await expect(client().verifyIdToken(none)).rejects.toMatchObject({ code: 'id_token_invalid' });
    });

    it('enforces maxAgeSeconds on auth_time', async () => {
        const old = claims({ auth_time: Math.floor(Date.now() / 1000) - 3600 });
        await expect(client().verifyIdToken(sign(old), { maxAgeSeconds: 120 })).rejects.toMatchObject({ code: 'id_token_invalid' });
        await expect(client().verifyIdToken(sign(claims()), { maxAgeSeconds: 120 })).resolves.toMatchObject({ sub: 'pairwise-sub' });
    });

    it('reads userinfo with the bearer token', async () => {
        await expect(client().getUserInfo('at')).resolves.toMatchObject({ sub: 'pairwise-sub' });
    });
});

describe('createLoginLink / handleLoginCallback (sealed state)', () => {
    it('round-trips returnTo and data, bound to the browser', async () => {
        const c = client({ access_token: 'at', id_token: '', token_type: 'Bearer', expires_in: 3600 });
        const link = await c.createLoginLink({ returnTo: '/after', data: { a: 1 } });
        const url = new URL(link.url);
        const state = url.searchParams.get('state')!;
        expect(state.length).toBeLessThanOrEqual(512);
        expect(state).not.toContain('/after');
        // A token whose nonce is the one sealed in the link.
        const nonce = url.searchParams.get('nonce')!;
        const c2 = client({ access_token: 'at', id_token: sign(claims({ nonce })), token_type: 'Bearer', expires_in: 3600 });
        const result = await c2.handleLoginCallback({ code: 'c', state }, { binding: link.binding });
        expect(result).toMatchObject({ returnTo: '/after', data: { a: 1 } });
        expect(result.claims.sub).toBe('pairwise-sub');
    });

    it('refuses another browser, a tampered state and a cancelled sign-in', async () => {
        const c = client();
        const link = await c.createLoginLink();
        const state = new URL(link.url).searchParams.get('state')!;
        await expect(c.handleLoginCallback({ code: 'c', state }, { binding: 'other' })).rejects.toMatchObject({ code: 'state_mismatch' });
        await expect(c.handleLoginCallback({ code: 'c', state: state.slice(0, -2) + 'AA' }, { binding: link.binding })).rejects.toMatchObject({ code: 'state_mismatch' });
        await expect(c.handleLoginCallback({ error: 'access_denied', state }, { binding: link.binding })).rejects.toMatchObject({ code: 'authorization_error', providerError: 'access_denied' });
    });
});

describe('Posty5AppUsersClient', () => {
    it('lists and gets users with the API key', async () => {
        const { Posty5AppUsersClient } = require('../src');
        const calls: any[] = [];
        const fetchStub = (async (url: string, init: any) => {
            calls.push({ url, init });
            if (url.includes('/api/oauth-users/missing')) return json({ message: 'User not found' }, 404);
            if (url.includes('/api/oauth-users/')) return json({ result: { sub: 's1', scopes: ['openid'] } });
            return json({ result: { items: [{ sub: 's1', scopes: ['openid'] }], pagination: { nextCursor: 'n', previousCursor: null, hasMore: true, totalCount: 2, pageSize: 1 } } });
        }) as any;
        const users = new Posty5AppUsersClient({ apiKey: 'k', baseUrl: 'https://api.test', fetch: fetchStub });
        const page = await users.list({ search: 'a', pageSize: 1 });
        expect(page).toMatchObject({ nextCursor: 'n', hasMore: true, totalCount: 2 });
        expect(calls[0].url).toBe('https://api.test/api/oauth-users?search=a&pageSize=1');
        expect(calls[0].init.headers['x-api-key']).toBe('k');
        await expect(users.get('s1')).resolves.toMatchObject({ sub: 's1' });
        await expect(users.get('missing')).resolves.toBeNull();
    });

    it('sends clientId as a query parameter on list and get when set (trimmed)', async () => {
        const { Posty5AppUsersClient } = require('../src');
        const calls: any[] = [];
        const fetchStub = (async (url: string, init: any) => {
            calls.push({ url, init });
            if (url.includes('/api/oauth-users/')) return json({ result: { sub: 's1', scopes: ['openid'] } });
            return json({ result: { items: [], pagination: {} } });
        }) as any;
        const users = new Posty5AppUsersClient({ apiKey: 'k', clientId: '  p5c_abc  ', baseUrl: 'https://api.test', fetch: fetchStub });
        await users.list({ search: 'a' });
        await users.get('s1');
        expect(calls[0].url).toBe('https://api.test/api/oauth-users?search=a&clientId=p5c_abc');
        expect(calls[1].url).toBe('https://api.test/api/oauth-users/s1?clientId=p5c_abc');
    });

    it('omits clientId when not set or blank (1.1.0 behaviour)', async () => {
        const { Posty5AppUsersClient } = require('../src');
        const calls: any[] = [];
        const fetchStub = (async (url: string) => {
            calls.push(url);
            if (url.includes('/api/oauth-users/')) return json({ result: { sub: 's1' } });
            return json({ result: { items: [], pagination: {} } });
        }) as any;
        for (const clientId of [undefined, '', '   ']) {
            const users = new Posty5AppUsersClient({ apiKey: 'k', clientId, baseUrl: 'https://api.test', fetch: fetchStub });
            await users.list();
            await users.get('s1');
        }
        expect(calls.every((url) => !url.includes('clientId'))).toBe(true);
        expect(calls[0]).toBe('https://api.test/api/oauth-users');
        expect(calls[1]).toBe('https://api.test/api/oauth-users/s1');
    });

    it('rejects a non-string clientId', () => {
        const { Posty5AppUsersClient } = require('../src');
        let error: any;
        try {
            new Posty5AppUsersClient({ apiKey: 'k', clientId: 42 as any, fetch: (async () => json({})) as any });
        } catch (e) {
            error = e;
        }
        expect(error).toMatchObject({ code: 'config_invalid' });
    });

    it('surfaces the 400 (clientId required) and 403 (no access) as api_error with status', async () => {
        const { Posty5AppUsersClient } = require('../src');
        const many = new Posty5AppUsersClient({
            apiKey: 'k',
            baseUrl: 'https://api.test',
            fetch: (async () => json({ message: "This API key can read more than one OAuth app: send the app's clientId as a query parameter" }, 400)) as any,
        });
        await expect(many.list()).rejects.toMatchObject({ code: 'api_error', status: 400, message: expect.stringContaining('clientId') });
        const denied = new Posty5AppUsersClient({
            apiKey: 'k',
            clientId: 'p5c_other',
            baseUrl: 'https://api.test',
            fetch: (async () => json({ message: 'This API key has no access to that OAuth app' }, 403)) as any,
        });
        await expect(denied.get('s1')).rejects.toMatchObject({ code: 'api_error', status: 403 });
    });
});
