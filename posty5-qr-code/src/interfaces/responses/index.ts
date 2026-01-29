import { IPaginationMeta } from "@posty5/core";
import { QrCodeStatusType } from "../types/type";
import { IQRCodePageInfo, IQRCodeTarget } from "../requests";

/**
 * Preview reason (moderation score)
 */
export interface IPreviewReason {
  /** Category name */
  category: string;
  /** Score value */
  score: number;
}

/**
 * QR Code response interface
 */
export interface IQRCode {
  /** QR code database ID */
  _id: string;
  /** QR code unique identifier */
  qrCodeId: string;
  /** Template ID used */
  templateId?: string;
  /** Number of visitors */
  numberOfVisitors?: number;
  name: string;
  /** Last visitor date */
  lastVisitorDate?: string;
  /** Reference ID */
  refId?: string;
  /** Tag */
  tag?: string;
  isEnableMonetization?: boolean;
  /** Page information */
  pageInfo?: IQRCodePageInfo;
  qrCodeTarget?: IQRCodeTarget;
  /** QR code status */
  status: QrCodeStatusType;
  /** Preview reasons (moderation scores) */
  // previewReasons?: IPreviewReason[];
  /** Created at timestamp */
  createdAt?: string;
  /** Updated at timestamp */
  updatedAt?: string;
  /** QR code landing page URL */
  qrCodeLandingPageURL?: string;
  /** Shorter link URL */
  qrCodeDownloadURL?: string;
}

/**
 * Response for creating a QR code
 */
export interface ICreateQRCodeResponse extends IQRCode {}

/**
 * Response for updating a QR code
 */
export interface IUpdateQRCodeResponse extends IQRCode {}

/**
 * Response for getting a single QR code
 */
export interface IGetQRCodeResponse extends IQRCode {}

/**
 * Response for deleting a QR code
 */
export interface IDeleteQRCodeResponse {
  /** Success message */
  message: string;
}

// /**
//  * Search QR codes response with pagination
//  */
// export interface ISearchQRCodesResponse {
//     /** Array of QR codes */
//     data: IQRCode[];
//     /** Pagination metadata */
//     pagination: IPaginationMeta;
// }

/**
 * Lookup item for QR code selection
 */
export interface IQRCodeLookupItem {
  /** QR code ID */
  _id: string;
  /** Display name (format: "qrCodeId - name") */
  name: string;
}

/**
 * Response for QR code lookup
 */
export interface ILookupQRCodesResponse extends Array<IQRCodeLookupItem> {}
