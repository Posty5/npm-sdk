import type { HttpClient } from "@posty5/core";
import type { AccessLevel } from "../config/access.config";
import type { IIdempotencyStore, IPosty5McpHooks } from "./hooks.interface";
import type { IToolCallContext } from "./tool.interface";

/** What one server instance hands every call it runs. */
export interface IToolRunnerDeps {
  access: AccessLevel;
  connectionModel?: string;
  createHttpClient(call: IToolCallContext): HttpClient;
  hooks: IPosty5McpHooks;
  idempotencyStore: IIdempotencyStore;
}

/** The MCP client as the protocol named it, before normalisation. */
export interface IRawClientInfo {
  name?: unknown;
  version?: unknown;
}
