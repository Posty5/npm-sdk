import { ILinkStatisticsDailyRow, ILinkStatisticsResponse, ILinkStatisticsVisitTotals, IPaginationResponse } from "@posty5/core";
import { ShortLinkStatusType } from "../../types/type";

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
  _id: string;
  name?: string;
  numberOfSubQrCodes?: number;
  numberOfSubShortLinks?: number;
  qrCodeDownloadURL?: string;
}

/**
 * Short link metadata information
 */
export interface IShortLinkMetaData {
  image?: string;
  title?: string;
  description?: string;
}

export interface IPageInfoResponse {
  title?: string;
  description?: string;
}

/**
 * Short link response interface
 */
export interface IShortLinkResponse {
  _id: string;
  shorterLink: string;
  shortLinkId: string;
  name?: string;
  baseUrl?: string;
  /** Review status. Included in `list()` results. */
  status: ShortLinkStatusType;
  refId?: string;
  tag?: string;
  /** Visits to the short link. Included in `list()` results. */
  numberOfVisitors: number;
  numberOfReports?: number;
  lastVisitorDate?: string;
  createdAt?: string;
  updatedAt?: string;
  templateId?: string;
  qrCodeTemplateName?: string;
  /** Whether visitors see the interstitial page first. Included in `list()` results. */
  isEnableLandingPage?: boolean;
  /**
   * @deprecated Never returned by the API; removed in 5.0.0.
   */
  isEnableMonetization?: boolean;
  pageInfo?: IPageInfoResponse;
  qrCodeLandingPageURL: string;
  qrCodeDownloadURL: string;
}

/**
 * Short link full details: what `get()`, `create()` and `update()` return to
 * the link's owner.
 */
export interface IShortLinkFullDetailsResponse extends IShortLinkResponse {
  /** Android destination (deep link); empty when none. Not included in `list()` results. */
  androidUrl?: string;
  /** iOS destination (deep link); empty when none. Not included in `list()` results. */
  iosUrl?: string;
  /** Always equals `!!androidUrl`. */
  isSupportAndroidDeepUrl?: boolean;
  /** Always equals `!!iosUrl`. */
  isSupportIOSDeepUrl?: boolean;
  numberOfCreated?: number;
  templateType?: string;
  template?: IQRCodeTemplate;
  userId?: string;
  linkMetaData?: IShortLinkMetaData;
}

export interface IShortLinkLookupItem {
  _id: string;
  name: string;
}

export type ISearchShortLinkResponse = IPaginationResponse<IShortLinkResponse>;
export type ILookupShortLinkResponse = IShortLinkLookupItem[];
export type ICreateShortLinkResponse = IShortLinkFullDetailsResponse;
export type IUpdateShortLinkResponse = IShortLinkFullDetailsResponse;
export type IGetShortLinkResponse = IShortLinkFullDetailsResponse;
export interface IDeleteShortLinkResponse {
  message: string;
}

/** `totals` of `statistics()`. */
export interface IShortLinkStatisticsTotals extends ILinkStatisticsVisitTotals {
  /** Links you own (lifetime, deleted ones excluded) */
  totalLinks: number;
  /** Lifetime visit counter summed over your links; includes visits from before visit analytics launched */
  totalVisitors: number;
  /** `totalVisitors / totalLinks` (0 with no links) */
  avgVisitorsPerLink: number;
}

/** One row of `topLinks`: a link with visits in the range. */
export interface IShortLinkStatisticsTopLink {
  _id: string;
  name?: string;
  baseUrl: string;
  shortLinkId: string;
  /** Lifetime visit counter */
  numberOfVisitors?: number;
  createdAt: string;
  /** Visits by people in the range */
  visitsInRange: number;
}

/** `data` of `statistics()`. */
export interface IShortLinkStatisticsData {
  totals: IShortLinkStatisticsTotals;
  /** One row per UTC day that had a link created or a visit */
  daily: ILinkStatisticsDailyRow[];
  /** Up to ten links with the most visits in the range; links with none are left out */
  topLinks: IShortLinkStatisticsTopLink[];
}

export type IShortLinkStatisticsResponse = ILinkStatisticsResponse<IShortLinkStatisticsData>;
