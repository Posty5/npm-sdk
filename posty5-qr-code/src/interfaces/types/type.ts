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

/**
 * Scan rules for a dynamic QR code: when it works, how many visits it allows,
 * and where a scan goes when it does not work. Dynamic codes only (the API
 * answers 400 "Scan rules are only available for dynamic QR codes" on static
 * ones) and Starter plan or above (403 otherwise, surfaced unchanged).
 *
 * Each field may be `null` (or omitted) for "no rule". An object whose fields
 * are all empty clears the rules, like `access: null`.
 */
export interface IQRCodeAccess {
  /** The code works from this moment (ISO string or `Date`). */
  activeFrom?: string | Date | null;
  /** The code stops working at this moment; must be after `activeFrom`. */
  expiresAt?: string | Date | null;
  /** The code stops working after this many visits (integer, at least 1). */
  maxVisits?: number | null;
  /** Where a scan goes while the code is not working: an http(s) URL, at most 2048 characters. `""` means none. */
  fallbackUrl?: string | null;
}

/** Scan rules as the API returns them: each value set or `null`. */
export interface IQRCodeAccessResponse {
  activeFrom: string | null;
  expiresAt: string | null;
  maxVisits: number | null;
  fallbackUrl: string | null;
}
