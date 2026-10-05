/**
 * The HTTP face of the server (`createPosty5McpNodeHandler`) — what the hosted
 * service mounts at `/t/<token>/mcp` and `/mcp`.
 */

/** Largest request body accepted, in bytes: the inline-HTML cap plus JSON-RPC overhead. */
export const HTTP_MAX_REQUEST_BYTES = 2 * 1024 * 1024;

/**
 * The 2025-era session header. Serving is stateless, so the id is not a
 * session: it is the client's `initialize` identity, signed, which clients
 * echo on every later request (decision 8 — who made a call).
 */
export const LEGACY_SESSION_HEADER = "mcp-session-id";

/** Version prefix of a legacy session id; bump it to invalidate every id issued before. */
export const LEGACY_SESSION_VERSION = "p5s1";

/** Longest session id read back; anything longer is ignored, never parsed. */
export const LEGACY_SESSION_MAX_LENGTH = 512;

/** The HMAC purpose label, so the session key never equals a key used for anything else. */
export const LEGACY_SESSION_KEY_PURPOSE = "posty5-mcp-legacy-session";

/** User-Agents of generic HTTP stacks: they name the library, not the assistant, so they say nothing about who is calling. */
export const GENERIC_USER_AGENTS = ["node", "node-fetch", "undici", "axios", "python-requests", "python-httpx", "aiohttp", "curl", "go-http-client", "okhttp", "java"];

/** `authInfo.extra` key carrying a request's resolved server options to the factory. */
export const RESOLVED_OPTIONS_KEY = "posty5McpOptions";

/** JSON-RPC error code of a refused HTTP request (the implementation-defined server-error range). */
export const HTTP_REFUSAL_RPC_CODE = -32001;
