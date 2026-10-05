import { Posty5Error } from "@posty5/core";
import type { WebhookSignatureFailureReason } from "./interfaces/verify";

/** Thrown by `verifyWebhookSignature`; answer the delivery with a 400. */
export class Posty5WebhookSignatureError extends Posty5Error {
  public readonly reason: WebhookSignatureFailureReason;

  constructor(reason: WebhookSignatureFailureReason, message: string) {
    super(message, "WEBHOOK_SIGNATURE_INVALID", 400);
    this.name = "Posty5WebhookSignatureError";
    this.reason = reason;
  }
}
