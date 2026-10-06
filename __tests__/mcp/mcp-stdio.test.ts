import { spawn, type ChildProcessWithoutNullStreams } from "child_process";
import { existsSync } from "fs";
import * as http from "http";
import * as path from "path";

/**
 * The stdio binary end to end: spawned as an MCP client would (`npx -y
 * @posty5/mcp` runs `dist/bin/stdio.js`), against a local socket server
 * standing in for the API. Needs the build: `npm run build -w posty5-mcp`.
 */

const BIN = path.join(__dirname, "../../posty5-mcp/dist/bin/stdio.js");

type Captured = { method?: string; url?: string; headers: http.IncomingHttpHeaders; body: any };

function startApi() {
  const requests: Captured[] = [];
  const server = http.createServer((req, res) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      requests.push({ method: req.method, url: req.url, headers: req.headers, body: raw ? JSON.parse(raw) : undefined });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "", result: { _id: "l1", shorterLink: "https://pst5.co/x", baseUrl: "https://example.com" } }));
    });
  });
  return new Promise<{ url: string; requests: Captured[]; close: () => void }>((resolve) =>
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as { port: number };
      resolve({ url: `http://127.0.0.1:${port}`, requests, close: () => server.close() });
    }),
  );
}

/** A minimal JSON-RPC client over the child's stdio, newline-delimited as the stdio transport speaks. */
function rpc(child: ChildProcessWithoutNullStreams) {
  let buffer = "";
  const waiting = new Map<number, (message: any) => void>();
  child.stdout.on("data", (chunk) => {
    buffer += chunk;
    let index: number;
    while ((index = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, index).trim();
      buffer = buffer.slice(index + 1);
      if (!line) continue;
      const message = JSON.parse(line);
      if (message.id !== undefined && waiting.has(message.id)) waiting.get(message.id)!(message);
    }
  });
  let nextId = 1;
  return {
    request(method: string, params: Record<string, unknown> = {}) {
      const id = nextId++;
      return new Promise<any>((resolve) => {
        waiting.set(id, resolve);
        child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
      });
    },
    notify(method: string, params: Record<string, unknown> = {}) {
      child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method, params })}\n`);
    },
  };
}

describe("@posty5/mcp — the stdio binary", () => {
  let api: Awaited<ReturnType<typeof startApi>>;
  let child: ChildProcessWithoutNullStreams;
  let stderr = "";

  beforeAll(async () => {
    if (!existsSync(BIN)) throw new Error(`Build the package first: npm run build -w posty5-mcp (missing ${BIN})`);
    api = await startApi();
    child = spawn(process.execPath, [BIN], {
      env: { ...process.env, POSTY5_API_KEY: "test-key-not-real", POSTY5_BASE_URL: api.url, POSTY5_MCP_TOOLSETS: "short-links", POSTY5_MCP_ACCESS: "write" },
    });
    child.stderr.on("data", (chunk) => (stderr += chunk));
  });

  afterAll(() => {
    child?.kill();
    api?.close();
  });

  it("lists the toolsets and level it was started with, and attributes a create to the client and model", async () => {
    const client = rpc(child);
    const init = await client.request("initialize", { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "jest-client", version: "1.0.0" } });
    expect(init.result.serverInfo.name).toBe("posty5");
    client.notify("notifications/initialized");

    const list = await client.request("tools/list");
    const names = list.result.tools.map((tool: { name: string }) => tool.name);
    expect(names).toEqual(["account_get_current", "account_get_credits", "account_get_credit_usage", "account_get_operation_costs", "short_link_list", "short_link_get", "short_link_create", "short_link_create_many", "short_link_update"]);

    const call = await client.request("tools/call", { name: "short_link_create", arguments: { baseUrl: "https://example.com", templateId: "t1", aiModel: "claude-opus-5-5" } });
    expect(call.result.isError).toBeFalsy();

    const create = api.requests.find((request) => request.method === "POST")!;
    expect(create.url).toBe("/api/short-link");
    expect(create.body.createdFrom).toBe("mcp");
    expect(create.headers["x-posty5-client"]).toBe("posty5-mcp-stdio");
    const agent = JSON.parse(Buffer.from(String(create.headers["x-posty5-agent"]), "base64url").toString("utf8"));
    expect(agent).toMatchObject({ v: 1, channel: "mcp", client: { name: "jest-client", version: "1.0.0" }, model: "claude-opus-5-5", modelSource: "agent", tool: "short_link_create" });
    expect(stderr).not.toContain("test-key-not-real");
  });
});
