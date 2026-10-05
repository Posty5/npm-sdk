/**
 * How the package reports which assistant and model made a call
 * (mcp-server feature, decision 8). A copy of the API's rules in
 * `api/packages/common/src/constants/agent-identity.config.ts`; both sides
 * normalise the same fixtures (`__tests__/mcp-agent-origin.test.ts`).
 */

/** Header carrying the agent payload (base64url JSON). */
export const AGENT_ORIGIN_HEADER = "X-Posty5-Agent";

/** Header naming the client software on every request. */
export const CLIENT_HEADER = "X-Posty5-Client";

/** `X-Posty5-Client` value of the local (stdio) server. */
export const STDIO_CLIENT_ID = "posty5-mcp-stdio";

/** The `createdFrom` label records created through MCP carry. */
export const MCP_CREATED_FROM = "mcp";

/** Longest client name, client version or model kept. */
export const AGENT_TEXT_MAX_LENGTH = 100;

/** What a model id may look like; anything else is reported as "invalid". */
export const AGENT_MODEL_PATTERN = /^[A-Za-z0-9._:/@+-]+$/;

/** Reported when no model was given. */
export const AGENT_MODEL_UNKNOWN = "unknown";

/** Reported when the given model did not look like a model id. */
export const AGENT_MODEL_INVALID = "invalid";
