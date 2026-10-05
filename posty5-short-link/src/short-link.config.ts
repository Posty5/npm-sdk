/**
 * Fields `ShortLinkClient.create()` adds to every body: the link uses one of
 * the caller's own QR templates and is attributed to this SDK.
 */
export const ShortLinkCreateSourceConst = {
  templateType: "user",
  createdFrom: "npmPackage",
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
