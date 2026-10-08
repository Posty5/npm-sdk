import axiosRetry from "axios-retry";
import { IDEMPOTENT_METHODS, NEVER_CONNECTED_ERROR_CODES } from "./client.config";
import { NON_RETRYABLE_VERSION_STATUSES } from "./concurrency.config";
import { hasIfMatch } from "./concurrency.helper";

/**
 * Whether a failed request may be sent again.
 *
 * Until 4.3.0 every 5xx was retried whatever the method — so a POST that
 * failed AFTER the server had acted on it (a post published, credits charged)
 * was sent up to three more times. Now:
 *
 * - an idempotent method (GET, HEAD, OPTIONS, PUT, DELETE) is retried on a
 *   network error or a 5xx, as before;
 * - POST and PATCH are retried only when the connection was never made — the
 *   server cannot have acted on a request it never received.
 * - a versioned write (any request carrying `If-Match`) is never retried, and
 *   neither is a 409 or 428: a lost response followed by a retry with the old
 *   version would report a false conflict. The caller decides.
 */
export function shouldRetryRequest(error: any): boolean {
  const method = String(error?.config?.method || "").toUpperCase();
  const idempotent = IDEMPOTENT_METHODS.includes(method);
  const status: number | undefined = error?.response?.status;

  if (hasIfMatch(error?.config?.headers)) return false;
  if (status !== undefined && NON_RETRYABLE_VERSION_STATUSES.includes(status)) return false;

  if (status === undefined) {
    if (idempotent) return axiosRetry.isNetworkError(error);
    return NEVER_CONNECTED_ERROR_CODES.includes(String(error?.code || ""));
  }
  return idempotent && status >= 500;
}
