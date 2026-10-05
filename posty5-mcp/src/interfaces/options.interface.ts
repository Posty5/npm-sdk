import type { AccessLevel } from "../config/access.config";
import type { ToolsetName } from "../config/toolsets.config";
import type { IPosty5McpConnection } from "./connection.interface";
import type { IIdempotencyStore, IPosty5McpHooks } from "./hooks.interface";
import type { IToolCallContext } from "./tool.interface";

/** How to build a Posty5 MCP server (`createPosty5McpServer`). */
export interface IPosty5McpOptions {
  /** What the connection may do. Default `write`. */
  access?: AccessLevel;
  /** Which tool groups to expose (`ToolsetName`s; unknown names are ignored). Default: the five defaults; `account` is always added. */
  toolsets?: readonly (ToolsetName | (string & {}))[];
  /** A model id declared on the connection (`?model=`, `POSTY5_AI_MODEL`); a tool's `aiModel` argument wins over it. */
  connectionModel?: string;
  /**
   * The MCP client when the protocol does not name it on this request — a
   * 2025-era client's identity carried by the HTTP layer between stateless
   * requests, or its User-Agent. The protocol's own value wins when present.
   */
  clientInfo?: { name: string; version?: string };
  /** Stdio path: the API key every call uses. Ignored when `connection` is given. */
  apiKey?: string;
  /** Stdio path: the API base URL. */
  baseUrl?: string;
  /** Hosted path: how this call reaches the API — the owner's key, the internal gateway, the signed agent headers. */
  connection?(call: IToolCallContext): IPosty5McpConnection;
  hooks?: IPosty5McpHooks;
  /** Where write results are remembered by idempotency key. Default: in-process. */
  idempotencyStore?: IIdempotencyStore;
  /** Overrides of the server's MCP identity. */
  serverInfo?: { name?: string; title?: string; version?: string };
}
