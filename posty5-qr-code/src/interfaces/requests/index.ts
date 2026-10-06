import { IPaginationParams } from "@posty5/core";
import {
  IQRCodeAccess,
  QRCodeMode,
  QrCodeFileMimeType,
  QrCodeReviewPlatform,
  QrCodeSocialPlatform,
  QrCodeStatusType,
  QrCodeTargetType,
  QrCodeVCardPhoneKind,
} from "../types/type";

/**
 * Content of the code's Posty5 landing page when `isEnableLandingPage` is true.
 */
export interface IQRCodePageInfo {
  /** Page title. Required when `isEnableLandingPage` is true. */
  title?: string;
  /** Page description */
  description?: string;
}

/**
 * QR Code styling options
 */
export interface IQRCodeOptions {
  /**
   * The content the image encodes. Built by the API from `qrCodeTarget` (for
   * `freeText`, from `freeText.text`); a value sent by a client is ignored.
   */
  text?: string;
  width?: number;
  height?: number;
  correctLevel?: number;
  dotScale?: number;
  dotScaleTiming_H?: number;
  dotScaleTiming_V?: number;
  dotScaleAO?: number;
  dotScaleAI?: number;
  quietZone?: number;
  quietZoneColor?: string;
  colorDark?: string;
  colorLight?: string;
  PO_TL?: string;
  PO_TR?: string;
  PO_BL?: string;
  PI_TL?: string;
  PI_TR?: string;
  PI_BL?: string;
  AI?: string;
  AO?: string;
  timing_V?: string;
  timing_H?: string;
  title?: string;
  titleFont?: string;
  titleColor?: string;
  titleBackgroundColor?: string;
  titleHeight?: number;
  titleTop?: number;
  logo?: string;
  logoWidth?: number;
  logoHeight?: number;
  logoBackgroundColor?: string;
  logoBackgroundTransparent?: boolean;
}

/**
 * Email QR code target
 */
export interface IQRCodeEmailTarget {
  /** Email address */
  email?: string;
  /** Email subject */
  subject?: string;
  /** Email body */
  body?: string;
}
/**
 * Email QR code target
 */
export interface IQRFreeTextTarget {
  text?: string;
}
/**
 * WiFi QR code target
 */
export interface IQRCodeWifiTarget {
  /** WiFi network name */
  name?: string;
  /** Authentication type (WPA, WEP, etc.) */
  authenticationType?: string;
  /** WiFi password */
  password?: string;
}

/**
 * Call QR code target
 */
export interface IQRCodeCallTarget {
  /** Phone number */
  phoneNumber?: string;
}

/**
 * SMS QR code target
 */
export interface IQRCodeSmsTarget {
  /** Phone number */
  phoneNumber?: string;
  /** SMS message */
  message?: string;
}

/**
 * URL QR code target
 */
export interface IQRCodeUrlTarget {
  /**
   * Target URL. Must start with `http://` or `https://`; anything else is
   * refused with "The URL must start with http:// or https://".
   */
  url?: string;
}

/**
 * Geolocation QR code target
 */
export interface IQRCodeGeolocationTarget {
  /** Latitude */
  latitude: string | number;
  /** Longitude */
  longitude: string | number;
  /** Map URL */
  // mapURL?: string;
}

/** One vCard phone. */
export interface IQRCodeVCardPhone {
  /** Phone kind; default `"mobile"`. */
  kind?: QrCodeVCardPhoneKind;
  /** Phone number (required for each phone entry). */
  number: string;
}

/** A vCard's work address (`ADR;TYPE=WORK`). */
export interface IQRCodeVCardAddress {
  street?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
}

/**
 * vCard (contact card) QR code target, encoded by the API as vCard 3.0.
 * `firstName` or `organization` is required.
 */
export interface IQRCodeVCardTarget {
  firstName?: string;
  lastName?: string;
  organization?: string;
  jobTitle?: string;
  phones?: IQRCodeVCardPhone[];
  emails?: string[];
  /** http(s) URL */
  website?: string;
  address?: IQRCodeVCardAddress;
  note?: string;
}

/**
 * Calendar event QR code target, encoded by the API as a VEVENT.
 * `startsAt` / `endsAt` accept a `Date` or an ISO string (a `Date` is sent as
 * ISO); a wall-clock ISO value is read in `timezone`.
 */
export interface IQRCodeEventTarget {
  /** Event title (required) */
  title: string;
  location?: string;
  description?: string;
  /** Start (required) */
  startsAt: string | Date;
  /** End; must be after `startsAt` */
  endsAt?: string | Date | null;
  /** All-day event; default `false` */
  allDay?: boolean;
  /** IANA time zone, e.g. `"Africa/Cairo"` */
  timezone?: string;
  /** http(s) URL */
  url?: string;
}

/** WhatsApp chat QR code target: encoded as `https://wa.me/<digits>[?text=…]`. */
export interface IQRCodeWhatsappTarget {
  /** Phone number in international format (required) */
  phoneNumber: string;
  /** Pre-filled message */
  message?: string;
}

/** Review QR code target. Google takes `placeId` or `url`; the other platforms a `url` on their host. */
export interface IQRCodeReviewTarget {
  platform: QrCodeReviewPlatform;
  /** Google place ID (Google only) */
  placeId?: string;
  /** Review page URL */
  url?: string;
}

/** One social profile: `handle` or `url`. */
export interface IQRCodeSocialProfile {
  platform: QrCodeSocialPlatform;
  handle?: string;
  url?: string;
}

/**
 * Social profiles QR code target. A static code takes one profile (its URL is
 * encoded); a dynamic code takes up to 12, listed on its Posty5 page. The API
 * refuses two or more profiles on a static code.
 */
export interface IQRCodeSocialTarget {
  /** 1 to 12 profiles (more than one requires `mode: "dynamic"`) */
  profiles: IQRCodeSocialProfile[];
  title?: string;
}

/**
 * App store QR code target (dynamic-only): a scan goes to the store of the
 * scanning device, else to `fallbackUrl`.
 */
export interface IQRCodeAppStoreTarget {
  /** Google Play URL */
  androidUrl?: string;
  /** App Store URL */
  iosUrl?: string;
  /** Where any other device goes (required) */
  fallbackUrl: string;
}

/**
 * File QR code target (dynamic-only): a hosted PDF or image. `createFile` /
 * `updateFile` upload the content and send `bucketFilePath`; the API sets
 * `fileURL`, `mimeType` and `sizeBytes` after verifying the upload.
 */
export interface IQRCodeFileTarget {
  /** Display name of the file */
  fileName?: string;
  /** From `POST /api/qr-code/file/upload-url` (sent by the SDK; never returned) */
  bucketFilePath?: string;
  /** Public URL of the hosted file (server-set) */
  fileURL?: string;
  /** Server-set */
  mimeType?: QrCodeFileMimeType;
  /** Server-set */
  sizeBytes?: number;
}

/** What `createFile` / `updateFile` take under `file`. */
export interface IQRCodeFileInput {
  /** Display name; also the name sent to the upload-url route. Default `"file"`. */
  fileName?: string;
  /** Required when the content is an `ArrayBuffer` / `Buffer`; a `Blob` falls back to its `type`. */
  mimeType?: QrCodeFileMimeType;
}

/** `POST /api/qr-code/file/upload-url` response. */
export interface IQRCodeFileUploadTicket {
  /** Signed PUT URL, valid for `expiresInSeconds` (60 s) */
  uploadFileURL: string;
  bucketFilePath: string;
  expiresInSeconds: number;
}

/** The content `createFile` / `updateFile` upload (a Node `Buffer` is a `Uint8Array`). */
export type QrCodeFileContent = Blob | ArrayBuffer | Uint8Array;

/**
 * QR Code target configuration
 */
export interface IQRCodeTarget {
  /** Target type */
  type: QrCodeTargetType;
  /** Free text configuration (when type is 'freeText') */
  freeText?: IQRFreeTextTarget;
  /** Email configuration (when type is 'email') */
  email?: IQRCodeEmailTarget;
  /** WiFi configuration (when type is 'wifi') */
  wifi?: IQRCodeWifiTarget;
  /** Call configuration (when type is 'call') */
  call?: IQRCodeCallTarget;
  /** SMS configuration (when type is 'sms') */
  sms?: IQRCodeSmsTarget;
  /** URL configuration (when type is 'url') */
  url?: IQRCodeUrlTarget;
  /** Geolocation configuration (when type is 'geolocation') */
  geolocation?: IQRCodeGeolocationTarget;
  /** vCard configuration (when type is 'vcard') */
  vcard?: IQRCodeVCardTarget;
  /** Event configuration (when type is 'event') */
  event?: IQRCodeEventTarget;
  /** WhatsApp configuration (when type is 'whatsapp') */
  whatsapp?: IQRCodeWhatsappTarget;
  /** Review configuration (when type is 'review') */
  review?: IQRCodeReviewTarget;
  /** Social configuration (when type is 'social') */
  social?: IQRCodeSocialTarget;
  /** App store configuration (when type is 'appStore') */
  appStore?: IQRCodeAppStoreTarget;
  /** File configuration (when type is 'file') */
  file?: IQRCodeFileTarget;
}

/**
 * Base request interface for creating/updating QR codes
 */
export interface IQRCodeRequest {
  /** QR code name (optional) */
  name?: string;
  /**
   * QR code template the image is rendered with.
   *
   * Required when calling with an API key — every SDK call does; the API
   * refuses a create or update without it. Pick one of your templates on the
   * dashboard templates page (https://studio.posty5.com/qr-code-templates).
   */
  templateId: string;
  /** Reference ID (optional) - custom identifier from your system */
  refId?: string;
  /** Tag (optional) - custom tag for filtering */
  tag?: string;
  /** Custom landing page ID (optional, max 32 chars) */
  customLandingId?: string;
  /**
   * Show `pageInfo` on the code's Posty5 landing page. Default `false`.
   */
  isEnableLandingPage?: boolean;
  /**
   * @deprecated Never accepted by the API; ignored by this SDK and removed in 5.0.0.
   */
  isEnableMonetization?: boolean;
  /** Page information (required when `isEnableLandingPage` is true) */
  pageInfo?: IQRCodePageInfo;
  /**
   * `"dynamic"` encodes the code's Posty5 link (`qrCodeLandingPageURL`), so the
   * target can be changed later without reprinting; `"static"` encodes the
   * content itself. Wi-Fi codes cannot be dynamic. Omitted on create → the API
   * makes a static code; omitted on update → the stored mode is kept. Sent only
   * when defined. Changing the mode changes the image.
   */
  mode?: QRCodeMode;
  /**
   * Scan rules (dynamic codes only; Starter plan or above). Sent only when
   * defined. On update: omitted keeps the stored rules, an object replaces
   * them whole, `null` (or an all-empty object) clears them.
   */
  access?: IQRCodeAccess | null;
}

/** Request fields for a Wi-Fi code: Wi-Fi codes are always static, so they take no scan rules either. */
export type IQRCodeStaticOnlyRequest<T extends IQRCodeRequest> = Omit<T, "mode" | "access"> & {
  /** Wi-Fi codes cannot be dynamic; only `"static"` is accepted. */
  mode?: "static";
};

export interface ICreateFreeTextQRCodeRequest extends IQRCodeRequest {
  /** QR code text */
  text: string;
}
export interface ICreateEmailQRCodeRequest extends IQRCodeRequest {
  /** Email configuration (when type is 'email') */
  email: IQRCodeEmailTarget;
}
export interface ICreateWifiQRCodeRequest extends IQRCodeStaticOnlyRequest<IQRCodeRequest> {
  /** WiFi configuration (when type is 'wifi') */
  wifi: IQRCodeWifiTarget;
}
export interface ICreateCallQRCodeRequest extends IQRCodeRequest {
  /** Call configuration (when type is 'call') */
  call: IQRCodeCallTarget;
}
export interface ICreateSMSQRCodeRequest extends IQRCodeRequest {
  /** SMS configuration (when type is 'sms') */
  sms: IQRCodeSmsTarget;
}
export interface ICreateURLQRCodeRequest extends IQRCodeRequest {
  /** URL configuration (when type is 'url') */
  url: IQRCodeUrlTarget;
}
export interface ICreateGeolocationQRCodeRequest extends IQRCodeRequest {
  /** Geolocation configuration (when type is 'geolocation') */
  geolocation: IQRCodeGeolocationTarget;
}
export interface ICreateVCardQRCodeRequest extends IQRCodeRequest {
  /** vCard configuration (when type is 'vcard') */
  vcard: IQRCodeVCardTarget;
}
export interface ICreateEventQRCodeRequest extends IQRCodeRequest {
  /** Event configuration (when type is 'event') */
  event: IQRCodeEventTarget;
}
export interface ICreateWhatsAppQRCodeRequest extends IQRCodeRequest {
  /** WhatsApp configuration (when type is 'whatsapp') */
  whatsapp: IQRCodeWhatsappTarget;
}
export interface ICreateReviewQRCodeRequest extends IQRCodeRequest {
  /** Review configuration (when type is 'review') */
  review: IQRCodeReviewTarget;
}
export interface ICreateSocialQRCodeRequest extends IQRCodeRequest {
  /** Social configuration (when type is 'social') */
  social: IQRCodeSocialTarget;
}
/** App store codes are dynamic-only: `mode` may be omitted (the API defaults it) or `"dynamic"`. */
export interface ICreateAppStoreQRCodeRequest extends Omit<IQRCodeRequest, "mode"> {
  mode?: "dynamic";
  /** App store configuration (when type is 'appStore') */
  appStore: IQRCodeAppStoreTarget;
}
/** File codes are dynamic-only. The content itself is the second argument of `createFile`. */
export interface ICreateFileQRCodeRequest extends Omit<IQRCodeRequest, "mode"> {
  mode?: "dynamic";
  file?: IQRCodeFileInput;
}

/**
 * Request interface for updating a QR code
 */
export interface IUpdateQRCodeRequest extends IQRCodeRequest {
  /** QR code name (required for updates) */
  name: string;
}

export interface IUpdateFreeTextQRCodeRequest extends IUpdateQRCodeRequest {
  /** QR code target configuration */
  qrCodeTarget: {
    /** QR code text */
    text: string;
  };
}
export interface IUpdateEmailQRCodeRequest extends IUpdateQRCodeRequest {
  /** Email configuration (when type is 'email') */
  email: IQRCodeEmailTarget;
}
export interface IUpdateWifiQRCodeRequest extends IQRCodeStaticOnlyRequest<IUpdateQRCodeRequest> {
  /** WiFi configuration (when type is 'wifi') */
  wifi: IQRCodeWifiTarget;
}
export interface IUpdateCallQRCodeRequest extends IUpdateQRCodeRequest {
  /** Call configuration (when type is 'call') */
  call: IQRCodeCallTarget;
}
export interface IUpdateSMSQRCodeRequest extends IUpdateQRCodeRequest {
  /** SMS configuration (when type is 'sms') */
  sms: IQRCodeSmsTarget;
}
export interface IUpdateURLQRCodeRequest extends IUpdateQRCodeRequest {
  /** URL configuration (when type is 'url') */
  url: IQRCodeUrlTarget;
}
export interface IUpdateGeolocationQRCodeRequest extends IUpdateQRCodeRequest {
  /** Geolocation configuration (when type is 'geolocation') */
  geolocation: IQRCodeGeolocationTarget;
}
export interface IUpdateVCardQRCodeRequest extends IUpdateQRCodeRequest {
  /** vCard configuration (when type is 'vcard') */
  vcard: IQRCodeVCardTarget;
}
export interface IUpdateEventQRCodeRequest extends IUpdateQRCodeRequest {
  /** Event configuration (when type is 'event') */
  event: IQRCodeEventTarget;
}
export interface IUpdateWhatsAppQRCodeRequest extends IUpdateQRCodeRequest {
  /** WhatsApp configuration (when type is 'whatsapp') */
  whatsapp: IQRCodeWhatsappTarget;
}
export interface IUpdateReviewQRCodeRequest extends IUpdateQRCodeRequest {
  /** Review configuration (when type is 'review') */
  review: IQRCodeReviewTarget;
}
export interface IUpdateSocialQRCodeRequest extends IUpdateQRCodeRequest {
  /** Social configuration (when type is 'social') */
  social: IQRCodeSocialTarget;
}
export interface IUpdateAppStoreQRCodeRequest extends Omit<IUpdateQRCodeRequest, "mode"> {
  mode?: "dynamic";
  /** App store configuration (when type is 'appStore') */
  appStore: IQRCodeAppStoreTarget;
}
/** Without new content, only `file.fileName` may change; the stored file is kept. */
export interface IUpdateFileQRCodeRequest extends Omit<IUpdateQRCodeRequest, "mode"> {
  mode?: "dynamic";
  file?: IQRCodeFileInput;
}

/**
 * List parameters for searching QR codes
 */
export interface IListParams {
  /** Filter by QR code name */
  name?: string;
  /** Filter by QR code ID */
  qrCodeId?: string;
  /** Filter by template ID */
  templateId?: string;
  /** Filter by tag */
  tag?: string;
  /** Filter by reference ID */
  refId?: string;
  /** Filter by landing page enabled */
  isEnableLandingPage?: boolean;
  /**
   * @deprecated Never accepted by the API; ignored by this SDK and removed in 5.0.0.
   */
  isEnableMonetization?: boolean;
  /** Filter by status */
  status?: QrCodeStatusType;
  /** Filter by created from source */
  createdFrom?: string;
  /** Filter by mode (`"static"` or `"dynamic"`) */
  mode?: QRCodeMode;
}
