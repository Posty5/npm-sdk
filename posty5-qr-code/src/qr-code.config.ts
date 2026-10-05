/**
 * Fields `QRCodeClient` adds to every create and update body: the code uses
 * one of the caller's own templates. `createdFrom` is added next to it from
 * `HttpClient.createdFrom` (configurable, default `npmPackage`).
 */
export const QrCodeRequestSourceConst = {
  templateType: "user",
} as const;

/**
 * Request keys the API never accepted — its Joi schema rejects an unknown key
 * with "Please Enter Full Information". They stay in the types as
 * `@deprecated` so existing code compiles, and the client deletes them from
 * every body and query string. Removed from the types in 5.0.0.
 */
export const QrCodeDeprecatedRequestKeysConst = ["isEnableMonetization"] as const;
