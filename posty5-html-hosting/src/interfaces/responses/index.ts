import { IPaginationResponse } from '@posty5/core';
import { HtmlHostingSourceType, HtmlHostingStatusType } from '../types/type';

/**
 * GitHub information in response
 */
export interface IGithubInfoResponse {
    /** GitHub file URL */
    fileURL: string;
    /** Final raw file URL (computed) */
    finalFileRawURL?: string;
}

/**
 * Form submission data
 */
export interface IFormSubmissionData {
    /** Last form submission date */
    lasFormSubmissionAt?: string;
    /** Number of form submissions */
    numberOfFormSubmission: number;
}

/**
 * Preview reason
 */
export interface IPreviewReason {
    /** Reason key */
    key: string;
    /** Reason value/score */
    value: number;
}

/**
 * HTML page response
 */
export interface IHtmlPageResponse {
    /** Page ID */
    _id: string;
    /** HTML hosting ID (short code) */
    htmlHostingId: string;
    /** Page name */
    name?: string;
    /** Page path (SEO-friendly path) */
    pagePath?: string;
    /** Last visitor date */
    lastVisitorDate?: string;
    /** Number of visitors */
    numberOfVisitors: number;
    /** Number of reports */
    // numberOfReports: number;
    /** Created date */
    createdAt: string;
    /** Updated date */
    updatedAt?: string;
    /** Owner user ID */
    user: string;
    /** Template ID */
    // templateId?: string;
    /** Template name */
    // qrCodeTemplateName?: string;
    /** Enable monetization flag */
    isEnableMonetization?: boolean;
    /** Auto-save in Google Sheet flag */
    autoSaveInGoogleSheet?: boolean;
    /** Is temporary page */
    isTemp: boolean;
    /** Page status */
    status: HtmlHostingStatusType;
    /** Preview reasons (moderation scores) */
    previewReasons?: IPreviewReason[];
    /** Is cached in local storage */
    isCachedInLocalStorage: boolean;
    /** Source type: "file" or "github" */
    sourceType?: HtmlHostingSourceType;
    /** Form submission data */
    formSubmission?: IFormSubmissionData;
    /** QR code landing page URL */
    // qrCodeLandingPage: string;
    /** QR code download URL */
    // qrCodeDownloadURL: string;
    /** Shorter link URL */
    shorterLink: string;
    /** Long link URL (with SEO path) */
    // longLink: string;
    /** File URL (R2 storage) */
    fileUrl?: string;
    /** GitHub information (when sourceType is "github") */
    githubInfo?: IGithubInfoResponse;
    /** File name (when sourceType is "file") */
    fileName?: string;
    /** Sub-category ID */
    // subCategory?: number;
    /** Category ID */
    // category?: number;
    /** Preview scores */
    // previewScores?: any[];
    /** Status history grouped */
    // statusHistoryGrouped?: any[];
    /** Template details (populated) */
    // template?: any;
}

/**
 * HTML page lookup item (simplified)
 */
export interface IHtmlPageLookupItem {
    /** Page ID */
    _id: string;
    /** Page name */
    name: string;
    /** HTML hosting ID */
    htmlHostingId: string;
}

/**
 * Form lookup item
 */
export interface IFormLookupItem {
    /** Form internal ID */
    _id: string;
    /** Form ID */
    formId: string;
    /** Form fields */
    formFields: string[];
}

/**
 * GitHub file proxy response
 */
export interface IGithubFileProxyResponse {
    /** File content */
    content: string;
    /** File encoding */
    encoding?: string;
}

/**
 * File content response
 */
export interface IFileContentResponse {
    /** File content */
    content: string;
    /** Content type */
    contentType?: string;
}

/**
 * Search HTML pages response
 */
export type ISearchHtmlPagesResponse = IPaginationResponse<IHtmlPageResponse>;

/**
 * Lookup HTML pages response
 */
export type ILookupHtmlPagesResponse = IHtmlPageLookupItem[];

/**
 * Lookup forms response
 */
export type ILookupFormsResponse = IFormLookupItem[];

/**
 * AWS S3 upload configuration
 */
export interface IUploadFileConfig {
    /** Pre-signed URL for uploading */
     uploadUrl: string;
    /** Form fields for the upload */
    // fields: Record<string, string>;
}

/**
 * Create HTML page response (returns uploadFileConfig + details)
 */
export interface ICreateHtmlPageResponse {
    /** Upload configuration for AWS S3 */
    uplaodFileConfig: IUploadFileConfig;
    /** HTML page details */
    details: IHtmlPageResponse;
}

/**
 * Update HTML page response (returns uploadFileConfig + details when isNewFile=true)
 */
export interface IUpdateHtmlPageResponse {
    /** Upload configuration for AWS S3 (only when isNewFile=true) */
    uplaodFileConfig: IUploadFileConfig | null;
    /** HTML page details */
    details: IHtmlPageResponse;
}

/**
 * Delete response (simple message response)
 */
export interface IDeleteHtmlPageResponse {
    /** Success message */
    message?: string;
}

/**
 * Publish response (simple message response)
 */
export interface IPublishHtmlPageResponse {
    /** Success message */
    message?: string;
}

/**
 * Clean cache response (simple message response)
 */
export interface ICleanCacheResponse {
    /** Success message */
    message?: string;
}



export interface IHtmlPageCreateWithFileResponse {
    _id: string;
    shorterLink: string;
    fileUrl: string;
}

export interface IHtmlPageCreateWithGithubResponse {
    _id: string;
    shorterLink: string;
    githubInfo: IGithubInfoResponse;
}
