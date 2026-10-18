import type { Posty5OAuthErrorCode } from './interfaces';

/**
 * Every failure of the helper. `code` says what failed; for provider errors
 * (`token_error`, `authorization_error`) `providerError` holds the OAuth
 * `error` value, e.g. `invalid_grant` or `access_denied`.
 */
export class Posty5OAuthError extends Error {
    public readonly code: Posty5OAuthErrorCode;
    public readonly providerError?: string;
    public readonly status?: number;

    constructor(code: Posty5OAuthErrorCode, message: string, options: { providerError?: string; status?: number } = {}) {
        super(message);
        this.name = 'Posty5OAuthError';
        this.code = code;
        this.providerError = options.providerError;
        this.status = options.status;
    }
}
