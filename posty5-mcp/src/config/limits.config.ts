/** Largest `pageSize` a list tool accepts — a model reading 500 rows helps nobody. */
export const MAX_PAGE_SIZE = 50;

/** Largest inline HTML body `html_page_create_from_html` / `_update_from_html` accept, in bytes. */
export const INLINE_HTML_MAX_BYTES = 1024 * 1024;

/** Largest tool result text, in bytes; past it the result says how to narrow the request. */
export const RESULT_MAX_BYTES = 256 * 1024;

/** Most products one `store_product_bulk_create` call may carry. */
export const BULK_CREATE_MAX_ITEMS = 50;

/** How long a write's result is remembered under its idempotency key, in milliseconds. */
export const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

/** How long a running write holds its idempotency key before a retry may run it again, in milliseconds. */
export const IDEMPOTENCY_LOCK_TTL_MS = 2 * 60 * 1000;

/** How long a client may cache `tools/list` (the list depends only on the connection's access and toolsets). */
export const TOOLS_LIST_CACHE_TTL_MS = 5 * 60 * 1000;

/** Most idempotency results the in-process store keeps before forgetting the oldest. */
export const MEMORY_IDEMPOTENCY_MAX_ENTRIES = 1000;

/** Length bounds of an `idempotencyKey`. */
export const IDEMPOTENCY_KEY_MIN_LENGTH = 8;
export const IDEMPOTENCY_KEY_MAX_LENGTH = 128;

/** Result fields never handed to a model: bulky, binary, or secret-shaped. */
export const STRIPPED_RESULT_FIELDS = ["uploadFileConfig", "uploadImageConfig", "uploadUrl", "htmlContent", "fileBase64", "data:image"];

/** Most rows one `short_link_create_many` / `qr_code_create_many` call may carry (BW-D12); bigger batches are a dashboard file upload. */
export const MCP_BULK_MAX_ROWS = 25;

/** How long `qr_code_create_many` with `zip: true` waits for its bulk job before handing back the job id, in milliseconds. */
export const MCP_BULK_JOB_WAIT_MS = 45 * 1000;

/** How often that wait polls the job, in milliseconds. */
export const MCP_BULK_JOB_POLL_MS = 2 * 1000;
