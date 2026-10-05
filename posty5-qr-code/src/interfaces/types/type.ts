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

/**
 * How a QR code's image encodes its content.
 *
 * - `"static"`: the image encodes the content itself; it can never change.
 * - `"dynamic"`: the image encodes the code's Posty5 link
 *   (`qrCodeLandingPageURL`), so the target can be changed later without
 *   reprinting. Wi-Fi codes cannot be dynamic (API 400 "This QR code type
 *   cannot be dynamic").
 *
 * When `mode` is omitted on create the API makes a static code; on update the
 * stored mode is kept. Changing the mode changes the image.
 */
export type QRCodeMode = "static" | "dynamic";
