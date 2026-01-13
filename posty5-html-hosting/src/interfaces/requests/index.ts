import { HtmlHostingSourceType, HtmlHostingStatusType } from "../types/type";

/**
 * GitHub information for HTML hosting
 */
export interface IGithubInfo {
    /** GitHub file URL 
     * https://raw.githubusercontent.com/{owner}/{repo}/{commit-sha}/{path}
     * https://raw.githubusercontent.com/{owner}/{repo}/refs/heads/{branch}/{path}
     * https://github.com/{owner}/{repo}/blob/{branch-or-sha}/{path}
    */
    fileURL: string;
}







/**
 * Request interface for creating an HTML page
 */
export interface ICreateHtmlPageRequest {
    /** Page name (required) */
    name: string;
    /** Custom landing ID (optional, max 32 characters, paid plans only) */
    customLandingId?: string | null;
    /** Enable monetization flag (optional, default: false) */
    isEnableMonetization?: boolean | null;
    /** Auto-save in Google Sheet flag (optional, default: false) */
    autoSaveInGoogleSheet?: boolean | null;


    /**
     * Tag (optional)
     * Use this field to filter HTML pages by tag.
     * You can pass any custom value from your system.
     */
    tag?: string;

    /**
     * Reference ID (optional)
     * Use this field to filter HTML pages by reference ID.
     * You can pass any custom identifier from your system.
     */
    refId?: string;

}

export interface ICreateHtmlPageRequestWithFile extends ICreateHtmlPageRequest {
    fileName: string;
}

export interface ICreateHtmlPageRequestWithGithub extends ICreateHtmlPageRequest {
    githubInfo: IGithubInfo;
}




/**
 * Request interface for updating an HTML page
 */
export interface IUpdateHtmlPageRequest {
    /** Page name (required) */
    name: string;
    /** Custom landing ID (optional, max 32 characters, paid plans only) */
    customLandingId?: string | null;
    /** Enable monetization flag (optional, default: false) */
    isEnableMonetization?: boolean | null;
    /** Auto-save in Google Sheet flag (optional, default: false) */
    autoSaveInGoogleSheet?: boolean | null;
}

export interface IUpdateHtmlPageRequestWithFile extends IUpdateHtmlPageRequest {
    fileName: string;
}

export interface IUpdateHtmlPageRequestWithGithub extends IUpdateHtmlPageRequest {
    githubInfo: IGithubInfo;
}

export interface IListParams {

    name?: string;
    htmlHostingId?: string;
    /**
     * API Key ID (optional)
     * You can use this field to filter HTML pages by API key
     */
    apiKeyId?: string;
    /**
     * Tag (optional)
     * You can use this field to filter HTML pages by tag
     */
    tag?: string;
    /**
     * Reference ID (optional)
     * You can use this field to filter HTML pages by reference ID
     */
    refId?: string;
    status?: HtmlHostingStatusType;
    sourceType?: HtmlHostingSourceType,
    isEnableMonetization?: boolean;
    autoSaveInGoogleSheet?: boolean;
    isTemp?: boolean;
}

