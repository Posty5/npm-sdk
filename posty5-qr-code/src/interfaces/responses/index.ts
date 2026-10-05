import { ILinkStatisticsDailyRow, ILinkStatisticsResponse, ILinkStatisticsVisitTotals, IPaginationMeta } from "@posty5/core";
import { QrCodeStatusType } from "../types/type";
import { IQRCodePageInfo, IQRCodeTarget, IQRCodeOptions } from "../requests";

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
 * QR Code template information
 */
export interface IQRCodeTemplate {
  /** Template ID */
  _id: string;
  /** Template name */
  name?: string;
  /** Number of QR codes using this template */
  numberOfSubQrCodes?: number;
  /** Number of short links using this template */
  numberOfSubShortLinks?: number;
  /** QR code download URL */
  qrCodeDownloadURL?: string;
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
  /**
   * Visits to the code's Posty5 landing page (`qrCodeLandingPageURL`). The
   * downloaded image encodes the content directly, so scanning it opens the
   * content without reaching Posty5 and is not counted here.
   */
  numberOfVisitors?: number;
  /** Whether landing page is enabled. Included in `list()` results. */
  isEnableLandingPage?: boolean;
  name: string;
  /** Last visit to the landing page (not the last scan — see `numberOfVisitors`). */
  lastVisitorDate?: string;
  /** Reference ID */
  refId?: string;
  /** Tag */
  tag?: string;
  /**
   * @deprecated Never returned by the API; removed in 5.0.0.
   */
  isEnableMonetization?: boolean;
  /** Page information */
  pageInfo?: IQRCodePageInfo;
  /** The code's content; `list()` results include `sms.message`. */
  qrCodeTarget?: IQRCodeTarget;
  /** QR code status. Included in `list()` results. */
  status: QrCodeStatusType;
  /** Preview reasons (moderation scores) */
  previewReasons?: IPreviewReason[];
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
 * QR Code full details response (from GET by ID)
 */
export interface IQRCodeFullDetailsResponse extends IQRCode {
  /** User ID who created the QR code */
  userId?: string;
  /** Template object (populated) */
  template?: IQRCodeTemplate;
  /** Template type */
  templateType?: string;

  /** QR code styling options */
  options?: IQRCodeOptions;
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
 * Response for getting a single QR code with full details
 */
export interface IGetQRCodeResponse extends IQRCodeFullDetailsResponse {}

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

/** `totals` of `statistics()`. */
export interface IQRCodeStatisticsTotals extends ILinkStatisticsVisitTotals {
  /** QR codes you own (lifetime, deleted ones excluded) */
  totalQRCodes: number;
  /** Lifetime visit counter of the codes' Posty5 pages, summed */
  totalVisitors: number;
  /** `totalVisitors / totalQRCodes` (0 with no codes) */
  avgVisitorsPerQRCode: number;
}

/** One row of `topQRCodes`: a code whose Posty5 page had visits in the range. */
export interface IQRCodeStatisticsTopCode {
  _id: string;
  name?: string;
  /** Lifetime visit counter */
  numberOfVisitors?: number;
  createdAt: string;
  /** Visits by people in the range */
  visitsInRange: number;
}

/** `data` of `statistics()`. */
export interface IQRCodeStatisticsData {
  totals: IQRCodeStatisticsTotals;
  /** One row per UTC day that had a code created or a visit */
  daily: ILinkStatisticsDailyRow[];
  /** Up to ten codes with the most visits in the range; codes with none are left out */
  topQRCodes: IQRCodeStatisticsTopCode[];
}

export type IQRCodeStatisticsResponse = ILinkStatisticsResponse<IQRCodeStatisticsData>;
