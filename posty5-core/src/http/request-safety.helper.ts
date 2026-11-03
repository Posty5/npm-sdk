import { Posty5Error } from "../errors/base-error";
import { API_KEY_HEADER_NAME, DOT_SEGMENT_PATTERN, LOOPBACK_HOSTNAMES, REDACTED_VALUE } from "./client.config";

/**
 * Refuse a request path with a `.` or `..` segment. Every SDK route is a fixed
 * path plus encoded ids, so such a segment can only come from an id like `..`,
 * which axios's URL parsing would resolve into a different API route — sent
 * with the caller's API key.
 */
export function assertNoDotSegments(url: string): void {
  const path = url.split(/[?#]/)[0];
  if (path.split("/").some((segment) => DOT_SEGMENT_PATTERN.test(segment))) {
    throw new Posty5Error(`Invalid request path "${url}": "." and ".." segments are not allowed`, "INVALID_PATH");
  }
}

/** Overwrite the API key header, whatever its case, in an axios header bag or a plain object. */
function redactHeaders(headers: any): void {
  if (!headers || typeof headers !== "object") return;
  for (const name of Object.keys(headers)) {
    if (name.toLowerCase() === API_KEY_HEADER_NAME.toLowerCase()) headers[name] = REDACTED_VALUE;
  }
}

/** Keep a property but hide it from `console.log`, `util.inspect` and `JSON.stringify`. */
function hideProperty(target: any, key: string): void {
  if (!target || !(key in target)) return;
  Object.defineProperty(target, key, { value: target[key], enumerable: false, configurable: true, writable: true });
}

/**
 * Strip the API key from an axios error before it is wrapped in a Posty5
 * error (`details.originalError`), where a logger or an error reporter would
 * serialize it. The key sits in `config.headers`; the raw request (Node's
 * `ClientRequest`, with the headers as sent) is kept but made non-enumerable.
 */
export function redactApiKey<T>(error: T): T {
  const axiosError = error as any;
  if (!axiosError || typeof axiosError !== "object") return error;
  redactHeaders(axiosError.config?.headers);
  redactHeaders(axiosError.response?.config?.headers);
  hideProperty(axiosError, "request");
  hideProperty(axiosError.response, "request");
  return error;
}

/** `scheme://host:port` of a URL-like object, with the scheme's default port filled in. */
function originOf(protocol: string, hostname: string, port?: string | number): string {
  const resolvedPort = port ? String(port) : protocol === "https:" ? "443" : "80";
  return `${protocol}//${hostname.toLowerCase()}:${resolvedPort}`;
}

/**
 * Build axios's `beforeRedirect` hook (Node only): drop the API key when a
 * redirect leaves the base URL's origin. The redirect library strips
 * `Authorization` and `Cookie` on a cross-host hop, but not `X-API-Key`.
 */
export function apiKeyRedirectGuard(baseUrl: string): (options: Record<string, any>) => void {
  let baseOrigin: string | undefined;
  try {
    const base = new URL(baseUrl);
    baseOrigin = originOf(base.protocol, base.hostname, base.port);
  } catch {
    baseOrigin = undefined; // Unparseable base: treat every redirect as cross-origin.
  }
  return (options) => {
    const target = originOf(String(options.protocol || ""), String(options.hostname || options.host || ""), options.port);
    if (target === baseOrigin) return;
    for (const name of Object.keys(options.headers || {})) {
      if (name.toLowerCase() === API_KEY_HEADER_NAME.toLowerCase()) delete options.headers[name];
    }
  };
}

/** Whether a base URL sends the API key in clear text to another machine. */
export function isInsecureBaseUrl(baseUrl: string): boolean {
  try {
    const url = new URL(baseUrl);
    return url.protocol === "http:" && !LOOPBACK_HOSTNAMES.includes(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}
