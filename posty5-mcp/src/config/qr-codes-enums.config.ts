import type { QRCodeMode, QrCodeFileMimeType, QrCodeReviewPlatform, QrCodeSocialPlatform, QrCodeStatusType, QrCodeTargetType, QrCodeVCardPhoneKind } from "@posty5/qr-code";

/**
 * Closed value lists the qr-codes tools accept, mirrored from the
 * `@posty5/qr-code` unions — `satisfies` fails the build if a value leaves the
 * SDK's union.
 */

/** The types `qr_code_create_many` rows take (the bulk route's types). */
export const QR_CODE_BULK_TYPES = ["freeText", "email", "wifi", "call", "sms", "url", "geolocation"] as const satisfies readonly QrCodeTargetType[];

export type QrCodeBulkType = (typeof QR_CODE_BULK_TYPES)[number];

/** What a QR code does when scanned; picks the SDK create/update method of `qr_code_create` / `qr_code_update`. */
export const QR_CODE_TYPES = [...QR_CODE_BULK_TYPES, "vcard", "event", "whatsapp", "review", "social", "appStore", "file"] as const satisfies readonly QrCodeTargetType[];

export type QrCodeType = (typeof QR_CODE_TYPES)[number];

export const QR_CODE_STATUSES = ["new", "pending", "rejected", "approved", "fileIsNotFound"] as const satisfies readonly QrCodeStatusType[];

/** How the image encodes the content: the content itself, or the code's Posty5 link (changeable target). */
export const QR_CODE_MODES = ["static", "dynamic"] as const satisfies readonly QRCodeMode[];

/** The mode `qr_code_create` uses when none is given (DQ-D3); Wi-Fi codes are always static. */
export const QR_CODE_DEFAULT_MODE: QRCodeMode = "dynamic";

/** QR code types that cannot be dynamic (the API answers 400 "This QR code type cannot be dynamic"). */
export const QR_CODE_STATIC_ONLY_TYPES: readonly QrCodeType[] = ["wifi"];

/** QR code types that cannot be static (the API makes them dynamic; the SDK sends no mode). */
export const QR_CODE_DYNAMIC_ONLY_TYPES: readonly QrCodeType[] = ["appStore", "file"];

/** Types whose omitted mode on create is static instead of DQ-D3's dynamic (QT-D12: a dynamic business card puts the contact on a public page). */
export const QR_CODE_DEFAULT_STATIC_TYPES: readonly QrCodeType[] = ["vcard"];

export const QR_VCARD_PHONE_KINDS = ["mobile", "work", "home"] as const satisfies readonly QrCodeVCardPhoneKind[];

export const QR_REVIEW_PLATFORMS = ["google", "tripadvisor", "trustpilot", "yelp", "facebook", "other"] as const satisfies readonly QrCodeReviewPlatform[];

export const QR_SOCIAL_PLATFORMS = ["instagram", "facebook", "tiktok", "x", "youtube", "linkedin", "snapchat", "telegram", "threads", "pinterest", "other"] as const satisfies readonly QrCodeSocialPlatform[];

/** MIME types a `file` QR code accepts. */
export const QR_FILE_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"] as const satisfies readonly QrCodeFileMimeType[];

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
  vcard: ["vcard"],
  event: ["event"],
  whatsapp: ["whatsapp"],
  review: ["review"],
  social: ["social"],
  appStore: ["appStore"],
  file: ["fileBase64", "mimeType"],
};

/** As `QR_CODE_REQUIRED_FIELDS`, for `qr_code_update`: a `file` code without new content keeps its stored file. */
export const QR_CODE_UPDATE_REQUIRED_FIELDS: Record<QrCodeType, readonly string[]> = { ...QR_CODE_REQUIRED_FIELDS, file: [] };
