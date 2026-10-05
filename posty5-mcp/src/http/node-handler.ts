/**
 * MCP over Streamable HTTP for a Node host (Express, plain `node:http`): one
 * handler for the 2026-07-28 era and, statelessly, the 2025 era. Each request
 * gets a server built from the options the host resolved for it, so what one
 * token may see never leaks into another's request.
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import { createMcpHandler } from "@modelcontextprotocol/server";
import { toNodeHandler } from "@modelcontextprotocol/node";
import { HTTP_MAX_REQUEST_BYTES, HTTP_REFUSAL_RPC_CODE, LEGACY_SESSION_HEADER, RESOLVED_OPTIONS_KEY } from "../config/http.config";
import type { IPosty5McpHttpOptions, IPosty5McpHttpRefusal, Posty5McpNodeHandler } from "../interfaces/http.interface";
import type { IPosty5McpOptions } from "../interfaces/options.interface";
import { createPosty5McpServer } from "../server";
import { decodeLegacySession, encodeLegacySession, identityFromClientInfo, type ILegacyClientIdentity } from "./legacy-session.helper";
import { identityFromUserAgent } from "./user-agent.helper";

function writeRefusal(res: ServerResponse, refusal: IPosty5McpHttpRefusal): void {
  const body = JSON.stringify({ jsonrpc: "2.0", error: { code: HTTP_REFUSAL_RPC_CODE, message: refusal.message }, id: null });
  res.writeHead(refusal.status, { "Content-Type": "application/json", ...refusal.headers });
  res.end(body);
}

/** The request body as JSON, read here only when the host did not parse it; `undefined` when absent or not JSON. */
async function readJsonBody(req: IncomingMessage, maxBytes: number): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > maxBytes) throw Object.assign(new Error("body too large"), { tooLarge: true });
    chunks.push(chunk as Buffer);
  }
  if (!size) return undefined;
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return undefined;
  }
}

/** The `clientInfo` of an `initialize` request in the body (a 2025 batch included). */
function initializeClientInfo(body: unknown): unknown {
  const messages = Array.isArray(body) ? body : [body];
  const initialize = messages.find((message: any) => message && typeof message === "object" && message.method === "initialize");
  return (initialize as any)?.params?.clientInfo;
}

export function createPosty5McpNodeHandler(http: IPosty5McpHttpOptions): Posty5McpNodeHandler {
  if (!http.sessionSecret) throw new Error("createPosty5McpNodeHandler: sessionSecret is required");
  const maxBytes = http.maxRequestBodySize ?? HTTP_MAX_REQUEST_BYTES;

  const mcp = createMcpHandler(
    (ctx) => {
      const options = ctx.authInfo?.extra?.[RESOLVED_OPTIONS_KEY] as IPosty5McpOptions | undefined;
      // Unreachable through this handler — every request is resolved first. Refuse rather than serve defaults.
      if (!options) throw new Error("posty5-mcp: request reached the MCP server unresolved");
      return createPosty5McpServer(options);
    },
    { legacy: "stateless", onerror: http.onerror },
  );
  const node = toNodeHandler(mcp, { maxRequestBodySize: maxBytes, onerror: http.onerror });

  return async (req, res, parsedBody) => {
    const declaredLength = Number(req.headers["content-length"] || 0);
    if (declaredLength > maxBytes) return writeRefusal(res, { status: 413, message: "The request is too large." });

    const resolution = await http.resolve(req);
    if ("refusal" in resolution) return writeRefusal(res, resolution.refusal);

    let body = typeof parsedBody === "function" ? undefined : parsedBody;
    if (body === undefined && req.method === "POST") {
      try {
        body = await readJsonBody(req, maxBytes);
      } catch (error: any) {
        return writeRefusal(res, error?.tooLarge ? { status: 413, message: "The request is too large." } : { status: 400, message: "The request body could not be read." });
      }
    }

    // A 2025-era client names itself once, at initialize: hand that back to it as the session id it will echo.
    const declared = identityFromClientInfo(initializeClientInfo(body));
    if (declared) res.setHeader(LEGACY_SESSION_HEADER, encodeLegacySession(declared, http.sessionSecret));
    const identity: ILegacyClientIdentity | undefined =
      declared ?? decodeLegacySession(req.headers[LEGACY_SESSION_HEADER], http.sessionSecret) ?? identityFromUserAgent(req.headers["user-agent"]);

    const options: IPosty5McpOptions = { ...resolution.options, clientInfo: resolution.options.clientInfo ?? identity };
    (req as any).auth = { token: "posty5-mcp", clientId: "posty5-mcp", scopes: [], extra: { [RESOLVED_OPTIONS_KEY]: options } };
    await node(req, res, body);
  };
}
