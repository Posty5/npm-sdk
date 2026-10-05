import * as http from "http";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { createPosty5McpNodeHandler } from "../../posty5-mcp/src/http/node-handler";
import { decodeLegacySession, encodeLegacySession } from "../../posty5-mcp/src/http/legacy-session.helper";
import { identityFromUserAgent } from "../../posty5-mcp/src/http/user-agent.helper";

/**
 * The HTTP face the hosted service mounts (`createPosty5McpNodeHandler`),
 * driven by the official MCP client in both protocol eras against a local
 * fake API. The legacy era is stateless: the client's identity must survive
 * from `initialize` to a later `tools/call` through the signed session id.
 */

type Captured = { method?: string; url?: string; headers: http.IncomingHttpHeaders; body: string };

const SECRET = "test-session-secret";

function listen(server: http.Server): Promise<string> {
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(`http://127.0.0.1:${(server.address() as { port: number }).port}`)));
}

function agentOf(request: Captured | undefined) {
  return request ? JSON.parse(Buffer.from(String(request.headers["x-posty5-agent"]), "base64url").toString("utf8")) : undefined;
}

describe("@posty5/mcp — HTTP handler", () => {
  const apiRequests: Captured[] = [];
  const sessionIds: (string | undefined)[] = [];
  let api: http.Server;
  let mcp: http.Server;
  let mcpUrl: URL;

  beforeAll(async () => {
    api = http.createServer((req, res) => {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        apiRequests.push({ method: req.method, url: req.url, headers: req.headers, body });
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "", result: { _id: "l1", shorterLink: "https://pst5.co/x", baseUrl: "https://example.com" } }));
      });
    });
    const apiUrl = await listen(api);

    const handler = createPosty5McpNodeHandler({
      sessionSecret: SECRET,
      resolve: (req) => {
        sessionIds.push(req.headers["mcp-session-id"] as string | undefined);
        const token = String(req.headers.authorization || "").replace(/^Bearer /, "");
        if (token !== "read-token" && token !== "write-token") {
          return { refusal: { status: 401, message: "Create a new MCP link in Posty5.", headers: { "WWW-Authenticate": "Bearer" } } };
        }
        return {
          options: {
            access: token === "read-token" ? "read" : "write",
            toolsets: ["short-links"],
            connection: () => ({ apiKey: "owner-key", baseUrl: apiUrl, headers: { "X-Posty5-Client": "mcp-hosted/test" } }),
          },
        };
      },
    });
    mcp = http.createServer((req, res) => void handler(req, res));
    mcpUrl = new URL(`${await listen(mcp)}/mcp`);
  });

  afterAll(() => {
    mcp?.close();
    api?.close();
  });

  async function connect(token: string, name: string, modern: boolean) {
    const client = new Client({ name, version: "1.2.3" }, modern ? { versionNegotiation: { mode: { pin: "2026-07-28" } } } : {});
    await client.connect(new StreamableHTTPClientTransport(mcpUrl, { requestInit: { headers: { Authorization: `Bearer ${token}` } } }));
    return client;
  }

  it("serves a 2025-era client statelessly and still attributes its tool call to it", async () => {
    sessionIds.length = 0;
    apiRequests.length = 0;
    const client = await connect("write-token", "legacy-client", false);
    const tools = (await client.listTools()).tools.map((tool) => tool.name);
    expect(tools).toEqual(["account_get_current", "account_get_credits", "account_get_credit_usage", "account_get_operation_costs", "short_link_list", "short_link_get", "short_link_create", "short_link_update"]);

    const result = await client.callTool({ name: "short_link_create", arguments: { baseUrl: "https://example.com", templateId: "t1", aiModel: "claude-opus-5-5" } });
    expect(result.isError).toBeFalsy();
    const post = apiRequests.find((request) => request.method === "POST");
    expect(post?.headers["x-posty5-client"]).toBe("mcp-hosted/test");
    expect(agentOf(post)).toMatchObject({ client: { name: "legacy-client", version: "1.2.3" }, model: "claude-opus-5-5", tool: "short_link_create" });
    // The session id issued at initialize came back on the later requests.
    expect(sessionIds.filter(Boolean).length).toBeGreaterThan(0);
    await client.close();
  });

  it("serves a 2026-07-28 client and reads its identity from the request envelope", async () => {
    apiRequests.length = 0;
    const client = await connect("write-token", "modern-client", true);
    await client.callTool({ name: "short_link_create", arguments: { baseUrl: "https://example.com", templateId: "t1", aiModel: "gpt-5" } });
    expect(agentOf(apiRequests.find((request) => request.method === "POST"))).toMatchObject({ client: { name: "modern-client" }, model: "gpt-5" });
    await client.close();
  });

  it("lists only what the token's access level allows", async () => {
    const client = await connect("read-token", "reader", true);
    const tools = (await client.listTools()).tools.map((tool) => tool.name);
    expect(tools).not.toContain("short_link_create");
    await expect(client.callTool({ name: "short_link_create", arguments: { baseUrl: "https://example.com", templateId: "t1", aiModel: "m" } })).rejects.toThrow();
    await client.close();
  });

  it("refuses an unknown token with 401, WWW-Authenticate and a JSON-RPC error", async () => {
    const response = await fetch(mcpUrl, {
      method: "POST",
      headers: { Authorization: "Bearer nope", "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
    });
    expect(response.status).toBe(401);
    expect(response.headers.get("www-authenticate")).toBe("Bearer");
    expect(await response.json()).toMatchObject({ jsonrpc: "2.0", error: { message: "Create a new MCP link in Posty5." }, id: null });
  });

  it("refuses a body over the cap before reading it", async () => {
    const response = await fetch(mcpUrl, {
      method: "POST",
      headers: { Authorization: "Bearer write-token", "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: { padding: "x".repeat(3 * 1024 * 1024) } }),
    });
    expect(response.status).toBe(413);
  });
});

describe("@posty5/mcp — legacy session ids and User-Agents", () => {
  it("round-trips an identity and refuses a forged or foreign one", () => {
    const id = encodeLegacySession({ name: "claude-code", version: "2.1.0" }, SECRET);
    expect(id).toMatch(/^p5s1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    expect(decodeLegacySession(id, SECRET)).toEqual({ name: "claude-code", version: "2.1.0" });
    expect(decodeLegacySession(id, "another-secret")).toBeUndefined();
    const [version, , mac] = id.split(".");
    const forgedPayload = Buffer.from(JSON.stringify({ n: "forged" })).toString("base64url");
    expect(decodeLegacySession(`${version}.${forgedPayload}.${mac}`, SECRET)).toBeUndefined();
    expect(decodeLegacySession("x".repeat(600), SECRET)).toBeUndefined();
  });

  it("names a client from its User-Agent, but not a generic HTTP library", () => {
    expect(identityFromUserAgent("claude-code/2.1.0 (darwin)")).toEqual({ name: "claude-code", version: "2.1.0" });
    expect(identityFromUserAgent("node")).toBeUndefined();
    expect(identityFromUserAgent("undici/6.0")).toBeUndefined();
    expect(identityFromUserAgent(undefined)).toBeUndefined();
  });
});
