import { NetworkError, Posty5Error, ServerError } from "../errors/base-error";
import { Posty5BulkCreateError } from "../errors/bulk-create-error";
import type { HttpClient } from "../http/client";
import { IBulkCreateOptions, IBulkCreateResult, IBulkRowResult, ILinkBulkRoute } from "../types/link-bulk.interface";
import {
    IDEMPOTENCY_KEY_HEADER,
    LINK_BULK_DEFAULT_CHUNK_RETRIES,
    LINK_BULK_MAX_CHUNK_SIZE,
    LINK_BULK_RETRY_DELAY_MS,
} from "./link-bulk.config";

/** A random key for `Idempotency-Key` (crypto UUID where available). */
export function newIdempotencyKey(): string {
    const cryptoApi = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
    if (cryptoApi?.randomUUID) {
        return cryptoApi.randomUUID();
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

/** Resolve after `ms` milliseconds. */
export function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/** A chunk failure worth retrying with the same key: no answer, or a 5xx. */
export function isRetryableBulkError(error: unknown): boolean {
    if (error instanceof NetworkError || error instanceof ServerError) {
        return true;
    }
    const status = (error as Posty5Error)?.statusCode;
    return typeof status === "number" && status >= 500;
}

/** Split `rows` into chunks of at most `size`. */
export function toChunks<T>(rows: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let start = 0; start < rows.length; start += size) {
        chunks.push(rows.slice(start, start + size));
    }
    return chunks;
}

/** Clamp a requested chunk size to 1..100 (default 100). */
export function toChunkSize(requested?: number): number {
    if (!requested || requested < 1) {
        return LINK_BULK_MAX_CHUNK_SIZE;
    }
    return Math.min(Math.floor(requested), LINK_BULK_MAX_CHUNK_SIZE);
}

/** Add `offset` to every row number of a chunk's answer (the API numbers each chunk from 1). */
export function renumberBulkRows(items: IBulkRowResult[], offset: number): IBulkRowResult[] {
    return items.map((item) => ({ ...item, row: item.row + offset }));
}

/**
 * Send `rows` to a sync bulk route in chunks, one after another.
 *
 * Each chunk carries `Idempotency-Key: <key>-<chunkIndex>` and is retried on a
 * network error or 5xx with the same key (the API dedupes, so a chunk that
 * committed before the connection dropped answers the same rows). Row numbers
 * are 1-based over the caller's whole array. Any other failure stops the run
 * and throws `Posty5BulkCreateError` with the rows done so far.
 */
export async function runLinkBulkCreate<TRow>(
    http: HttpClient,
    route: ILinkBulkRoute<TRow>,
    rows: TRow[],
    options: IBulkCreateOptions = {},
): Promise<IBulkCreateResult> {
    const result: IBulkCreateResult = { created: 0, failed: 0, items: [] };
    if (!rows.length) {
        return result;
    }
    const chunkSize = toChunkSize(options.chunkSize);
    const baseKey = options.idempotencyKey || newIdempotencyKey();
    const maxRetries = options.maxRetries ?? LINK_BULK_DEFAULT_CHUNK_RETRIES;
    const chunks = toChunks(rows, chunkSize);

    for (let index = 0; index < chunks.length; index++) {
        const answer = await sendBulkChunk(http, route, chunks[index], options, `${baseKey}-${index}`, maxRetries, result);
        const items = renumberBulkRows(answer.items || [], index * chunkSize);
        result.items.push(...items);
        result.created += answer.created ?? items.filter((item) => item.status === "created").length;
        result.failed += answer.failed ?? items.filter((item) => item.status === "failed").length;
        options.onProgress?.(Math.min((index + 1) * chunkSize, rows.length), rows.length);
    }
    return result;
}

/** One chunk with its retries; throws `Posty5BulkCreateError` carrying `partial` when it gives up. */
async function sendBulkChunk<TRow>(
    http: HttpClient,
    route: ILinkBulkRoute<TRow>,
    chunk: TRow[],
    options: IBulkCreateOptions,
    key: string,
    maxRetries: number,
    partial: IBulkCreateResult,
): Promise<IBulkCreateResult> {
    for (let attempt = 0; ; attempt++) {
        try {
            const response = await http.post<IBulkCreateResult>(route.url, route.toBody(chunk, options), {
                headers: { [IDEMPOTENCY_KEY_HEADER]: key },
                skipRetry: true,
            });
            return response.result!;
        } catch (error) {
            if (attempt < maxRetries && isRetryableBulkError(error)) {
                await delay((attempt + 1) * LINK_BULK_RETRY_DELAY_MS);
                continue;
            }
            throw new Posty5BulkCreateError(error as Error, partial);
        }
    }
}
