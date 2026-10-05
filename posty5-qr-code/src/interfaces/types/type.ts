import { BasePreviewStatusType } from "@posty5/core";

/**
 * QR Code status type
 */
export type QrCodeStatusType = BasePreviewStatusType;

/**
 * QR Code target type
 */
export type QrCodeTargetType = "freeText" | "email" | "wifi" | "call" | "sms" | "url" | "geolocation";

/**
 * The QR types whose content the caller passes under a key named after the
 * type (`email`, `wifi`, …). `freeText` takes a top-level `text` instead.
 */
export type QrCodeStructuredTargetType = Exclude<QrCodeTargetType, "freeText">;
