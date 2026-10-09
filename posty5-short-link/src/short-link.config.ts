/**
 * Fields `ShortLinkClient.create()` adds to every body: the link uses one of
 * the caller's own QR templates. `createdFrom` is added next to it from
 * `HttpClient.createdFrom` (configurable, default `npmPackage`).
 */
export const ShortLinkCreateSourceConst = {
  templateType: "user",
} as const;

/**
 * Request keys the API never accepted — its Joi schema rejects an unknown key
 * with "Please Enter Full Information". They stay in the types as
 * `@deprecated` so existing code compiles, and the client deletes them from
 * every body and query string. Removed from the types in 5.0.0.
 */
export const ShortLinkDeprecatedRequestKeysConst = ["isEnableMonetization"] as const;

/**
 * Legacy list-filter keys mapped to the key the API filters on.
 * `pageinfo.title` (lower-case `i`) never matched the stored `pageInfo.title`.
 */
export const ShortLinkLegacyListKeysConst = {
  "pageinfo.title": "pageInfo.title",
} as const;

/** Sub-paths of the bulk create and export routes under `/api/short-link`. */
export const ShortLinkBulkPathsConst = {
  bulk: "/bulk",
  export: "/export",
} as const;

/** Sub-paths of the short link controls routes under `/api/short-link`. */
export const ShortLinkControlsPathsConst = {
  tags: "/tags",
  healthCheck: "/health-check",
} as const;

/** Separator of `?tags=a,b` on `list()` / `export()`. */
export const ShortLinkTagsQuerySeparatorConst = ",";

/** Base path of the link campaign routes. */
export const LinkCampaignBasePathConst = "/api/link-campaign";
