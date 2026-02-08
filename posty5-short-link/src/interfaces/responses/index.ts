import { IPaginationResponse } from "@posty5/core";
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
  status: ShortLinkStatusType;
  refId?: string;
  tag?: string;
  numberOfVisitors: number;
  numberOfReports?: number;
  lastVisitorDate?: string;
  createdAt?: string;
  updatedAt?: string;
  templateId?: string;
  qrCodeTemplateName?: string;
  isEnableLandingPage?: boolean;
  isEnableMonetization?: boolean;
  pageInfo?: IPageInfoResponse;
  qrCodeLandingPageURL: string;
  qrCodeDownloadURL: string;
}

/**
 * Short link full details response (from GET by ID)
 */
export interface IShortLinkFullDetailsResponse extends IShortLinkResponse {
  androidUrl?: string;
  iosUrl?: string;
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
export type ICreateShortLinkResponse = IShortLinkResponse;
export type IUpdateShortLinkResponse = IShortLinkResponse;
export type IGetShortLinkResponse = IShortLinkFullDetailsResponse;
export interface IDeleteShortLinkResponse {
  message: string;
}
