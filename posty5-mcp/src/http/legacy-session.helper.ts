/**
 * 2025-era client identity across stateless requests. The `initialize` answer
 * carries `Mcp-Session-Id: <identity, signed>`; the spec makes clients send it
 * back on every later request, so any process can read who is calling without
 * shared session state. It authorises nothing — the token does that — so a
 * leaked id only reveals a client name.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { LEGACY_SESSION_KEY_PURPOSE, LEGACY_SESSION_MAX_LENGTH, LEGACY_SESSION_VERSION } from "../config/http.config";
import { normaliseAgentText } from "../core/agent-origin.helper";

export interface ILegacyClientIdentity {
  name: string;
  version?: string;
}

function signature(payload: string, secret: string): Buffer {
  return createHmac("sha256", `${LEGACY_SESSION_KEY_PURPOSE}:${secret}`).update(payload, "utf8").digest();
}

/** The client as `initialize` declared it, normalised; `undefined` when it named nothing usable. */
export function identityFromClientInfo(clientInfo: unknown): ILegacyClientIdentity | undefined {
  const info = clientInfo as { name?: unknown; version?: unknown } | undefined;
  const name = normaliseAgentText(info?.name);
  if (!name) return undefined;
  const version = normaliseAgentText(info?.version);
  return { name, ...(version ? { version } : {}) };
}

/** `p5s1.<base64url identity>.<base64url HMAC>` — visible ASCII only, as the header requires. */
export function encodeLegacySession(identity: ILegacyClientIdentity, secret: string): string {
  const payload = Buffer.from(JSON.stringify({ n: identity.name, ...(identity.version ? { v: identity.version } : {}) }), "utf8").toString("base64url");
  return `${LEGACY_SESSION_VERSION}.${payload}.${signature(payload, secret).toString("base64url")}`;
}

/** The identity inside a session id this server issued; `undefined` for anything else. Never throws. */
export function decodeLegacySession(value: unknown, secret: string): ILegacyClientIdentity | undefined {
  if (typeof value !== "string" || value.length > LEGACY_SESSION_MAX_LENGTH) return undefined;
  const [version, payload, mac] = value.split(".");
  if (version !== LEGACY_SESSION_VERSION || !payload || !mac) return undefined;
  const expected = signature(payload, secret);
  const given = Buffer.from(mac, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return undefined;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return identityFromClientInfo({ name: parsed?.n, version: parsed?.v });
  } catch {
    return undefined;
  }
}
