import type { QRCodeMode, QrCodeStatusType, QrCodeTargetType } from "@posty5/qr-code";

/**
 * Closed value lists the qr-codes tools accept, mirrored from the
 * `@posty5/qr-code` unions — `satisfies` fails the build if a value leaves the
 * SDK's union.
 */

/** What a QR code does when scanned; picks the SDK create/update method. */
export const QR_CODE_TYPES = ["freeText", "email", "wifi", "call", "sms", "url", "geolocation"] as const satisfies readonly QrCodeTargetType[];

export type QrCodeType = (typeof QR_CODE_TYPES)[number];

export const QR_CODE_STATUSES = ["new", "pending", "rejected", "approved", "fileIsNotFound"] as const satisfies readonly QrCodeStatusType[];

/** How the image encodes the content: the content itself, or the code's Posty5 link (changeable target). */
export const QR_CODE_MODES = ["static", "dynamic"] as const satisfies readonly QRCodeMode[];

/** The mode `qr_code_create` uses when none is given (DQ-D3); Wi-Fi codes are always static. */
export const QR_CODE_DEFAULT_MODE: QRCodeMode = "dynamic";

/** QR code types that cannot be dynamic (the API answers 400 "This QR code type cannot be dynamic"). */
export const QR_CODE_STATIC_ONLY_TYPES: readonly QrCodeType[] = ["wifi"];

/** Whose templates `qr_code_list_templates` lists: the account's own, or Posty5's public ones. */
export const QR_TEMPLATE_SCOPES = ["user", "public"] as const;

/** WiFi authentication types the API documents: WPA = WPA/WPA2, SAE = WPA3, nopass = open network. */
export const WIFI_AUTHENTICATION_TYPES = ["WPA", "WPA2", "SAE", "WEP", "nopass"] as const;

/** The tool arguments each QR code type cannot do without, checked with `requireFields` before any call. */
export const QR_CODE_REQUIRED_FIELDS: Record<QrCodeType, readonly string[]> = {
  freeText: ["text"],
  email: ["email"],
  wifi: ["wifiName", "wifiAuthenticationType"],
  call: ["phoneNumber"],
  sms: ["phoneNumber"],
  url: ["url"],
  geolocation: ["latitude", "longitude"],
};
