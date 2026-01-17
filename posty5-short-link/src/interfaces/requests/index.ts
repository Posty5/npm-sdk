export interface IPageInfo {
    title?: string;
    description?: string;
    descriptionIsHtmlFile?: boolean;
}

export interface ICreateShortLinkRequest {
    name?: string | null;
    baseUrl: string;
    refId?: string | null;
    tag?: string | null;
    templateId?: string | null;
    customLandingId?: string | null;
    isEnableMonetization?: boolean | null;
    pageInfo?: IPageInfo;
}

export interface IUpdateShortLinkRequest {
    name?: string | null;
    baseUrl: string;
    refId?: string | null;
    tag?: string | null;
    templateId?: string | null;
    templateType?: string | null;
    recaptcha?: string | null;
    isEnableLandingPage?: boolean | null;
    isEnableMonetization?: boolean | null;
    pageInfo?: IPageInfo;
    subCategory?: number | null;
    createdFrom?: string | null;
}

export interface IListParams {

    /** Enter Part Or Full URL To Search */
    baseUrl?: string;
    /** Enter Name To Search */
    name?: string;
    /** Enter Page Title To Search */
    "pageinfo.title"?: string;
    createdFrom?: string;
    shortLinkId?: string;
    refId?: string;
    tag?: string;
    templateId?: string;
    apiKeyId?: string;
    status?: string;
    isForDeepLink?: boolean;
    isEnableMonetization?: boolean;
}
