/**
 * Resumable uploads (tus 1.0.0) for large media.
 *
 * A signed PUT is all-or-nothing: a dropped connection at 90% of an hour-long
 * video starts again from zero. The API offers the same destination as a
 * resumable transfer, and this is the client for it.
 *
 * The protocol subset needed here is small — create, patch, head — so it is
 * implemented directly rather than by pulling `tus-js-client` into a published
 * SDK's dependency tree. What is deliberately NOT implemented is fingerprint
 * storage: resuming across page loads needs somewhere to persist the upload
 * URL, which is the caller's decision, not a library's. Pass `uploadUrl` back
 * in to resume an earlier attempt yourself.
 */

import { IUploadTarget } from "./interfaces";

const TUS_VERSION = "1.0.0";

/**
 * 8MiB matches the server's multipart part size, so one PATCH becomes one R2
 * part with no server-side re-buffering. It also caps how much progress a
 * dropped connection can cost.
 */
export const DEFAULT_CHUNK_SIZE = 8 * 1024 * 1024;

/** Backoff between chunk retries. The chunk is retried, never the whole file. */
const RETRY_DELAYS = [0, 1000, 3000, 5000, 10000];

/** Consecutive rounds that end at the same offset before the transfer is abandoned. */
const MAX_CONSECUTIVE_STALLS = 3;

export interface IResumableUploadOptions {
  /** Called with 0-100 as the transfer proceeds. */
  onProgress?: (progress: number) => void;
  /**
   * Called once the upload exists on the server, with its URL. Persist this to
   * resume the same transfer later — the ticket expires, but an upload that
   * already exists resumes by its own URL and is unaffected.
   */
  onUploadUrl?: (uploadUrl: string) => void;
  /** Resume a previous attempt instead of creating a new upload. */
  uploadUrl?: string;
  /** Bytes per PATCH. Defaults to the server's 8MiB part size. */
  chunkSize?: number;
  /** Abort the transfer. A partially uploaded file can be resumed later. */
  signal?: AbortSignal;
  /**
   * Tell the server to discard the partial upload when `signal` fires.
   *
   * Off by default, and deliberately so: the reason abort leaves the bytes in
   * place is that "cancel" and "pause" are the same gesture in most UIs, and a
   * user who paused a 40-minute video does not expect to start over. Turn this
   * on where the abort really is final — a wizard the user closed, a file they
   * replaced — so the server stops holding megabytes nobody will claim.
   *
   * Best-effort: a failed termination is swallowed, because the caller is
   * already being handed an AbortError and the server expires the upload on its
   * own after 24h regardless.
   */
  terminateOnAbort?: boolean;
  /** Content type stamped on the request when the blob does not carry one. */
  fallbackType?: string;
}

/** tus metadata values are base64, and the keys are space-separated from them. */
function encodeMetadata(pairs: Record<string, string>): string {
  return Object.entries(pairs)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${key} ${toBase64(value)}`)
    .join(",");
}

function toBase64(value: string): string {
  if (typeof btoa === "function") {
    // Browsers: btoa is latin1-only, so widen through UTF-8 first.
    return btoa(String.fromCharCode(...new TextEncoder().encode(value)));
  }
  // Node.
  return Buffer.from(value, "utf8").toString("base64");
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function isAborted(signal?: AbortSignal): boolean {
  return !!signal?.aborted;
}

function abortError(): Error {
  const error = new Error("Upload aborted");
  error.name = "AbortError";
  return error;
}

/**
 * Whether this target can be uploaded resumably. A server without the resumable
 * service configured simply omits these fields, and callers fall back.
 */
export function supportsResumableUpload(target: IUploadTarget): boolean {
  return !!target.tusEndpoint && !!target.ticket;
}

/**
 * Create the upload and return its URL.
 *
 * The destination lives inside the signed ticket, so `filename` and `filetype`
 * are carried for diagnostics only — the server never derives a key from them.
 */
async function createUpload(
  target: IUploadTarget,
  size: number,
  filename: string,
  filetype: string,
  signal?: AbortSignal,
): Promise<string> {
  const response = await fetch(target.tusEndpoint as string, {
    method: "POST",
    headers: {
      "Tus-Resumable": TUS_VERSION,
      "Upload-Length": String(size),
      "Upload-Metadata": encodeMetadata({ ticket: target.ticket as string, filename, filetype }),
    },
    signal,
  });

  if (response.status !== 201) {
    throw new Error(`Could not start the upload (${response.status}): ${await safeText(response)}`);
  }

  const location = response.headers.get("Location");
  if (!location) {
    throw new Error("Upload was created but the server returned no Location header.");
  }

  // A tus server may answer with a relative Location; resolve it against the
  // endpoint so a gateway-relative path still points somewhere usable.
  return new URL(location, target.tusEndpoint as string).toString();
}

/** Ask the server how much of this upload it already holds. */
async function getOffset(uploadUrl: string, signal?: AbortSignal): Promise<number> {
  const response = await fetch(uploadUrl, {
    method: "HEAD",
    headers: { "Tus-Resumable": TUS_VERSION },
    signal,
  });

  if (response.status === 404 || response.status === 410) {
    throw new Error("This upload has expired on the server and cannot be resumed.");
  }
  if (!response.ok) {
    throw new Error(`Could not read the upload's progress (${response.status}).`);
  }

  return Number(response.headers.get("Upload-Offset") ?? 0);
}

/**
 * Discard an upload the server is still holding (tus Termination extension).
 *
 * Exported because the decision is the caller's: an upload URL persisted from
 * `onUploadUrl` outlives the transfer that created it, and only the caller knows
 * whether the user means to come back to it. Without this the bytes sit on the
 * server until its 24h expiry sweep.
 *
 * Resolves `true` when the server confirms, `false` when it refuses or is
 * unreachable — never throws, since nothing useful can be done about a failed
 * cleanup of something that expires on its own.
 */
export async function terminateUpload(uploadUrl: string): Promise<boolean> {
  try {
    const response = await fetch(uploadUrl, {
      method: "DELETE",
      headers: { "Tus-Resumable": TUS_VERSION },
    });
    // 404/410 mean it is already gone, which is the outcome that was asked for.
    return response.status === 204 || response.status === 404 || response.status === 410;
  } catch {
    return false;
  }
}

async function safeText(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, 300);
  } catch {
    return "";
  }
}

/**
 * Send one chunk, retrying the chunk itself on a transient failure.
 *
 * Returns the server's new offset, which is authoritative — a chunk can be
 * partially accepted, and trusting our own arithmetic instead would corrupt
 * everything after it.
 */
async function patchChunk(
  uploadUrl: string,
  chunk: Blob,
  offset: number,
  signal?: AbortSignal,
): Promise<number> {
  let lastError: unknown;

  for (let attempt = 0; attempt < RETRY_DELAYS.length; attempt++) {
    if (isAborted(signal)) throw abortError();
    if (RETRY_DELAYS[attempt]) await wait(RETRY_DELAYS[attempt]);

    try {
      const response = await fetch(uploadUrl, {
        method: "PATCH",
        headers: {
          "Tus-Resumable": TUS_VERSION,
          "Upload-Offset": String(offset),
          "Content-Type": "application/offset+octet-stream",
        },
        body: chunk,
        signal,
      });

      if (response.status === 204) {
        return Number(response.headers.get("Upload-Offset") ?? offset + chunk.size);
      }

      // 409 means our offset disagrees with the server's. Re-syncing is the
      // correct recovery, not a retry of the same wrong offset.
      if (response.status === 409) {
        return await getOffset(uploadUrl, signal);
      }

      // 4xx other than conflict is a decision, not a blip — retrying an
      // expired ticket or an oversized file just wastes the user's time.
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Upload rejected (${response.status}): ${await safeText(response)}`);
      }

      lastError = new Error(`Upload failed (${response.status})`);
    } catch (error: any) {
      if (error?.name === "AbortError") throw error;
      // A 4xx we raised ourselves must not be retried.
      if (/^Upload rejected/.test(error?.message || "")) throw error;
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Upload failed");
}

/**
 * Upload a file resumably, returning the public URL it lands at.
 *
 * `target.fileURL` came back with the ticket, so the final URL is known up
 * front and there is no completion body to parse.
 */
export async function uploadResumable(
  target: IUploadTarget,
  file: Blob,
  options: IResumableUploadOptions = {},
): Promise<string> {
  const { onProgress, onUploadUrl, chunkSize = DEFAULT_CHUNK_SIZE, signal, fallbackType = "application/octet-stream", terminateOnAbort = false } = options;

  if (!supportsResumableUpload(target)) {
    throw new Error("This upload target does not support resumable uploads.");
  }
  if (target.maxSize && file.size > target.maxSize) {
    const limitMb = Math.round(target.maxSize / (1024 * 1024));
    throw new Error(`This file is larger than the ${limitMb}MB limit.`);
  }
  if (isAborted(signal)) throw abortError();

  const filename = (file as File).name || "upload";
  const filetype = file.type || fallbackType;

  let uploadUrl = options.uploadUrl;
  let offset = 0;

  if (uploadUrl) {
    // Resuming: the server's offset is the only trustworthy starting point.
    offset = await getOffset(uploadUrl, signal);
  } else {
    uploadUrl = await createUpload(target, file.size, filename, filetype, signal);
    onUploadUrl?.(uploadUrl);
  }

  /**
   * The transfer's own signal is already aborted by the time this runs, so the
   * DELETE cannot carry it — a fetch with an aborted signal never leaves.
   */
  const discardIfAsked = async () => {
    if (terminateOnAbort && uploadUrl) await terminateUpload(uploadUrl);
  };

  onProgress?.(file.size ? Math.round((offset / file.size) * 100) : 0);

  // A round that ends where it started is not automatically fatal: a spurious
  // 409 re-syncs to the offset we already had, and retrying that chunk is the
  // correct recovery. What must not happen is spinning forever, so a few
  // consecutive stalls end the transfer instead of one.
  let consecutiveStalls = 0;

  while (offset < file.size) {
    if (isAborted(signal)) {
      await discardIfAsked();
      throw abortError();
    }

    const end = Math.min(offset + chunkSize, file.size);
    let next: number;
    try {
      next = await patchChunk(uploadUrl, file.slice(offset, end), offset, signal);
    } catch (error: any) {
      // An abort raised from inside a chunk lands here rather than at the loop
      // guard above, so the cleanup has to sit on both paths.
      if (error?.name === "AbortError") await discardIfAsked();
      throw error;
    }

    if (next <= offset) {
      if (++consecutiveStalls >= MAX_CONSECUTIVE_STALLS) {
        throw new Error("The upload stopped making progress and was abandoned.");
      }
      continue;
    }

    consecutiveStalls = 0;
    offset = next;
    onProgress?.(Math.round((offset / file.size) * 100));
  }

  onProgress?.(100);
  return target.fileURL as string;
}
