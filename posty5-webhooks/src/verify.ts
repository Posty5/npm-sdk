import { createHmac, timingSafeEqual } from "node:crypto";
import { Posty5WebhookSignatureError } from "./errors";
import type { Posty5WebhookEvent } from "./interfaces/events";
import type { IVerifyWebhookSignatureInput } from "./interfaces/verify";
import {
  WEBHOOK_DEFAULT_TOLERANCE_SECONDS,
  WEBHOOK_HEADERS,
  WEBHOOK_SECRET_PREFIX,
  WEBHOOK_SIGNATURE_VERSION,
} from "./config";

/** A header's value, matched case-insensitively; the first value of a repeated header. */
export function readHeader(headers: IVerifyWebhookSignatureInput["headers"], name: string): string | undefined {
  for (const [key, value] of Object.entries(headers || {})) {
    if (key.toLowerCase() === name) {
      return Array.isArray(value) ? value[0] : value;
    }
  }
  return undefined;
}

/** The secret's key bytes: base64 after the `whsec_` prefix. */
export function toSecretKey(secret: string): Buffer {
  const encoded = secret.startsWith(WEBHOOK_SECRET_PREFIX) ? secret.slice(WEBHOOK_SECRET_PREFIX.length) : secret;
  return Buffer.from(encoded, "base64");
}

/** The body as a string, decoding a `Buffer` as UTF-8. */
export function toPayloadText(payload: string | Buffer): string {
  return typeof payload === "string" ? payload : payload.toString("utf8");
}

/** base64 HMAC-SHA256 of `<id>.<timestamp>.<payload>`, the Standard Webhooks signature. */
export function signWebhookPayload(secret: string, id: string, timestamp: string | number, payload: string | Buffer): string {
  return createHmac("sha256", toSecretKey(secret)).update(`${id}.${timestamp}.${toPayloadText(payload)}`).digest("base64");
}

/** Constant-time comparison of two base64 signatures (length checked first). */
export function signaturesMatch(expected: string, received: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Whether any `v1,<sig>` entry of a space-separated `webhook-signature` header matches. */
export function anySignatureMatches(header: string, expected: string): boolean {
  for (const entry of header.split(" ")) {
    const comma = entry.indexOf(",");
    if (comma < 0) {
      continue;
    }
    const version = entry.slice(0, comma);
    const signature = entry.slice(comma + 1);
    if (version === WEBHOOK_SIGNATURE_VERSION && signature && signaturesMatch(expected, signature)) {
      return true;
    }
  }
  return false;
}

/**
 * Verify a Posty5 webhook delivery and return its parsed event.
 *
 * Standard Webhooks: reads `webhook-id`, `webhook-timestamp` and
 * `webhook-signature`, refuses a timestamp more than `toleranceSeconds`
 * (default 300) away from now, and accepts the delivery when any `v1,`
 * signature matches (during a secret rotation there are two). Node only: it
 * uses `node:crypto`. Pass the **raw** body, e.g. from
 * `express.raw({ type: "application/json" })`; a re-serialised object will not
 * match.
 *
 * @throws Posty5WebhookSignatureError with `reason` `missingHeaders`,
 * `timestampOutOfRange`, `noMatchingSignature` or `invalidJson`
 */
export function verifyWebhookSignature(input: IVerifyWebhookSignatureInput): Posty5WebhookEvent {
  const id = readHeader(input.headers, WEBHOOK_HEADERS.id);
  const timestamp = readHeader(input.headers, WEBHOOK_HEADERS.timestamp);
  const signatureHeader = readHeader(input.headers, WEBHOOK_HEADERS.signature);
  if (!id || !timestamp || !signatureHeader) {
    throw new Posty5WebhookSignatureError("missingHeaders", "Missing webhook-id, webhook-timestamp or webhook-signature header");
  }

  const sentAt = Number(timestamp);
  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  const tolerance = input.toleranceSeconds ?? WEBHOOK_DEFAULT_TOLERANCE_SECONDS;
  if (!Number.isFinite(sentAt) || Math.abs(now - sentAt) > tolerance) {
    throw new Posty5WebhookSignatureError("timestampOutOfRange", "The webhook timestamp is outside the accepted tolerance");
  }

  const expected = signWebhookPayload(input.secret, id, timestamp, input.payload);
  if (!anySignatureMatches(signatureHeader, expected)) {
    throw new Posty5WebhookSignatureError("noMatchingSignature", "No webhook signature matches the payload");
  }

  try {
    return JSON.parse(toPayloadText(input.payload)) as Posty5WebhookEvent;
  } catch {
    throw new Posty5WebhookSignatureError("invalidJson", "The webhook payload is not valid JSON");
  }
}
