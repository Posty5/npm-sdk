import { createHash } from "node:crypto";
import { IDEMPOTENCY_SCOPE_HEX_LENGTH } from "../config/limits.config";

/** The idempotency scope of a connection: a short SHA-256 of its API key (never the key itself). */
export function idempotencyScopeOf(apiKey: string | undefined): string {
  return createHash("sha256").update(apiKey ?? "", "utf8").digest("hex").slice(0, IDEMPOTENCY_SCOPE_HEX_LENGTH);
}

/** The store key of a write: scoped by connection, then tool, then the caller's key. */
export function idempotencyStoreKey(scope: string | undefined, tool: string, idempotencyKey: string): string {
  return scope ? `${scope}:${tool}:${idempotencyKey}` : `${tool}:${idempotencyKey}`;
}
