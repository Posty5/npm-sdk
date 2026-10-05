import type { QrCodeType } from "../config/qr-codes-enums.config";

/**
 * The flat, type-discriminated target arguments of `qr_code_create` /
 * `qr_code_update`. Which fields a type needs is `QR_CODE_REQUIRED_FIELDS`.
 */
export interface IQrCodeTargetArgs {
  type: QrCodeType;
  /** freeText */
  text?: string;
  /** email */
  email?: string;
  emailSubject?: string;
  emailBody?: string;
  /** wifi */
  wifiName?: string;
  wifiAuthenticationType?: string;
  wifiPassword?: string;
  /** call, sms */
  phoneNumber?: string;
  /** sms */
  smsMessage?: string;
  /** url */
  url?: string;
  /** geolocation */
  latitude?: number;
  longitude?: number;
}

/** The per-row label fields of `qr_code_create_many`. */
export interface IQrBulkRowLabels {
  name?: string;
  customId?: string;
  tag?: string;
  refId?: string;
  templateId?: string;
  fileName?: string;
}
