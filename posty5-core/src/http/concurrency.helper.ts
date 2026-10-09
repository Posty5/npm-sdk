import { IResponse } from "../interface";
import {
  CONCURRENCY_REPORT_HEADER,
  CONCURRENCY_REPORT_MISSING_VERSION,
  IF_MATCH_HEADER,
} from "./concurrency.config";

/**
 * Throw a `TypeError` unless `version` is a non-negative integer. Every
 * versioned method calls this before sending, so a JS caller who forgets the
 * argument (or passes a string) fails loudly instead of being refused by the
 * API with a 428 or 400.
 */
export function assertVersion(version: unknown, name: string = "version"): asserts version is number {
  if (typeof version !== "number" || !Number.isInteger(version) || version < 0) {
    throw new TypeError(`Posty5: \`${name}\` must be a non-negative integer (the document's __v), got ${String(version)}`);
  }
}

/** Throw a `TypeError` unless every value of `versions` is a valid version. */
export function assertVersions(versions: unknown, ids?: string[]): asserts versions is Record<string, number> {
  if (!versions || typeof versions !== "object" || Array.isArray(versions)) {
    throw new TypeError("Posty5: `versions` must be an object mapping each id to its __v");
  }
  const map = versions as Record<string, unknown>;
  for (const key of Object.keys(map)) assertVersion(map[key], `versions.${key}`);
  for (const id of ids ?? []) {
    if (!(id in map)) throw new TypeError(`Posty5: \`versions\` has no entry for id ${id}`);
  }
}

/** The `If-Match` header value for a version: `"<v>"` (a strong ETag). */
export function ifMatchHeader(version: number): string {
  assertVersion(version);
  return `"${version}"`;
}

/** Whether a request's headers (plain object or AxiosHeaders) carry `If-Match`. */
export function hasIfMatch(headers: any): boolean {
  if (!headers) return false;
  if (typeof headers.get === "function") {
    const value = headers.get(IF_MATCH_HEADER);
    if (value !== undefined && value !== null) return true;
  }
  return Object.keys(headers).some((key) => key.toLowerCase() === IF_MATCH_HEADER.toLowerCase());
}

/**
 * The result of a versioned write with `__v` set from the envelope's
 * `version` (D-10). A route that answers no object (or a subset) still gives
 * the caller `{ _id, __v }`.
 */
export function withVersion<T extends object>(response: IResponse<T>, id?: string): T & { _id: string; __v: number } {
  const result: any = response.result && typeof response.result === "object" ? { ...response.result } : {};
  if (id !== undefined && result._id === undefined) result._id = id;
  if (typeof response.version === "number") result.__v = response.version;
  return result;
}

let missingVersionWarned = false;

/**
 * Report mode: the API answers `X-Posty5-Concurrency: missing-version` when a
 * write that should carry `If-Match` did not. That is an SDK bug, so warn once
 * per process. Removed with report mode (rollout phase F).
 */
export function warnOnMissingVersion(headers: any, method?: string, url?: string): boolean {
  if (missingVersionWarned || !headers) return false;
  const value = typeof headers.get === "function" ? headers.get(CONCURRENCY_REPORT_HEADER) : headers[CONCURRENCY_REPORT_HEADER.toLowerCase()];
  if (String(value ?? "").toLowerCase() !== CONCURRENCY_REPORT_MISSING_VERSION) return false;
  missingVersionWarned = true;
  console.warn(
    `[Posty5 SDK] ${String(method || "").toUpperCase()} ${url ?? ""} was sent without a document version; ` +
      "the API will refuse it once versions are enforced. Please report this SDK bug.",
  );
  return true;
}

/** Test hook: let the one-time warning fire again. */
export function resetMissingVersionWarning(): void {
  missingVersionWarned = false;
}
