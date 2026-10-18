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
} as const;
