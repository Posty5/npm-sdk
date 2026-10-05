/** One request a client made through `stubHttp`. */
export interface IStubHttpCall {
  method: string;
  url: string;
  body?: unknown;
  params?: Record<string, unknown>;
}
