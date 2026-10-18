/** Defaults and fixed values of Login with Posty5 in the browser. */
export const Posty5AuthDefaults = {
    /** Production issuer. The test tier is `https://test-api.posty5.com`. */
    issuer: 'https://api.posty5.com',
    discoveryPath: '/.well-known/openid-configuration',
    scope: 'openid profile email',
    requiredScope: 'openid',
    returnUrlParam: 'returnUrl',
    rememberUser: true,
    maskRememberedEmail: true,
    /** The only signing algorithm Posty5 uses (and the only one accepted). */
    signingAlg: 'RS256',
    codeChallengeMethod: 'S256',
    responseType: 'code',
    grantType: 'authorization_code',
    /** WebCrypto parameters for RS256. */
    webCryptoAlgorithm: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    digestAlgorithm: 'SHA-256',
    /** Random bytes behind state, nonce and the PKCE verifier (43 base64url characters). */
    randomBytes: 32,
    /** Clock skew tolerated on `exp` / `iat` / `auth_time` (seconds). */
    clockToleranceSeconds: 60,
    /** Discovery and JWKS are cached this long (ms). */
    metadataCacheMs: 60 * 60 * 1000,
    /** An unknown `kid` refetches the JWKS at most this often (ms). */
    jwksRefetchMinIntervalMs: 60 * 1000,
    /** A pending sign-in (state, nonce, verifier) older than this is refused (ms). */
    pendingSignInTtlMs: 10 * 60 * 1000,
    /** Network requests (discovery, JWKS, token, code handler) give up after this long (ms). */
    requestTimeoutMs: 15_000,
    /** Milliseconds per second (epoch conversions). */
    msPerSecond: 1000,
    /** `access_denied` is what Posty5 answers when the user presses Cancel. */
    cancelledError: 'access_denied',
} as const;

/** Browser storage keys used by the package. */
export const Posty5StorageKeys = {
    /** `sessionStorage`: the one pending sign-in of this tab. */
    pendingSignIn: 'posty5.oauth.pending',
    /** `localStorage`: the remembered user of the "Continue as ..." button. */
    rememberedUser: 'posty5.oauth.user',
} as const;

/** OAuth parameters read from (and removed from) the callback URL. */
export const Posty5CallbackParams = {
    code: 'code',
    state: 'state',
    error: 'error',
    errorDescription: 'error_description',
    iss: 'iss',
    sessionState: 'session_state',
} as const;

/** Masking of the remembered e-mail (`ahmed@x.com` becomes `ah***@x.com`). */
export const Posty5EmailMask = {
    visibleChars: 2,
    mask: '***',
} as const;
