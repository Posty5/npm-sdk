/**
 * One tool call, end to end: identity → access → host hook → confirm gate →
 * idempotency → the SDK → result or tool error → host hook. Every failure is a
 * tool result (`isError: true`), never a protocol error.
 */
import { ACCESS_RANK } from "../config/access.config";
import { IDEMPOTENCY_LOCK_TTL_MS, IDEMPOTENCY_TTL_MS } from "../config/limits.config";
import type { IToolOutcome } from "../interfaces/hooks.interface";
import type { IRawClientInfo, IToolRunnerDeps } from "../interfaces/runner.interface";
import type { IToolCallContext, IToolDefinition, IToolEntity, IToolRunContext } from "../interfaces/tool.interface";
import { normaliseAgentText, resolveModel } from "./agent-origin.helper";
import { createClients } from "./clients.factory";
import { previewConfirmation } from "./confirm.helper";
import { mapToolError } from "./errors.helper";
import { toToolError, toToolResult, type IToolResult } from "./result.helper";
import { isWriteTool } from "./tool-schema.helper";

const UNKNOWN_CLIENT = "unknown";

const IN_FLIGHT_MESSAGE =
  "Another call with this idempotencyKey is still running. Wait for it to finish, then check its result before trying again.";

function clientOf(info: IRawClientInfo | undefined): IToolCallContext["client"] {
  const version = normaliseAgentText(info?.version);
  return { name: normaliseAgentText(info?.name) ?? UNKNOWN_CLIENT, ...(version ? { version } : {}) };
}

function entityOf(tool: IToolDefinition, value: unknown, args: Record<string, unknown>): IToolEntity | undefined {
  try {
    return tool.entity?.(value, args as any);
  } catch {
    return undefined;
  }
}

/** Splits the catalogue's own arguments off the tool's. */
function splitArguments(raw: Record<string, unknown> | undefined) {
  const { aiModel, idempotencyKey, confirm, ...args } = raw ?? {};
  return { aiModel, idempotencyKey: typeof idempotencyKey === "string" ? idempotencyKey : undefined, confirm: confirm === true, args };
}

export async function runTool(
  tool: IToolDefinition,
  rawArgs: Record<string, unknown> | undefined,
  clientInfo: IRawClientInfo | undefined,
  deps: IToolRunnerDeps,
): Promise<IToolResult> {
  const startedAt = Date.now();
  const { aiModel, idempotencyKey, confirm, args } = splitArguments(rawArgs);
  const isWrite = isWriteTool(tool);
  const call: IToolCallContext = {
    tool: tool.name,
    toolset: tool.toolset,
    access: deps.access,
    client: clientOf(clientInfo),
    ...(isWrite ? resolveModel(aiModel, deps.connectionModel) : resolveModel(undefined, deps.connectionModel)),
    ...(isWrite && idempotencyKey ? { idempotencyKey } : {}),
    args,
    startedAt,
  };

  const finish = (result: IToolResult, outcome: Omit<IToolOutcome, "durationMs">): IToolResult => {
    try {
      deps.hooks.afterToolCall?.(call, { ...outcome, durationMs: Date.now() - startedAt });
    } catch {
      // A host's logger must never turn a finished call into a failure.
    }
    return result;
  };
  const fail = (status: IToolOutcome["status"], code: string, message: string) =>
    finish(toToolError(message, code), { status, errorCode: code, errorMessage: message });

  // Unregistered when the level forbids it; refused here too, in case a host registered it anyway.
  if (ACCESS_RANK[tool.access] > ACCESS_RANK[deps.access]) {
    return fail("denied", "accessLevel", `This connection's access level (${deps.access}) does not allow ${tool.name}.`);
  }

  try {
    const refusal = await deps.hooks.beforeToolCall?.(call);
    if (refusal) {
      const wait = refusal.retryAfterSeconds ? ` Retry after ${refusal.retryAfterSeconds} seconds.` : "";
      return fail(refusal.status, refusal.status, `${refusal.message}${wait}`);
    }
  } catch (error) {
    return fail("failed", "hook", (error as Error)?.message || "The call was refused.");
  }

  let ctx: IToolRunContext;
  try {
    ctx = { clients: createClients(deps.createHttpClient(call)), call };
  } catch (error) {
    return fail("failed", "client", (error as Error)?.message || "Could not prepare the Posty5 client.");
  }

  if (tool.confirm && !confirm) {
    try {
      const preview = await previewConfirmation(tool, args, ctx);
      return finish(toToolResult(preview, preview.action), { status: "ok", awaitingConfirmation: true });
    } catch (error) {
      const mapped = mapToolError(error, false);
      return fail(mapped.status, mapped.code, mapped.message);
    }
  }

  const key = call.idempotencyKey ? `${tool.name}:${call.idempotencyKey}` : undefined;
  if (key) {
    try {
      const stored = await deps.idempotencyStore.get(key);
      if (stored) return finish(stored.result as IToolResult, { status: "ok", replayed: true });
      if (!(await deps.idempotencyStore.acquire(key, IDEMPOTENCY_LOCK_TTL_MS))) {
        return fail("toolError", "inFlight", IN_FLIGHT_MESSAGE);
      }
    } catch {
      // Running without the replay guard would break the promise the key makes.
      return fail("failed", "idempotency", "The call could not be protected against duplicates right now, so it was not run. Try again shortly with the same idempotencyKey.");
    }
  }

  try {
    const value = await tool.run(args as any, ctx);
    const result = toToolResult(value);
    if (key) await deps.idempotencyStore.set(key, result, IDEMPOTENCY_TTL_MS).catch(() => undefined);
    return finish(result, { status: "ok", entity: entityOf(tool, value, args) });
  } catch (error) {
    if (key) await deps.idempotencyStore.release(key).catch(() => undefined);
    const mapped = mapToolError(error, isWrite);
    return fail(mapped.status, mapped.code, mapped.message);
  }
}
