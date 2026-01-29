import { IPaginationParams } from "@posty5/core";
import { QrCodeStatusType, QrCodeTargetType } from "../types/type";

/**
 * QR Code page information
 */
export interface IQRCodePageInfo {
  /** Page title */
  title?: string;
  /** Page description */
  description?: string;
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
  /** Target URL */
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
  /** Geolocation configuration (when type is 'geolocation') */
  geolocation?: IQRCodeGeolocationTarget;
}

/**
 * Base request interface for creating/updating QR codes
 */
export interface IQRCodeRequest {
  /** QR code name (optional) */
  name?: string;
  /** Template ID */
  templateId: string;
  /** Reference ID (optional) - custom identifier from your system */
  refId?: string;
  /** Tag (optional) - custom tag for filtering */
  tag?: string;
  /** Custom landing page ID (optional, max 32 chars) */
  customLandingId?: string;
  /** Enable monetization (default: false) */
  isEnableMonetization?: boolean;
  /** Page information (required when monetization is enabled) */
  pageInfo?: IQRCodePageInfo;
}

export interface ICreateFreeTextQRCodeRequest extends IQRCodeRequest {
  /** QR code text */
  text: string;
}
export interface ICreateEmailQRCodeRequest extends IQRCodeRequest {
  /** Email configuration (when type is 'email') */
  email: IQRCodeEmailTarget;
}
export interface ICreateWifiQRCodeRequest extends IQRCodeRequest {
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
export interface IUpdateWifiQRCodeRequest extends IUpdateQRCodeRequest {
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
  //isEnableLandingPage?: boolean;
  /** Filter by monetization enabled */
  isEnableMonetization?: boolean;
  /** Filter by status */
  status?: QrCodeStatusType;
  /** Filter by created from source */
  createdFrom?: string;
}
