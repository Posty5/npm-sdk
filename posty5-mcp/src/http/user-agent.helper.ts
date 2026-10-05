import { GENERIC_USER_AGENTS } from "../config/http.config";
import type { ILegacyClientIdentity } from "./legacy-session.helper";
import { identityFromClientInfo } from "./legacy-session.helper";

/** The first product token of a User-Agent (`claude-code/2.1.0 (…)` → `claude-code` 2.1.0), when it names a client. */
export function identityFromUserAgent(userAgent: unknown): ILegacyClientIdentity | undefined {
  if (typeof userAgent !== "string") return undefined;
  const match = userAgent.trim().match(/^([A-Za-z0-9._@+-]+)(?:\/([A-Za-z0-9._+-]+))?/);
  if (!match || GENERIC_USER_AGENTS.includes(match[1].toLowerCase())) return undefined;
  return identityFromClientInfo({ name: match[1], version: match[2] });
}
