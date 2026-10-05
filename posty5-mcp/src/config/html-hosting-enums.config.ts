import type { HtmlHostingSourceType, HtmlHostingStatusType } from "@posty5/html-hosting";
import type { IFormStatusType } from "@posty5/html-hosting-form-submission";

/**
 * Closed value lists the html-hosting tools accept, mirrored from the SDK
 * unions — `satisfies` fails the build if a value leaves the SDK's union.
 */

export const HTML_PAGE_STATUSES = ["new", "pending", "rejected", "approved", "fileIsNotFound"] as const satisfies readonly HtmlHostingStatusType[];

export const HTML_PAGE_SOURCE_TYPES = ["file", "github"] as const satisfies readonly HtmlHostingSourceType[];

export const FORM_SUBMISSION_STATUSES = [
  "new",
  "pendingReview",
  "inProgress",
  "onHold",
  "needMoreInfo",
  "approved",
  "partiallyApproved",
  "rejected",
  "completed",
  "archived",
  "cancelled",
] as const satisfies readonly IFormStatusType[];

/** Every HTML variable key starts with this; the SDK refuses any other key. */
export const HTML_VARIABLE_KEY_PREFIX = "pst5_";

/** The file an inline `html` argument is uploaded as. */
export const INLINE_HTML_FILE_NAME = "index.html";

/** Content type of the uploaded inline HTML file. */
export const INLINE_HTML_CONTENT_TYPE = "text/html";
