/** Input of `verifyWebhookSignature`. */
export interface IVerifyWebhookSignatureInput {
  /** The raw request body, exactly as received (not a re-serialised object). */
  payload: string | Buffer;
  /** The request headers; names are matched case-insensitively. */
  headers: Record<string, string | string[] | undefined>;
  /** The endpoint's signing secret (`whsec_...`). */
  secret: string;
  /** Largest accepted clock difference, in seconds (default 300). */
  toleranceSeconds?: number;
  /** "Now" in unix seconds, for tests (default the system clock). */
  nowSeconds?: number;
}

/** Why a delivery failed verification. */
export type WebhookSignatureFailureReason = "missingHeaders" | "timestampOutOfRange" | "noMatchingSignature" | "invalidJson";
