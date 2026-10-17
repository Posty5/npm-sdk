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

/** Sub-paths of the bulk create and export routes under `/api/qr-code`. */
export const QrCodeBulkPathsConst = {
  bulk: "/bulk",
  export: "/export",
} as const;

/** Sub-paths of the render, export-link and scannability routes under `/api/qr-code`. */
export const QrCodeRenderPathsConst = {
  render: "/render",
  exportUrl: "/export-url",
  scannabilityCheck: "/scannability-check",
} as const;

/** Sub-paths of the design routes under `/api/qr-code-template`. */
export const QrCodeTemplatePathsConst = {
  render: "/render",
  designCatalogue: "/design-catalogue",
  logoUploadUrl: "/logo-upload-url",
} as const;

/** Value sent as `?download=` when `render` is asked for an attachment (the API accepts any value). */
export const QrRenderDownloadFlagConst = "1";
