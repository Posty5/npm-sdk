import type { IQRCodeAppStoreTarget, IQRCodeEventTarget, IQRCodeReviewTarget, IQRCodeSocialTarget, IQRCodeVCardTarget, IQRCodeWhatsappTarget, QrCodeFileMimeType } from "@posty5/qr-code";
import type { QrCodeBulkType, QrCodeType } from "../config/qr-codes-enums.config";

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
  /** vcard */
  vcard?: IQRCodeVCardTarget;
  /** event */
  event?: IQRCodeEventTarget;
  /** whatsapp */
  whatsapp?: IQRCodeWhatsappTarget;
  /** review */
  review?: IQRCodeReviewTarget;
  /** social */
  social?: IQRCodeSocialTarget;
  /** appStore */
  appStore?: IQRCodeAppStoreTarget;
  /** file: the content as base64 (a `data:<mime>;base64,` prefix is stripped) */
  fileBase64?: string;
  /** file: display name */
  fileName?: string;
  /** file */
  mimeType?: QrCodeFileMimeType;
}

/** A `qr_code_create_many` row's target: the bulk route's types only. */
export interface IQrBulkTargetArgs extends Omit<IQrCodeTargetArgs, "type"> {
  type: QrCodeBulkType;
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
