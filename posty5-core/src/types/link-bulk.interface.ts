/**
 * Bulk create, bulk jobs and export — the shapes `@posty5/short-link` and
 * `@posty5/qr-code` share. Mirrors the API's
 * `link-tools-service/.../link-bulk-job/interface.ts`.
 */

/** Defaults applied to every row that does not set the field itself. */
export interface IBulkDefaults {
    templateId?: string;
    tag?: string;
    refId?: string;
}

/** One field error on a refused row. */
export interface IBulkRowError {
    field?: string;
    message: string;
}

/** The outcome of one input row. `row` is 1-based over the caller's rows. */
export interface IBulkRowResult {
    row: number;
    status: "created" | "failed";
    id?: string;
    shortUrl?: string;
    qrCodeDownloadURL?: string;
    errors?: IBulkRowError[];
}

/** The answer of a bulk create: counters and one item per input row, in input order. */
export interface IBulkCreateResult {
    created: number;
    failed: number;
    items: IBulkRowResult[];
}

/** Options of `createMany`. */
export interface IBulkCreateOptions {
    /** Applied to every row that does not set the field. */
    defaults?: IBulkDefaults;
    /** Fetch page metadata for created links in the background (short links only; default true on the API). */
    fetchMetadata?: boolean;
    /** Rows per request, 1..100 (default 100). */
    chunkSize?: number;
    /** Base of each chunk's `Idempotency-Key` (`<key>-<chunkIndex>`); default a fresh UUID per call. */
    idempotencyKey?: string;
    /** Attempts after the first for a chunk that failed with a network error or a 5xx (default 3). */
    maxRetries?: number;
    /** Called after each chunk with the rows done so far and the total. */
    onProgress?: (done: number, total: number) => void;
}

/** Kind of a bulk job. */
export type LinkBulkJobKind = "shortLinks" | "qrCodes";

/** Status of a bulk job. */
export type LinkBulkJobStatus = "queued" | "running" | "succeeded" | "partiallySucceeded" | "failed" | "cancelled";

/** Format of a bulk job's input file and of an export. */
export type LinkBulkFileFormat = "csv" | "json";

/** Image format of a QR bulk job's ZIP (`svg`/`pdf` once vector export is live). */
export type LinkBulkImageFormat = "png" | "svg" | "pdf";

/** A file a finished bulk job can hand out. `zip` exists for QR jobs only. */
export type LinkBulkJobFile = "result" | "errors" | "zip";

/** A background bulk job. */
export interface ILinkBulkJob {
    _id: string;
    kind: LinkBulkJobKind;
    status: LinkBulkJobStatus;
    source: { format: LinkBulkFileFormat; fileName?: string; rowCount: number };
    progress: { processed: number; created: number; failed: number };
    defaults?: IBulkDefaults;
    options: { fetchMetadata?: boolean; image?: { format: LinkBulkImageFormat; sizePx?: number } };
    files: { result?: boolean; errors?: boolean; zip?: boolean };
    filesExpireAt?: string;
    createdFrom?: string;
    createdAt: string;
    updatedAt?: string;
    startedAt?: string;
    finishedAt?: string;
    /** Why a `failed` job stopped. */
    failureReason?: string;
}

/** The answer of a bulk job submitted with `dryRun: true`: nothing is stored. */
export interface IBulkDryRunReport {
    rowCount: number;
    valid: number;
    /** Refused rows (the first 200). */
    errors: IBulkRowResult[];
    /** Non-fatal notes, e.g. ignored unknown columns. */
    warnings?: string[];
}

/** Input of `createBulkJob`. */
export interface ICreateLinkBulkJobInput {
    /** The file's text (CSV with a header row, or a JSON array of rows). */
    content: string;
    format: LinkBulkFileFormat;
    fileName?: string;
    defaults?: IBulkDefaults;
    fetchMetadata?: boolean;
    /** Validate only and answer `IBulkDryRunReport`. */
    dryRun?: boolean;
    /** Sent as `Idempotency-Key`: the same key submits the same job once. */
    idempotencyKey?: string;
}

/** A signed, expiring download link of a job file. */
export interface ILinkBulkJobResultUrl {
    url: string;
    expiresAt: string;
}

/** Options of `waitForBulkJob`. */
export interface IWaitForBulkJobOptions {
    /** Poll interval in ms (default 2000). */
    intervalMs?: number;
    /** Give up after this many ms (default 30 minutes). The job keeps running. */
    timeoutMs?: number;
    /** Called with each polled job. */
    onProgress?: (job: ILinkBulkJob) => void;
}

/** Export query additions on top of the list filters. */
export interface ILinkExportParams {
    format?: LinkBulkFileFormat;
    /** Comma list of column keys to keep (unknown keys ignored); empty or omitted means every column. */
    columns?: string;
}

/** Image options of a QR bulk job (`svg`/`pdf` once vector export is live). */
export interface ILinkBulkJobImageOptions {
    format: LinkBulkImageFormat;
    /** 10..2000; default the template's width. */
    sizePx?: number;
}

/** What one sync bulk route needs besides the rows: its URL and how a chunk becomes a body. */
export interface ILinkBulkRoute<TRow> {
    url: string;
    toBody: (rows: TRow[], options: IBulkCreateOptions) => Record<string, unknown>;
}
