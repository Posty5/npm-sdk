/**
 * Public configuration options for the Posty5 SDK
 * Only exposes essential options to end users
 */
export interface IPosty5Config {
    /** Base URL for the Posty5 API (default: https://api.posty5.com) */
    baseUrl?: string;
    /** API key for authentication */
    apiKey?: string;
    /** Enable debug logging */
    debug?: boolean;
}

/**
 * Internal HTTP client configuration
 * Includes all options including internal ones
 */
export interface IHttpClientConfig extends IPosty5Config {
    /** Request timeout in milliseconds (internal, fixed at 30000) */
    timeout?: number;
    /** Maximum number of retry attempts (internal, fixed at 3) */
    maxRetries?: number;
    /** Retry delay in milliseconds (internal, fixed at 1000) */
    retryDelay?: number;
    /** Custom headers to include in all requests (internal) */
    headers?: Record<string, string>;
}

/**
 * Request configuration for HTTP calls
 */
export interface IRequestConfig {
    /** Request headers */
    headers?: Record<string, string>;
    /** Query parameters */
    params?: Record<string, any>;
    /** Request timeout override */
    timeout?: number;
    /** Skip retry logic */
    skipRetry?: boolean;
}

/**
 * A file download — an endpoint that answers with the file itself rather than
 * with the `{ message, result }` JSON envelope.
 */
export interface IBinaryResponse {
    /** The file's bytes. */
    data: ArrayBuffer;
    /** Value of the response's `Content-Type` header. */
    contentType: string;
    /** Filename taken from the `Content-Disposition` header, when the server sent one. */
    fileName?: string;
}
