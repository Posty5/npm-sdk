import { LinkBulkJobStatus } from "../types/link-bulk.interface";

/** Base path of the bulk-job routes. */
export const LINK_BULK_JOBS_PATH = "/api/link-bulk-jobs";

/** Most rows the sync bulk routes take per request. */
export const LINK_BULK_MAX_CHUNK_SIZE = 100;

/** Attempts after the first for a bulk chunk that failed with a network error or a 5xx. */
export const LINK_BULK_DEFAULT_CHUNK_RETRIES = 3;

/** Delay unit between chunk retries, in ms: attempt n waits n x this. */
export const LINK_BULK_RETRY_DELAY_MS = 1000;

/** Default poll interval of `waitForBulkJob`. */
export const LINK_BULK_POLL_INTERVAL_MS = 2000;

/** Default timeout of `waitForBulkJob` (30 minutes). */
export const LINK_BULK_WAIT_TIMEOUT_MS = 30 * 60_000;

/** Statuses after which a job never changes. */
export const LINK_BULK_TERMINAL_STATUSES: readonly LinkBulkJobStatus[] = ["succeeded", "partiallySucceeded", "failed", "cancelled"];

/** Header the bulk routes deduplicate on. */
export const IDEMPOTENCY_KEY_HEADER = "Idempotency-Key";
