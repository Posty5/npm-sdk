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
    /**
     * Extra headers sent with every request. `X-Posty5-Client` may be
     * overridden here (an integration naming itself); `X-API-Key` may not —
     * `apiKey` always wins.
     */
    headers?: Record<string, string>;
    /**
     * The `createdFrom` label stamped on records this client creates (default
     * `"npmPackage"`). A free label the API stores for your own filtering;
     * store manual orders accept only the values the API lists and fall back
     * to the default otherwise.
     */
    createdFrom?: string;
    /** Retries after a retryable failure (default 3; `0` disables). POST and PATCH are never retried once the server has answered; a versioned write (`If-Match`) is never retried at all. */
    maxRetries?: number;
    /** Request timeout in milliseconds (default 30000). */
    timeout?: number;
}

/**
 * Internal HTTP client configuration
 * Includes all options including internal ones
 */
export interface IHttpClientConfig extends IPosty5Config {
    /** Retry delay in milliseconds (internal, fixed at 1000) */
    retryDelay?: number;
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
    /**
     * The document's version (`__v`) for a versioned write. Sent as
     * `If-Match: "<version>"`; such a request is never retried. Must be a
     * non-negative integer.
     */
    version?: number;
    /** Request body for a DELETE that takes one (bulk deletes). */
    data?: any;
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
