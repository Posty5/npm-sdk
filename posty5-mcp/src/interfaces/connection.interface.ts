/**
 * How one tool call reaches the Posty5 API — what a host (the hosted MCP
 * server) hands the package per call. The package builds the SDK client from
 * it, so a host never imports `@posty5/core` itself (inside the api monorepo
 * that name belongs to another package).
 */
export interface IPosty5McpConnection {
  /** The API key the call acts with. */
  apiKey: string;
  /** API base URL; the hosted server points it at the internal gateway. */
  baseUrl?: string;
  /**
   * Extra headers, sent after the package's own: a host passes its
   * `X-Posty5-Client`, the `X-Posty5-Agent` value it signed and the signature.
   */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds. */
  timeout?: number;
  /** Retries after a retryable failure; writes are never retried once answered. */
  maxRetries?: number;
}
