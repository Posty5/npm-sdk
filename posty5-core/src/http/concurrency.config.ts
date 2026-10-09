/** The HTTP precondition header carrying a document's version (D-5). */
export const IF_MATCH_HEADER = "If-Match";

/** Report-mode response header (removed with report mode, rollout phase F). */
export const CONCURRENCY_REPORT_HEADER = "X-Posty5-Concurrency";

/** Its value when a versioned write arrived without a version. */
export const CONCURRENCY_REPORT_MISSING_VERSION = "missing-version";

/** Error codes the API puts in the body (D-6). */
export const VERSION_CONFLICT_CODE = "VERSION_CONFLICT";
export const VERSION_REQUIRED_CODE = "VERSION_REQUIRED";

/** Statuses never retried automatically: the caller decides. */
export const NON_RETRYABLE_VERSION_STATUSES = [409, 428];
