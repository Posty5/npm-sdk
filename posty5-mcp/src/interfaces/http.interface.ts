import type { IncomingMessage } from "node:http";
import type { IPosty5McpOptions } from "./options.interface";

/** A request the host will not serve: unknown token, revoked key, wrong origin… */
export interface IPosty5McpHttpRefusal {
  status: number;
  /** Shown to the user by most clients — say what to do, e.g. create a new MCP link. */
  message: string;
  headers?: Record<string, string>;
}

/** What the host decided for one HTTP request. */
export type Posty5McpHttpResolution = { options: IPosty5McpOptions } | { refusal: IPosty5McpHttpRefusal };

/** How a host serves MCP over HTTP (`createPosty5McpNodeHandler`). */
export interface IPosty5McpHttpOptions {
  /** Turns one request (its token, query, headers) into server options, or refuses it. Runs before the body is read by MCP. */
  resolve(req: IncomingMessage): Promise<Posty5McpHttpResolution> | Posty5McpHttpResolution;
  /**
   * Signs the 2025-era session ids that carry the client's identity between
   * stateless requests. Required — without it a legacy client's calls are
   * attributed to its User-Agent at best.
   */
  sessionSecret: string;
  /** Default `HTTP_MAX_REQUEST_BYTES`. */
  maxRequestBodySize?: number;
  /** Out-of-band errors (reporting only). Never given request bodies or tokens. */
  onerror?(error: Error): void;
}

/** The node-style handler `createPosty5McpNodeHandler` returns; Express's `next` as third argument is ignored. */
export type Posty5McpNodeHandler = (req: IncomingMessage, res: import("node:http").ServerResponse, parsedBody?: unknown) => Promise<void>;
