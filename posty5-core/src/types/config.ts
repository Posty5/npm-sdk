/**
 * Configuration options for the Posty5 HTTP client
 */
export interface IPosty5Config {
    /** Base URL for the Posty5 API */
    baseUrl: string;
    /** API key for authentication */
    apiKey?: string;
    /** Request timeout in milliseconds (default: 30000) */
    timeout?: number;
    /** Maximum number of retry attempts (default: 3) */
    maxRetries?: number;
    /** Retry delay in milliseconds (default: 1000) */
    retryDelay?: number;
}

/**
 * HTTP client configuration
 */
export interface IHttpClientConfig extends IPosty5Config {
    /** Custom headers to include in all requests */
    headers?: Record<string, string>;
    /** Enable debug logging */
    debug?: boolean;
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
