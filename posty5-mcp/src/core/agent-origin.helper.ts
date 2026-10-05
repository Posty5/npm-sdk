/**
 * Which assistant and model make a call (mcp-server feature, decision 8). The
 * same normalisation the API applies (`api/packages/common/src/helpers/
 * agent-origin.helper.ts`), so a value never changes between the two sides.
 */
import {
  AGENT_MODEL_INVALID,
  AGENT_MODEL_PATTERN,
  AGENT_MODEL_UNKNOWN,
  AGENT_TEXT_MAX_LENGTH,
} from "../config/agent-identity.config";
import type { AgentModelSource, IToolCallContext } from "../interfaces/tool.interface";

/** Trimmed, control characters removed, at most `max` characters; `undefined` for anything that is not text. */
export function normaliseAgentText(value: unknown, max: number = AGENT_TEXT_MAX_LENGTH): string | undefined {
  if (typeof value !== "string") return undefined;
  const clean = value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max);
  return clean || undefined;
}

/** The model id as reported, `"unknown"` when absent, `"invalid"` when it does not look like one. */
export function normaliseModel(value: unknown): string {
  const text = normaliseAgentText(value);
  if (!text || text.toLowerCase() === AGENT_MODEL_UNKNOWN) return AGENT_MODEL_UNKNOWN;
  return AGENT_MODEL_PATTERN.test(text) ? text : AGENT_MODEL_INVALID;
}

/** The call's model: the tool argument wins, then the connection's, else "unknown". */
export function resolveModel(argument: unknown, connectionModel: unknown): { model: string; modelSource: AgentModelSource } {
  const fromArgument = normaliseModel(argument);
  if (fromArgument !== AGENT_MODEL_UNKNOWN) return { model: fromArgument, modelSource: "agent" };
  const fromConnection = normaliseModel(connectionModel);
  if (fromConnection !== AGENT_MODEL_UNKNOWN) return { model: fromConnection, modelSource: "connection" };
  return { model: AGENT_MODEL_UNKNOWN, modelSource: "unknown" };
}

/** `X-Posty5-Agent`'s value for a call: base64url JSON the API reads (unsigned here). */
export function encodeAgentHeader(call: IToolCallContext, nowSeconds: number = Math.floor(Date.now() / 1000)): string {
  const payload = {
    v: 1,
    t: nowSeconds,
    channel: "mcp",
    client: { name: call.client.name, ...(call.client.version ? { version: call.client.version } : {}) },
    model: call.model,
    modelSource: call.modelSource,
    tool: call.tool,
    ...(call.callId ? { callId: call.callId } : {}),
  };
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}
