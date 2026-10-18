/** Defaults of the Login with Posty5 helper. */
export const Posty5OAuthConfig = {
    /** Production issuer. The test tier is `https://test-api.posty5.com`. */
    defaultIssuer: 'https://api.posty5.com',
    discoveryPath: '/.well-known/openid-configuration',
    defaultScope: 'openid profile email',
    /** Discovery and JWKS are cached this long (ms). */
    metadataCacheMs: 60 * 60 * 1000,
    /** An unknown `kid` refetches the JWKS at most this often (ms). */
    jwksRefetchMinIntervalMs: 60 * 1000,
    /** Clock skew tolerated on `exp` / `iat` / `auth_time` (seconds). */
    clockToleranceSeconds: 60,
    /** The only signing algorithm Posty5 uses (and the only one accepted). */
    signingAlg: 'RS256',
    /** Random bytes behind state, nonce and the PKCE verifier. */
    randomBytes: 32,
    requestTimeoutMs: 10_000,
    /** `createLoginLink` sealed states (AES-256-GCM, key = HKDF-SHA256 of the client secret). */
    loginLink: {
        version: 1,
        hkdfSalt: 'posty5-oauth-login-link',
        hkdfInfo: 'state-v1',
        ivBytes: 12,
        tagBytes: 16,
        defaultTtlSeconds: 10 * 60,
        maxTtlSeconds: 60 * 60,
        /** Posty5 accepts a `state` of at most 512 characters. */
        maxStateLength: 512,
    },
    /** `Posty5AppUsersClient`: the Posty5 API base and its users route. */
    apiBaseUrl: 'https://api.posty5.com',
    appUsersPath: '/api/oauth-users',
} as const;
