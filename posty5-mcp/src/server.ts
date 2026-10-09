import { CLIENT_INFO_META_KEY, McpServer, type ServerContext } from "@modelcontextprotocol/server";
import { CATALOGUE } from "./catalogue";
import { DEFAULT_ACCESS } from "./config/access.config";
import { PACKAGE_VERSION, SERVER_INSTRUCTIONS, SERVER_NAME, SERVER_TITLE } from "./config/instructions.config";
import { TOOLS_LIST_CACHE_TTL_MS } from "./config/limits.config";
import { createToolHttpClient } from "./core/http-client.factory";
import { MemoryIdempotencyStore } from "./core/memory-idempotency.store";
import { runTool } from "./core/tool-runner";
import { buildInputSchema, toAnnotations } from "./core/tool-schema.helper";
import { resolveToolsets, selectTools } from "./core/toolset-selection.helper";
import type { IPosty5McpOptions } from "./interfaces/options.interface";
import type { IRawClientInfo, IToolRunnerDeps } from "./interfaces/runner.interface";

/**
 * The MCP client making a request: on 2026-07-28 requests it travels in each
 * request's `_meta` envelope; on a 2025-era connection it was declared once at
 * `initialize`, which the SDK keeps on the instance (stdio) — or, served
 * statelessly over HTTP, which the HTTP layer hands over as `fallback`.
 */
function clientInfoOf(server: McpServer, ctx: ServerContext, fallback: IRawClientInfo | undefined): IRawClientInfo | undefined {
  const envelope = ctx.mcpReq.envelope as Record<string, unknown> | undefined;
  const fromEnvelope = envelope?.[CLIENT_INFO_META_KEY] as IRawClientInfo | undefined;
  return fromEnvelope ?? server.server.getClientVersion() ?? fallback;
}

/**
 * A Posty5 MCP server exposing the tools `options.toolsets` and
 * `options.access` allow. Stdio: pass `apiKey` (or set `POSTY5_API_KEY`).
 * Hosted: pass `connection`, `hooks` and a shared `idempotencyStore`.
 */
export function createPosty5McpServer(options: IPosty5McpOptions = {}): McpServer {
  const access = options.access ?? DEFAULT_ACCESS;
  const deps: IToolRunnerDeps = {
    access,
    connectionModel: options.connectionModel,
    createHttpClient: (call) => createToolHttpClient(options.connection ? options.connection(call) : { apiKey: options.apiKey, baseUrl: options.baseUrl }, call),
    hooks: options.hooks ?? {},
    idempotencyStore: options.idempotencyStore ?? new MemoryIdempotencyStore(),
  };

  const server = new McpServer(
    {
      name: options.serverInfo?.name ?? SERVER_NAME,
      title: options.serverInfo?.title ?? SERVER_TITLE,
      version: options.serverInfo?.version ?? PACKAGE_VERSION,
    },
    {
      instructions: SERVER_INSTRUCTIONS,
      cacheHints: { "tools/list": { ttlMs: TOOLS_LIST_CACHE_TTL_MS, cacheScope: "private" } },
    },
  );

  for (const tool of selectTools(CATALOGUE, resolveToolsets(options.toolsets), access)) {
    server.registerTool(
      tool.name,
      { title: tool.title, description: tool.description, inputSchema: buildInputSchema(tool), annotations: { title: tool.title, ...toAnnotations(tool) } },
      async (args: Record<string, unknown>, ctx: ServerContext) => runTool(tool, args, clientInfoOf(server, ctx, options.clientInfo), deps) as any,
    );
  }
  return server;
}
