/**
 * Whether a request may proceed under `allowedOrigins`. A request without an
 * `Origin` header (a desktop or server-side MCP client) always may; a browser
 * request only from a listed origin — the DNS-rebinding guard the MCP spec
 * asks of HTTP servers. Compared case-insensitively, trailing slash ignored.
 */
export function isAllowedOrigin(origin: string | string[] | undefined, allowedOrigins: readonly string[]): boolean {
  const value = Array.isArray(origin) ? origin[0] : origin;
  if (!value) return true;
  const normalise = (text: string) => text.trim().replace(/\/+$/, "").toLowerCase();
  return allowedOrigins.some((allowed) => normalise(allowed) === normalise(value));
}
