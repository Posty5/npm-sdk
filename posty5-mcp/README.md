# @posty5/mcp

Every Posty5 service — short links, QR codes, hosted HTML pages, social
publishing and online stores — as [Model Context Protocol](https://modelcontextprotocol.io)
tools, for any AI assistant. One package holds the tool catalogue, the server
that serves it, and a stdio binary for clients that launch local servers.

**Learn more:** [https://posty5.com](https://posty5.com)

---

## 🔌 Two ways to connect

| | Hosted (recommended) | Local (stdio) |
| --- | --- | --- |
| What you add to the assistant | A URL: `https://mcp.posty5.com/t/<token>/mcp` | A command: `npx -y @posty5/mcp` |
| Where you get it | Posty5 → Account settings → API keys → **MCP link** | Posty5 → Account settings → API keys (any key) |
| Access level and toolsets | Chosen in the dashboard when the link is made | Environment variables (below) |
| Attribution of what it creates | Signed: Posty5 knows it came through MCP | Declared: recorded as reported |

The hosted server runs this package; the URL embeds a token shown once — treat
it like a password.

## 🖥️ Local (stdio)

Needs Node.js 20 or later.

```json
{
  "mcpServers": {
    "posty5": {
      "command": "npx",
      "args": ["-y", "@posty5/mcp"],
      "env": {
        "POSTY5_API_KEY": "your-api-key",
        "POSTY5_MCP_TOOLSETS": "short-links,qr-codes",
        "POSTY5_MCP_ACCESS": "write"
      }
    }
  }
}
```

| Variable | Required | Meaning |
| --- | --- | --- |
| `POSTY5_API_KEY` | yes | The API key every call uses. Never printed. |
| `POSTY5_MCP_TOOLSETS` | no | Comma list of toolsets (below). Default: `account,short-links,qr-codes,html-hosting,social-publisher`. |
| `POSTY5_MCP_ACCESS` | no | `read`, `write` (default) or `full`. |
| `POSTY5_AI_MODEL` | no | The model to record when a call does not name one. |
| `POSTY5_BASE_URL` | no | API base URL (default `https://api.posty5.com`). |

The server writes the protocol to stdout and everything else to stderr.

## 🧰 Toolsets

| Toolset | On by default | What it covers |
| --- | --- | --- |
| `account` | always | Who the connection is, credits, live operation prices |
| `short-links` | ✅ | Short links |
| `qr-codes` | ✅ | QR codes of every type, and QR templates |
| `html-hosting` | ✅ | Hosted pages, their variables, form submissions |
| `social-publisher` | ✅ | Workspaces, connected accounts, posts to every platform |
| `store` | with any `store-*` | The stores the connection can manage |
| `store-catalog` | — | Products and tags |
| `store-orders` | — | Orders and customers — shoppers' personal data reaches the assistant's provider |
| `store-shipping` | — | Countries, routes, profiles, assignments |
| `store-dropshipping` | — | Supplier catalogue, imports, product links, supplier orders |

138 tools in all; `listToolsets()` and `listTools()` describe them.

## 🔐 Access levels and confirmation

- `read` — lists and gets only.
- `write` — also creates and updates.
- `full` — also deletes, removals from social platforms, supplier payments.

A tool above the connection's level is not listed and is refused if called.
Irreversible or paid tools take `confirm`: called without `confirm: true` they
change nothing and answer with what they would do (and the live price when the
action is charged), so the assistant can ask the user first.

### Batches

`short_link_create_many` and `qr_code_create_many` create 1–25 items in one
call and always take `confirm`: a batch costs up to 25 times the base price.
A refused row is reported and skipped. `qr_code_create_many` with `zip: true`
runs a bulk job and answers a **signed link to a ZIP of the images** that
expires within minutes; `qr_code_get_bulk_job` reports a job still running and
hands out fresh links. Webhook endpoints are not exposed through MCP.

## 🏷️ What gets recorded

Every tool that creates or changes something takes `aiModel` — the assistant
writes its exact model id. Records created through MCP carry
`createdFrom: "mcp"` and an `agentOrigin`: the MCP client (from the protocol)
and that model. Retrying a write with the same `idempotencyKey` returns the
first result instead of doing it twice.

## 🧩 Embedding the server

```ts
import { createPosty5McpServer, listTools } from "@posty5/mcp";
import { serveStdio } from "@modelcontextprotocol/server/stdio";

serveStdio(() => createPosty5McpServer({ apiKey: process.env.POSTY5_API_KEY, access: "read", toolsets: ["short-links"] }));

console.log(listTools({ access: "read" }).map((tool) => tool.name));
```

`createPosty5McpServer(options)` returns an `McpServer` from
[`@modelcontextprotocol/server`](https://www.npmjs.com/package/@modelcontextprotocol/server) v2
(protocol revisions 2025-era and 2026-07-28). A host supplies
`connection(call)` — the key, base URL and extra headers each call uses (the
package builds the SDK client) — `hooks` to refuse or log calls
(`beforeToolCall` may set `call.callId`, which the agent header carries), and
`idempotencyStore` to share replay protection across processes.

### Over HTTP

```ts
import http from "node:http";
import { createPosty5McpNodeHandler } from "@posty5/mcp";

const handler = createPosty5McpNodeHandler({
  sessionSecret: process.env.SESSION_SECRET!,
  resolve: async (req) => (await isValid(req)) ? { options: { access: "read", connection: () => ({ apiKey: "…" }) } } : { refusal: { status: 401, message: "Create a new MCP link." } },
});
http.createServer((req, res) => void handler(req, res)).listen(3021);
```

One handler serves the 2026-07-28 protocol and, statelessly, the 2025 era.
`resolve` runs per request, so each request's server lists exactly what its
options allow. A 2025-era client names itself only at `initialize`; the
handler hands that identity back as a signed `Mcp-Session-Id`, which the
client echoes, so its later tool calls are attributed to it on any process.
Express: pass `req.body` as the third argument.

Output: CommonJS and ES modules, with type definitions; the binary is CommonJS.

## 📖 Guide

Connecting Claude, ChatGPT, Cursor, VS Code and other clients, step by step:
[guide.posty5.com](https://guide.posty5.com).
