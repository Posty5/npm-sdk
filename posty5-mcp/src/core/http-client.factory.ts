import { HttpClient } from "@posty5/core";
import { AGENT_ORIGIN_HEADER, CLIENT_HEADER, MCP_CREATED_FROM, STDIO_CLIENT_ID } from "../config/agent-identity.config";
import type { IPosty5McpConnection } from "../interfaces/connection.interface";
import type { IToolCallContext } from "../interfaces/tool.interface";
import { encodeAgentHeader } from "./agent-origin.helper";

/**
 * The SDK client one call runs on. Every call names itself (`X-Posty5-Client`)
 * and its agent (`X-Posty5-Agent`, unsigned — the API records it as
 * "declared"); a host's headers come last, so the hosted server's signed pair
 * replaces the unsigned one.
 */
export function createToolHttpClient(connection: Partial<IPosty5McpConnection>, call: IToolCallContext): HttpClient {
  return new HttpClient({
    ...(connection.apiKey ? { apiKey: connection.apiKey } : {}),
    ...(connection.baseUrl ? { baseUrl: connection.baseUrl } : {}),
    ...(connection.timeout !== undefined ? { timeout: connection.timeout } : {}),
    ...(connection.maxRetries !== undefined ? { maxRetries: connection.maxRetries } : {}),
    createdFrom: MCP_CREATED_FROM,
    headers: mergeHeaders({ [CLIENT_HEADER]: STDIO_CLIENT_ID, [AGENT_ORIGIN_HEADER]: encodeAgentHeader(call) }, connection.headers),
  });
}

/** `overrides` replace `defaults` whatever their letter case — one header, never two spellings of it. */
function mergeHeaders(defaults: Record<string, string>, overrides: Record<string, string> = {}): Record<string, string> {
  const overridden = new Set(Object.keys(overrides).map((name) => name.toLowerCase()));
  const kept = Object.entries(defaults).filter(([name]) => !overridden.has(name.toLowerCase()));
  return { ...Object.fromEntries(kept), ...overrides };
}
