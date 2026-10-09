import { AuthenticationError, AuthorizationError, NetworkError, NotFoundError, RateLimitError, ServerError, ValidationError } from "@posty5/core";
import { RESULT_MAX_BYTES } from "../../posty5-mcp/src/config/limits.config";
import { encodeAgentHeader, normaliseAgentText, normaliseModel, resolveModel } from "../../posty5-mcp/src/core/agent-origin.helper";
import { mapToolError } from "../../posty5-mcp/src/core/errors.helper";
import { MemoryIdempotencyStore } from "../../posty5-mcp/src/core/memory-idempotency.store";
import { toToolResult } from "../../posty5-mcp/src/core/result.helper";
import { ToolInputError } from "../../posty5-mcp/src/core/tool-input.error";
import { runTool as runCall } from "../../posty5-mcp/src/core/tool-runner";
import type { IToolOutcome } from "../../posty5-mcp/src/interfaces/hooks.interface";
import type { IToolRunnerDeps } from "../../posty5-mcp/src/interfaces/runner.interface";
import type { IToolCallContext } from "../../posty5-mcp/src/interfaces/tool.interface";
import { findTool, route, stubHttp } from "./mcp-test.helper";

/**
 * The machinery every tool shares: error text, result shaping, the model a
 * call is attributed to, and the runner's gates — access, host hook, confirm,
 * idempotency. Offline: a stub stands in for HttpClient.
 */

function depsWith(result: unknown, over: Partial<IToolRunnerDeps> = {}) {
  const { http, calls } = stubHttp(result);
  const outcomes: { call: IToolCallContext; outcome: IToolOutcome }[] = [];
  const deps: IToolRunnerDeps = {
    access: "full",
    createHttpClient: () => http,
    hooks: { afterToolCall: (call, outcome) => outcomes.push({ call, outcome }) },
    idempotencyStore: new MemoryIdempotencyStore(),
    ...over,
  };
  return { deps, calls, outcomes };
}

const LINK = { _id: "l1", shorterLink: "https://pst5.co/x", name: "Promo", baseUrl: "https://example.com", numberOfVisitors: 3 };

describe("@posty5/mcp — error text", () => {
  it("maps each SDK error to a status and a sentence the model can act on", () => {
    expect(mapToolError(new AuthenticationError(), false)).toMatchObject({ status: "toolError", code: "unauthenticated" });
    expect(mapToolError(new AuthorizationError("plan"), false)).toMatchObject({ status: "toolError", code: "forbidden" });
    expect(mapToolError(new NotFoundError(), false)).toMatchObject({ status: "toolError", code: "notFound" });
    expect(mapToolError(new RateLimitError("slow", 30), false)).toMatchObject({ status: "rateLimited", message: expect.stringContaining("30 seconds") });
    expect(mapToolError(new ValidationError("Not enough credits"), true).message).toContain("account_get_credits");
    expect(mapToolError(new ToolInputError("type \"email\" needs: email."), true)).toMatchObject({ status: "toolError", code: "invalidArguments" });
  });

  it("says a failed write's outcome is unknown, and a failed read's is not", () => {
    expect(mapToolError(new NetworkError(), true).message).toContain("outcome is unknown");
    expect(mapToolError(new ServerError(), false).message).not.toContain("outcome is unknown");
  });
});

describe("@posty5/mcp — results", () => {
  it("drops upload configs and inline data URLs", () => {
    const result = toToolResult({ _id: "a", uploadFileConfig: { url: "x" }, image: "data:image/png;base64,AAAA" });
    expect(result.structuredContent).toEqual({ _id: "a", image: "[inline data omitted]" });
  });

  it("wraps a list as { result }", () => {
    expect(toToolResult([1, 2]).structuredContent).toEqual({ result: [1, 2] });
  });

  it("refuses a result over the cap and says how to narrow it", () => {
    const result = toToolResult({ items: "x".repeat(RESULT_MAX_BYTES + 1) });
    expect(result.structuredContent).toMatchObject({ truncated: true });
    expect(result.content[0].text).toContain("pageSize");
  });
});

describe("@posty5/mcp — attribution", () => {
  // The same cases as api/apps/identity-service/tests/agent-origin.test.ts — change both together.
  it("normalises model ids and agent text exactly as the API does", () => {
    expect(normaliseModel("claude-opus-5-5")).toBe("claude-opus-5-5");
    expect(normaliseModel("gpt-5.1/2026-08")).toBe("gpt-5.1/2026-08");
    expect(normaliseModel(undefined)).toBe("unknown");
    expect(normaliseModel("Unknown")).toBe("unknown");
    expect(normaliseModel("rm -rf /")).toBe("invalid");
    expect(normaliseAgentText("  cla\u0000ude\n ")).toBe("claude");
    expect(normaliseAgentText("x".repeat(500))).toHaveLength(100);
    expect(normaliseAgentText(42)).toBeUndefined();
  });

  it("normalises model ids the way the API does", () => {
    expect(normaliseModel("  claude-opus-5-5 ")).toBe("claude-opus-5-5");
    expect(normaliseModel("UNKNOWN")).toBe("unknown");
    expect(normaliseModel("")).toBe("unknown");
    expect(normaliseModel("gpt 5; drop table")).toBe("invalid");
    expect(normaliseModel("x".repeat(150))).toHaveLength(100);
  });

  it("prefers the argument, then the connection", () => {
    expect(resolveModel("gpt-5", "claude-opus-5-5")).toEqual({ model: "gpt-5", modelSource: "agent" });
    expect(resolveModel(undefined, "claude-opus-5-5")).toEqual({ model: "claude-opus-5-5", modelSource: "connection" });
    expect(resolveModel("unknown", undefined)).toEqual({ model: "unknown", modelSource: "unknown" });
  });

  it("encodes the header payload the API decodes", () => {
    const call = { tool: "short_link_create", client: { name: "claude-ai", version: "1.2" }, model: "claude-opus-5-5", modelSource: "agent" } as IToolCallContext;
    const payload = JSON.parse(Buffer.from(encodeAgentHeader(call, 1700000000), "base64url").toString("utf8"));
    expect(payload).toEqual({ v: 1, t: 1700000000, channel: "mcp", client: { name: "claude-ai", version: "1.2" }, model: "claude-opus-5-5", modelSource: "agent", tool: "short_link_create" });
  });
});

describe("@posty5/mcp — the runner", () => {
  it("strips the catalogue's arguments, attributes the model, and reports the created entity", async () => {
    const { deps, calls, outcomes } = depsWith(LINK);
    await runCall(findTool("short_link_create"), { baseUrl: "https://example.com", aiModel: "claude-opus-5-5", idempotencyKey: "key-12345" }, { name: "claude-ai" }, deps);
    expect(route(calls[0])).toBe("POST /api/short-link");
    expect(calls[0].body).not.toHaveProperty("aiModel");
    expect(calls[0].body).not.toHaveProperty("idempotencyKey");
    expect(outcomes[0].call).toMatchObject({ model: "claude-opus-5-5", modelSource: "agent", client: { name: "claude-ai" }, idempotencyKey: "key-12345" });
    expect(outcomes[0].outcome).toMatchObject({ status: "ok", entity: { entityType: "shortLink", entityId: "l1" } });
  });

  it("never deletes without confirm: true — it describes the action with reads only", async () => {
    const { deps, calls, outcomes } = depsWith(LINK);
    const result = await runCall(findTool("short_link_delete"), { version: 1, id: "l1", aiModel: "m" }, undefined, deps);
    expect(calls.every((call) => call.method === "GET")).toBe(true);
    expect(result.isError).toBeUndefined();
    expect(result.structuredContent).toMatchObject({ awaitingConfirmation: true, action: expect.stringContaining("cannot be undone") });
    expect(outcomes[0].outcome).toMatchObject({ status: "ok", awaitingConfirmation: true });
  });

  it("deletes with confirm: true", async () => {
    const { deps, calls } = depsWith({});
    await runCall(findTool("short_link_delete"), { version: 1, id: "l1", aiModel: "m", confirm: true }, undefined, deps);
    expect(calls.map(route)).toEqual(["DELETE /api/short-link/l1"]);
  });

  it("replays a write retried with the same idempotencyKey instead of repeating it", async () => {
    const { deps, calls, outcomes } = depsWith(LINK);
    const args = { baseUrl: "https://example.com", templateId: "t1", aiModel: "m", idempotencyKey: "retry-key-1" };
    const first = await runCall(findTool("short_link_create"), args, undefined, deps);
    const second = await runCall(findTool("short_link_create"), args, undefined, deps);
    expect(calls).toHaveLength(1);
    expect(second).toEqual(first);
    expect(outcomes[1].outcome).toMatchObject({ replayed: true });
  });

  it("refuses a tool above the connection's access level without calling the API", async () => {
    const { deps, calls, outcomes } = depsWith({}, { access: "write" });
    const result = await runCall(findTool("short_link_delete"), { version: 1, id: "l1", aiModel: "m", confirm: true }, undefined, deps);
    expect(result.isError).toBe(true);
    expect(calls).toHaveLength(0);
    expect(outcomes[0].outcome.status).toBe("denied");
  });

  it("answers a host's refusal as a tool error and runs nothing", async () => {
    const { deps, calls } = depsWith({});
    deps.hooks.beforeToolCall = () => ({ status: "rateLimited", message: "Daily tool-call limit reached.", retryAfterSeconds: 60 });
    const result = await runCall(findTool("short_link_list"), {}, undefined, deps);
    expect(result).toMatchObject({ isError: true, content: [{ text: expect.stringContaining("60 seconds") }] });
    expect(calls).toHaveLength(0);
  });

  it("survives a host logger that throws", async () => {
    const { deps } = depsWith({ items: [] });
    deps.hooks.afterToolCall = () => {
      throw new Error("log down");
    };
    await expect(runCall(findTool("short_link_list"), {}, undefined, deps)).resolves.toMatchObject({ structuredContent: { items: [] } });
  });
});
