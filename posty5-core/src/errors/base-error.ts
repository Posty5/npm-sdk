/**
 * Base error class for all Posty5 SDK errors
 */
export class Posty5Error extends Error {
    public readonly code?: string;
    public readonly statusCode?: number;
    public readonly details?: any;

    constructor(message: string, code?: string, statusCode?: number, details?: any) {
        super(message);
        this.name = 'Posty5Error';
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

/**
 * Authentication error (401)
 */
export class AuthenticationError extends Posty5Error {
    constructor(message: string = 'Authentication failed', details?: any) {
        super(message, 'AUTHENTICATION_ERROR', 401, details);
        this.name = 'AuthenticationError';
    }
}

/**
 * Authorization error (403)
 */
export class AuthorizationError extends Posty5Error {
    constructor(message: string = 'Access denied', details?: any) {
        super(message, 'AUTHORIZATION_ERROR', 403, details);
        this.name = 'AuthorizationError';
    }
}

/**
 * Validation error (400)
 */
export class ValidationError extends Posty5Error {
    public readonly errors?: Array<{ field: string; message: string }>;

    constructor(
        message: string = 'Validation failed',
        errors?: Array<{ field: string; message: string }>,
        details?: any
    ) {
        super(message, 'VALIDATION_ERROR', 400, details);
        this.name = 'ValidationError';
        this.errors = errors;
    }
}

/**
 * Resource not found error (404)
 */
export class NotFoundError extends Posty5Error {
    constructor(message: string = 'Resource not found', details?: any) {
        super(message, 'NOT_FOUND', 404, details);
        this.name = 'NotFoundError';
    }
}

/**
 * Rate limit error (429)
 */
export class RateLimitError extends Posty5Error {
    public readonly retryAfter?: number;

    constructor(message: string = 'Rate limit exceeded', retryAfter?: number, details?: any) {
        super(message, 'RATE_LIMIT_ERROR', 429, details);
        this.name = 'RateLimitError';
        this.retryAfter = retryAfter;
    }
}

/**
 * Network error (connection issues, timeouts, etc.)
 */
export class NetworkError extends Posty5Error {
    constructor(message: string = 'Network error occurred', details?: any) {
        super(message, 'NETWORK_ERROR', undefined, details);
        this.name = 'NetworkError';
    }
}

/**
 * Server error (5xx)
 */
export class ServerError extends Posty5Error {
    constructor(message: string = 'Server error occurred', statusCode: number = 500, details?: any) {
        super(message, 'SERVER_ERROR', statusCode, details);
        this.name = 'ServerError';
    }
}
