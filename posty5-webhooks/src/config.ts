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

/** Prefix of a signing secret; the rest is base64. */
export const WEBHOOK_SECRET_PREFIX = "whsec_";

/** Version tag of each signature in `webhook-signature`. */
export const WEBHOOK_SIGNATURE_VERSION = "v1";
