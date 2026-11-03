import type { IPosty5AuthErrorOptions, Posty5AuthErrorCode } from '../interfaces';

/**
 * Every failure of the package. `code` says what failed; `cancelled` means
 * the user pressed Cancel on Posty5 (`error=access_denied`). For provider
 * errors `providerError` holds the OAuth `error` value.
 */
export class Posty5AuthError extends Error {
    public readonly code: Posty5AuthErrorCode;
    public readonly providerError?: string;
    public readonly status?: number;

    constructor(code: Posty5AuthErrorCode, message: string, options: IPosty5AuthErrorOptions = {}) {
        super(message);
        this.name = 'Posty5AuthError';
        this.code = code;
        this.providerError = options.providerError;
        this.status = options.status;
    }
}
