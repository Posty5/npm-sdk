import { ILinkAccessInput, ILinkHealthInput, ILinkPixel, ILinkRoutingRule, ILinkUtm, ILinkVariant } from './link-rules';

export * from './link-rules';
export * from './link-campaign';

/**
 * Content of the interstitial page a visitor sees when `isEnableLandingPage`
 * is true (instead of being redirected straight to `baseUrl`).
 */
export interface IPageInfo {
    /** Page title. Required when `isEnableLandingPage` is true. */
    title?: string;
    /** Page description. Required when `isEnableLandingPage` is true. */
    description?: string;
    descriptionIsHtmlFile?: boolean;
}

export interface ICreateShortLinkRequest {
    name?: string | null;
    /**
     * Destination URL. Must start with `http://` or `https://`; anything else is
     * refused with "The URL must start with http:// or https://".
     */
    baseUrl: string;
    refId?: string | null;
    /**
     * @deprecated Use `tags`. The API treats it as `tags[0]`; when both are
     * sent, `tags` wins.
     */
    tag?: string | null;
    /** ≤ 10 tags, each 1 – 40 chars, unique case-insensitively. `null` / `[]` removes them. */
    tags?: string[] | null;
    /** Campaign (24-hex id) the link belongs to; `""` / `null` detaches. Feature key `urlShortener.campaigns`. */
    campaignId?: string | null;
    /** Start / stop / visit limit / password. On update merged field by field. */
    access?: ILinkAccessInput | null;
    /** ≤ 20 ordered routing rules; omitted keeps, `null` / `[]` clears. */
    routing?: ILinkRoutingRule[] | null;
    /** 0 or 2 – 5 A/B variants; omitted keeps, `null` / `[]` clears. */
    variants?: ILinkVariant[] | null;
    /** UTM parameters. Feature key `urlShortener.utmBuilder`. */
    utm?: ILinkUtm | null;
    /** ≤ 5 retargeting pixels, one per provider. Feature key `urlShortener.retargetingPixels`. */
    pixels?: ILinkPixel[] | null;
    /** Must be `true` when pixels are first set (lawful-basis attestation). */
    pixelsConsentAcknowledged?: boolean;
    /** Destination health monitoring. Feature key `healthMonitor`. */
    health?: ILinkHealthInput;
    /**
     * QR code template the link's QR image is rendered with.
     *
     * Required when calling with an API key — every SDK call does; the API
     * refuses a create without it. Pick one of your templates on the
     * dashboard templates page (https://studio.posty5.com/qr-code-templates).
     */
    templateId: string;
    customLandingId?: string | null;
    /**
     * Show an interstitial page with `pageInfo.title` and `pageInfo.description`
     * before the redirect. Default `false` (direct redirect).
     */
    isEnableLandingPage?: boolean;
    /**
     * Android destination (deep link) opened instead of `baseUrl` on Android.
     *
     * - Allowed schemes: `https:`, `http:` or an app scheme matching
     *   `^[a-z][a-z0-9+.-]*:` — never `javascript:`, `data:`, `vbscript:`,
     *   `file:`, `about:`, `blob:` ("The deep link URL is not allowed").
     *   Blocked-extension and phishing checks apply to http(s) values exactly
     *   as to `baseUrl`.
     * - Create: a supplied value wins; an empty/absent value falls back to the
     *   target page's `al:*` meta.
     * - `isSupportAndroidDeepUrl` always equals `!!androidUrl`.
     */
    androidUrl?: string | null;
    /**
     * iOS destination (deep link) opened instead of `baseUrl` on iOS.
     *
     * - Allowed schemes: `https:`, `http:` or an app scheme matching
     *   `^[a-z][a-z0-9+.-]*:` — never `javascript:`, `data:`, `vbscript:`,
     *   `file:`, `about:`, `blob:` ("The deep link URL is not allowed").
     *   Blocked-extension and phishing checks apply to http(s) values exactly
     *   as to `baseUrl`.
     * - Create: a supplied value wins; an empty/absent value falls back to the
     *   target page's `al:*` meta.
     * - `isSupportIOSDeepUrl` always equals `!!iosUrl`.
     */
    iosUrl?: string | null;
    /**
     * @deprecated Never accepted by the API; ignored by this SDK and removed in 5.0.0.
     */
    isEnableMonetization?: boolean | null;
    /** Landing-page content; title and description are required when `isEnableLandingPage` is true. */
    pageInfo?: IPageInfo;
}

export interface IUpdateShortLinkRequest {
    name?: string | null;
    /**
     * Destination URL. Must start with `http://` or `https://`; anything else is
     * refused with "The URL must start with http:// or https://".
     */
    baseUrl: string;
    refId?: string | null;
    /**
     * @deprecated Use `tags`. The API treats it as `tags[0]`; when both are
     * sent, `tags` wins.
     */
    tag?: string | null;
    /** ≤ 10 tags, each 1 – 40 chars, unique case-insensitively. `null` / `[]` removes them. */
    tags?: string[] | null;
    /** Campaign (24-hex id) the link belongs to; `""` / `null` detaches. Feature key `urlShortener.campaigns`. */
    campaignId?: string | null;
    /** Start / stop / visit limit / password. On update merged field by field. */
    access?: ILinkAccessInput | null;
    /** ≤ 20 ordered routing rules; omitted keeps, `null` / `[]` clears. */
    routing?: ILinkRoutingRule[] | null;
    /** 0 or 2 – 5 A/B variants; omitted keeps, `null` / `[]` clears. */
    variants?: ILinkVariant[] | null;
    /** UTM parameters. Feature key `urlShortener.utmBuilder`. */
    utm?: ILinkUtm | null;
    /** ≤ 5 retargeting pixels, one per provider. Feature key `urlShortener.retargetingPixels`. */
    pixels?: ILinkPixel[] | null;
    /** Must be `true` when pixels are first set (lawful-basis attestation). */
    pixelsConsentAcknowledged?: boolean;
    /** Destination health monitoring. Feature key `healthMonitor`. */
    health?: ILinkHealthInput;
    /**
     * QR code template the link's QR image is rendered with.
     *
     * Required when calling with an API key — every SDK call does; the API
     * refuses an update without it. Pick one of your templates on the
     * dashboard templates page (https://studio.posty5.com/qr-code-templates).
     */
    templateId: string;
    templateType?: string | null;
    recaptcha?: string | null;
    /**
     * Show an interstitial page before the redirect. Omit it to keep the stored
     * value; `pageInfo.title` and `pageInfo.description` are required when the
     * effective value is true.
     */
    isEnableLandingPage?: boolean | null;
    /**
     * Android destination (deep link).
     *
     * - Allowed schemes: `https:`, `http:` or an app scheme matching
     *   `^[a-z][a-z0-9+.-]*:` — never `javascript:`, `data:`, `vbscript:`,
     *   `file:`, `about:`, `blob:` ("The deep link URL is not allowed").
     *   Blocked-extension and phishing checks apply to http(s) values exactly
     *   as to `baseUrl`.
     * - Update: key present → that value (`""`/`null` clears it); key absent and
     *   `baseUrl` changed → re-derived from the new target's meta; key absent
     *   and `baseUrl` unchanged → stored value kept.
     * - `isSupportAndroidDeepUrl` always equals `!!androidUrl`.
     */
    androidUrl?: string | null;
    /**
     * iOS destination (deep link).
     *
     * - Allowed schemes: `https:`, `http:` or an app scheme matching
     *   `^[a-z][a-z0-9+.-]*:` — never `javascript:`, `data:`, `vbscript:`,
     *   `file:`, `about:`, `blob:` ("The deep link URL is not allowed").
     *   Blocked-extension and phishing checks apply to http(s) values exactly
     *   as to `baseUrl`.
     * - Update: key present → that value (`""`/`null` clears it); key absent and
     *   `baseUrl` changed → re-derived from the new target's meta; key absent
     *   and `baseUrl` unchanged → stored value kept.
     * - `isSupportIOSDeepUrl` always equals `!!iosUrl`.
     */
    iosUrl?: string | null;
    /**
     * @deprecated Never accepted by the API; ignored by this SDK and removed in 5.0.0.
     */
    isEnableMonetization?: boolean | null;
    /** Landing-page content; title and description are required when the landing page is on. */
    pageInfo?: IPageInfo;
    subCategory?: number | null;
    createdFrom?: string | null;
}

export interface IListParams {

    /** Enter Part Or Full URL To Search */
    baseUrl?: string;
    /** Enter Name To Search */
    name?: string;
    /** Landing-page title to search for (partial match). */
    "pageInfo.title"?: string;
    /**
     * @deprecated Use `"pageInfo.title"`. This key never matched the stored
     * field; `list()` sends it as `"pageInfo.title"`. Removed in 5.0.0.
     */
    "pageinfo.title"?: string;
    createdFrom?: string;
    shortLinkId?: string;
    refId?: string;
    /** @deprecated Use `tags`. */
    tag?: string;
    /** Links carrying every one of these tags (sent comma-joined). */
    tags?: string[];
    /** Links of this campaign (24-hex id). */
    campaignId?: string;
    templateId?: string;
    status?: string;
    isForDeepLink?: boolean;
    /** Only links whose landing page is on (`true`) or off (`false`). */
    isEnableLandingPage?: boolean;
    /**
     * @deprecated Never accepted by the API; ignored by this SDK and removed in 5.0.0.
     */
    isEnableMonetization?: boolean;
}
