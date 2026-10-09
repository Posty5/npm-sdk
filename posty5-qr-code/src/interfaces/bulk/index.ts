import type { ILinkBulkJobImageOptions, ILinkExportParams, ICreateLinkBulkJobInput } from "@posty5/core";
import type {
  IListParams,
  IQRCodeCallTarget,
  IQRCodeEmailTarget,
  IQRCodeGeolocationTarget,
  IQRCodeSmsTarget,
  IQRCodeUrlTarget,
  IQRCodeWifiTarget,
  IQRFreeTextTarget,
} from "../requests";
import type { QRCodeMode } from "../types/type";

/** Fields every QR bulk row may carry, whatever its type. */
export interface IQrCodeBulkRowBase {
  /** `static` when missing. Wi-Fi codes cannot be dynamic. */
  mode?: QRCodeMode;
  name?: string;
  customId?: string;
  tag?: string;
  refId?: string;
  /** Overrides `defaults.templateId`; API-key callers need one of the two. */
  templateId?: string;
  /** Image name inside a job's ZIP. */
  fileName?: string;
}

export interface IQrCodeFreeTextBulkRow extends IQrCodeBulkRowBase { type: "freeText"; target: IQRFreeTextTarget }
export interface IQrCodeEmailBulkRow extends IQrCodeBulkRowBase { type: "email"; target: IQRCodeEmailTarget }
export interface IQrCodeWifiBulkRow extends IQrCodeBulkRowBase { type: "wifi"; target: IQRCodeWifiTarget }
export interface IQrCodeCallBulkRow extends IQrCodeBulkRowBase { type: "call"; target: IQRCodeCallTarget }
export interface IQrCodeSmsBulkRow extends IQrCodeBulkRowBase { type: "sms"; target: IQRCodeSmsTarget }
export interface IQrCodeUrlBulkRow extends IQrCodeBulkRowBase { type: "url"; target: IQRCodeUrlTarget }
export interface IQrCodeGeolocationBulkRow extends IQrCodeBulkRowBase { type: "geolocation"; target: IQRCodeGeolocationTarget }

/** One row of `QRCodeClient.createMany`: a discriminated union over the QR types. */
export type IQrCodeBulkRow =
  | IQrCodeFreeTextBulkRow
  | IQrCodeEmailBulkRow
  | IQrCodeWifiBulkRow
  | IQrCodeCallBulkRow
  | IQrCodeSmsBulkRow
  | IQrCodeUrlBulkRow
  | IQrCodeGeolocationBulkRow;

/** Query of `QRCodeClient.export`: the list filters plus `format`. */
export type IQrCodeExportParams = IListParams & ILinkExportParams;

/** Input of `QRCodeClient.createBulkJob`: the shared input plus the ZIP's image options. */
export interface ICreateQrCodeBulkJobInput extends ICreateLinkBulkJobInput {
  image?: ILinkBulkJobImageOptions;
}

// Shared bulk shapes: declared once in @posty5/core, re-exported for callers of this package
export type {
  IBulkDefaults,
  IBulkRowError,
  IBulkRowResult,
  IBulkCreateResult,
  IBulkCreateOptions,
  IBulkDryRunReport,
  ICreateLinkBulkJobInput,
  ILinkBulkJob,
  ILinkBulkJobImageOptions,
  ILinkBulkJobResultUrl,
  IWaitForBulkJobOptions,
  LinkBulkJobStatus,
  LinkBulkFileFormat,
  LinkBulkImageFormat,
} from "@posty5/core";
