import { CORE_VERSION } from "./version.const";

/** The API every client talks to unless `baseUrl` or `POSTY5_BASE_URL` says otherwise. */
export const DEFAULT_BASE_URL = "https://api.posty5.com";

/** Request timeout, in milliseconds. */
export const DEFAULT_TIMEOUT_MS = 30000;

/** Retries after a retryable failure (see `shouldRetryRequest`). */
export const DEFAULT_MAX_RETRIES = 3;

/** Delay unit between retries, in milliseconds: attempt n waits n × this. */
export const DEFAULT_RETRY_DELAY_MS = 1000;

/** Header naming the client and its version on every request, for the API's logs. */
export const CLIENT_HEADER_NAME = "X-Posty5-Client";

/** This SDK's name in `X-Posty5-Client`. */
export const SDK_CLIENT_NAME = "posty5-npm";

/** `X-Posty5-Client`'s default value: `posty5-npm/<@posty5/core version>`. */
export const SDK_CLIENT_ID = `${SDK_CLIENT_NAME}/${CORE_VERSION}`;

/** `createdFrom` stamped on records the SDK creates, unless the config sets another label. */
export const DEFAULT_CREATED_FROM = "npmPackage";

/** Methods whose repetition cannot create a second effect — safe to retry after a response. */
export const IDEMPOTENT_METHODS = ["GET", "HEAD", "OPTIONS", "PUT", "DELETE"];

/**
 * Network error codes that mean the request never reached the server, so even
 * a POST may be retried. A reset or a timeout is NOT here: the server may have
 * processed the request before the connection dropped.
 */
export const NEVER_CONNECTED_ERROR_CODES = ["ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN", "ENETUNREACH", "EHOSTUNREACH"];
