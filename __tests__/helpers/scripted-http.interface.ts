/** One request a client made through `scriptedHttp`. */
export interface IScriptedHttpCall {
  method: string;
  url: string;
  body?: unknown;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  /** `IRequestConfig.version` of a versioned write (sent as `If-Match`). */
  version?: number;
}
