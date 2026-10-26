/** Base path of the webhook endpoint routes. */
export const WEBHOOK_ENDPOINTS_PATH = "/api/webhook-endpoints";

/** Largest accepted difference between `webhook-timestamp` and now, in seconds. */
export const WEBHOOK_DEFAULT_TOLERANCE_SECONDS = 300;

/** Standard Webhooks header names (lower-case). */
export const WEBHOOK_HEADERS = {
  id: "webhook-id",
  timestamp: "webhook-timestamp",
  signature: "webhook-signature",
} as const;

/**
 * Fewest key bytes a signing secret may decode to. Standard Webhooks secrets
 * are 24–64 bytes; an empty or mangled secret decodes to (almost) nothing,
 * and an HMAC under an empty key is one anyone can compute.
 */
export const WEBHOOK_MIN_SECRET_BYTES = 16;

/** Prefix of a signing secret; the rest is base64. */
export const WEBHOOK_SECRET_PREFIX = "whsec_";

/** Version tag of each signature in `webhook-signature`. */
export const WEBHOOK_SIGNATURE_VERSION = "v1";
