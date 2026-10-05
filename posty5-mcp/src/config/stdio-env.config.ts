/** The environment the stdio binary reads (`npx -y @posty5/mcp`). */
export const STDIO_ENV = {
  apiKey: "POSTY5_API_KEY",
  baseUrl: "POSTY5_BASE_URL",
  toolsets: "POSTY5_MCP_TOOLSETS",
  access: "POSTY5_MCP_ACCESS",
  model: "POSTY5_AI_MODEL",
} as const;

/** Printed to stderr when the key is missing. */
export const STDIO_MISSING_KEY_MESSAGE =
  "posty5-mcp: POSTY5_API_KEY is not set. Create an API key in Posty5 → Account settings → API keys and pass it in your MCP client's env block.";
