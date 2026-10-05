import {
    IBulkDryRunReport,
    ICreateLinkBulkJobInput,
    ILinkBulkJob,
    ILinkBulkJobImageOptions,
    ILinkBulkJobResultUrl,
    IWaitForBulkJobOptions,
    LinkBulkJobFile,
    LinkBulkJobKind,
} from "../types/link-bulk.interface";
import {
    IDEMPOTENCY_KEY_HEADER,
    LINK_BULK_JOBS_PATH,
    LINK_BULK_POLL_INTERVAL_MS,
    LINK_BULK_TERMINAL_STATUSES,
    LINK_BULK_WAIT_TIMEOUT_MS,
} from "../utils/link-bulk.config";
import { delay } from "../utils/link-bulk.helper";
import { Posty5Error } from "../errors/base-error";
import type { HttpClient } from "./client";

/**
 * The `/api/link-bulk-jobs` routes for one job kind. `ShortLinkClient` and
 * `QRCodeClient` each hold one and expose its methods as their own.
 */
export class LinkBulkJobApi {
    constructor(
        private readonly http: HttpClient,
        private readonly kind: LinkBulkJobKind,
    ) {}

    /** Submit a job (202, the job) or, with `dryRun`, validate only (200, the report). */
    async create(input: ICreateLinkBulkJobInput, image?: ILinkBulkJobImageOptions): Promise<ILinkBulkJob | IBulkDryRunReport> {
        const { idempotencyKey, fetchMetadata, ...rest } = input;
        const options: Record<string, unknown> = {};
        if (fetchMetadata !== undefined) {
            options.fetchMetadata = fetchMetadata;
        }
        if (image) {
            options.image = image;
        }
        const response = await this.http.post<ILinkBulkJob | IBulkDryRunReport>(
            LINK_BULK_JOBS_PATH,
            { ...rest, kind: this.kind, options, createdFrom: this.http.createdFrom },
            idempotencyKey ? { headers: { [IDEMPOTENCY_KEY_HEADER]: idempotencyKey } } : undefined,
        );
        return response.result!;
    }

    async get(id: string): Promise<ILinkBulkJob> {
        const response = await this.http.get<ILinkBulkJob>(`${LINK_BULK_JOBS_PATH}/${id}`);
        return response.result!;
    }

    async getResultUrl(id: string, file: LinkBulkJobFile): Promise<ILinkBulkJobResultUrl> {
        const response = await this.http.get<ILinkBulkJobResultUrl>(`${LINK_BULK_JOBS_PATH}/${id}/result-url`, { params: { file } });
        return response.result!;
    }

    async cancel(id: string): Promise<ILinkBulkJob> {
        const response = await this.http.post<ILinkBulkJob>(`${LINK_BULK_JOBS_PATH}/${id}/cancel`);
        return response.result!;
    }

    /** Poll until the job reaches a terminal status; rejects on timeout without cancelling the job. */
    async wait(id: string, options: IWaitForBulkJobOptions = {}): Promise<ILinkBulkJob> {
        const intervalMs = options.intervalMs ?? LINK_BULK_POLL_INTERVAL_MS;
        const deadline = Date.now() + (options.timeoutMs ?? LINK_BULK_WAIT_TIMEOUT_MS);
        for (;;) {
            const job = await this.get(id);
            options.onProgress?.(job);
            if (LINK_BULK_TERMINAL_STATUSES.includes(job.status)) {
                return job;
            }
            if (Date.now() + intervalMs > deadline) {
                throw new Posty5Error(
                    `Bulk job ${id} did not finish in time (status "${job.status}"); it keeps running`,
                    "BULK_JOB_WAIT_TIMEOUT",
                );
            }
            await delay(intervalMs);
        }
    }
}
