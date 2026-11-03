/** What can go wrong (see `Posty5AuthError.code`). */
export type Posty5AuthErrorCode =
    | 'config_invalid'
    | 'not_browser'
    | 'discovery_failed'
    | 'jwks_failed'
    | 'cancelled'
    | 'authorization_error'
    | 'state_mismatch'
    | 'sign_in_expired'
    | 'token_error'
    | 'id_token_invalid'
    | 'code_handler_failed';

export interface IPosty5AuthErrorOptions {
    /** The OAuth `error` value, e.g. `invalid_grant` or `access_denied`. */
    providerError?: string;
    /** HTTP status of the failed request. */
    status?: number;
}
