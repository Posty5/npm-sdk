/** Closed value lists the short-link tools accept, mirrored from the SDK unions (`ShortLinkStatusType` is not exported). */
export const SHORT_LINK_STATUSES = ["new", "pending", "rejected", "approved", "fileIsNotFound"] as const;

/**
 * Short link controls value lists, mirrored from the `@posty5/short-link` 4.6.0
 * unions (`LinkDeviceType`, `LinkOsFamily`, `LinkPixelProvider`,
 * `LinkCampaignColor`) — the SDK exports them as types only, not as values.
 * Checked against the API's Joi (`@posty5/shared/shared-area/link-rules/config.ts`).
 */
export const LINK_DEVICE_TYPES = ["tablet", "mobile", "desktop", "other"] as const;
export const LINK_OS_FAMILIES = ["android", "ios", "windows", "macos", "linux"] as const;
export const LINK_PIXEL_PROVIDERS = ["meta", "googleAds", "tiktok", "linkedin", "x", "pinterest"] as const;
export const LINK_CAMPAIGN_COLORS = ["slate", "red", "orange", "amber", "green", "teal", "blue", "indigo", "purple", "pink"] as const;
