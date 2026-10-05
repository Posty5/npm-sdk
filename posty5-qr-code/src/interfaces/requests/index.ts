import { IPaginationParams } from "@posty5/core";
import { IQRCodeAccess, QRCodeMode, QrCodeStatusType, QrCodeTargetType } from "../types/type";

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
