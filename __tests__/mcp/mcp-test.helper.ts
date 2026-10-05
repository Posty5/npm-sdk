import type { HttpClient } from "@posty5/core";
import { CATALOGUE } from "../../posty5-mcp/src/catalogue";
import { createClients } from "../../posty5-mcp/src/core/clients.factory";
import type { IToolCallContext, IToolDefinition } from "../../posty5-mcp/src/interfaces/tool.interface";

/**
 * Offline helpers for the `@posty5/mcp` tests: a stub HttpClient that records
 * every request (the route-pinning style of `agent-gaps.test.ts`), and a way
 * to run one catalogue tool's handler against it.
 */

export type RecordedCall = { method: string; url: string; body?: any; params?: Record<string, unknown> };

/** A stub answering every request with `{ result }` (or `results[i]` for the i-th request). */
export function stubHttp(result: unknown = {}, results?: unknown[]) {
  const calls: RecordedCall[] = [];
  const answer = async () => ({ result: results ? results[calls.length - 1] : result, message: "" });
  const record = (method: string) => async (url: string, second?: any, third?: any) => {
    const isBodyless = method === "GET" || method === "DELETE";
    calls.push({ method, url, ...(isBodyless ? { params: second?.params } : { body: second, params: third?.params }) });
    return answer();
  };
  const stub = {
    createdFrom: "mcp",
    get: record("GET"),
    post: record("POST"),
    put: record("PUT"),
    patch: record("PATCH"),
    delete: record("DELETE"),
  };
  return { http: stub as unknown as HttpClient, calls };
}

export const route = (call: RecordedCall) => `${call.method} ${call.url}`;

export function findTool(name: string): IToolDefinition {
  const tool = CATALOGUE.find((item) => item.name === name);
  if (!tool) throw new Error(`no tool named ${name}`);
  return tool;
}

export function fakeCall(tool: IToolDefinition, args: Record<string, unknown> = {}): IToolCallContext {
  return { tool: tool.name, toolset: tool.toolset, access: "full", client: { name: "jest" }, model: "test-model", modelSource: "agent", args, startedAt: Date.now() };
}

/** Runs a tool's handler (not the confirm gate — see `previewTool`) over a stub and returns the requests it made. */
export async function runTool(name: string, args: Record<string, unknown>, result: unknown = {}, results?: unknown[]) {
  const tool = findTool(name);
  const { http, calls } = stubHttp(result, results);
  const value = await tool.run(tool.input.parse(args) as any, { clients: createClients(http), call: fakeCall(tool, args) });
  return { value, calls };
}

/** What a confirm tool says it would do, over a stub; `calls` must hold reads only. */
export async function previewTool(name: string, args: Record<string, unknown>, result: unknown = {}, results?: unknown[]) {
  const tool = findTool(name);
  if (!tool.confirm) throw new Error(`${name} has no confirm rule`);
  const { http, calls } = stubHttp(result, results);
  const text = await tool.confirm.describe(tool.input.parse(args), { clients: createClients(http), call: fakeCall(tool, args) });
  return { text, calls };
}
