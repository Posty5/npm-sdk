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
    name?: string;
    tag?: string;
    refId?: string;
    shortLinkId?: string;
    status?: string;
    createdFrom?: string;
    userId?: string;
    templateId?: string;
    apiKeyId?: string;
    isForDeepLink?: boolean;
    isSupportAndroidDeepUrl?: boolean;
    isSupportIOSDeepUrl?: boolean;
    isEnableMonetization?: boolean;
    isEnableLandingPage?: boolean;
}
