import { BasePreviewStatusType } from "@posty5/core";

/**
 * QR Code status type
 */
export type QrCodeStatusType = BasePreviewStatusType;

/**
 * QR Code target type
 */
export type QrCodeTargetType = "freeText" | "email" | "wifi" | "call" | "sms" | "url" | "geolocation";
