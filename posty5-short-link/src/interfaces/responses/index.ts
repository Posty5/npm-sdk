import { IPaginationResponse } from "@posty5/core";
import { ShortLinkStatusType } from "../../types/type";

export interface IShortLinkUser {
  _id: string;
  name: string;
  userName: string;
  fullName: string;
}

export interface IShortLinkTemplate {
  _id: string;
  name: string;
  options: any;
}

export interface IPageInfoResponse {
  title?: string;
  description?: string;
}

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
  lastVisitorDate?: string;
  createdAt?: string;
  updatedAt?: string;
  templateId?: string | IShortLinkTemplate;
  //    isEnableLandingPage?: boolean;
  isEnableMonetization?: boolean;
  pageInfo?: IPageInfoResponse;
  //  subCategory?: number;
  //category?: number;
  qrCodeLandingPageURL: string;
  qrCodeDownloadURL: string;
  //isForDeepLink?: boolean;
  //isSupportAndroidDeepUrl?: boolean;
  //isSupportIOSDeepUrl?: boolean;
  //createdFrom: string;
  /** Preview reasons (moderation scores) */
  // previewReasons?: IPreviewReason[];
}
/**
 * Preview reason (moderation score)
 */
export interface IPreviewReason {
  /** Category name */
  category: string;
  /** Score value */
  score: number;
}

export interface IShortLinkLookupItem {
  _id: string;
  name: string;
}

export type ISearchShortLinkResponse = IPaginationResponse<IShortLinkResponse>;
export type ILookupShortLinkResponse = IShortLinkLookupItem[];
export type ICreateShortLinkResponse = IShortLinkResponse;
export type IUpdateShortLinkResponse = IShortLinkResponse;
export interface IDeleteShortLinkResponse {
  message?: string;
}
