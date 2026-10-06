import {
    HttpClient,
    IBinaryResponse,
    IBulkCreateOptions,
    IBulkCreateResult,
    IBulkDryRunReport,
    ICreateLinkBulkJobInput,
    ILinkBulkJob,
    ILinkBulkJobResultUrl,
    IWaitForBulkJobOptions,
    LinkBulkJobApi,
    runLinkBulkCreate,
    ILinkAnalyticsQuery,
    ILinkAnalyticsResponse,
    ILinkStatisticsQuery,
    IPaginationParams,
    toLinkAnalyticsPath,
    toLinkAnalyticsQuery,
    toLinkStatisticsPath,
    toLinkStatisticsQuery
} from '@posty5/core';
import {
    ISearchShortLinkResponse,
    IGetShortLinkResponse,
    ICreateShortLinkResponse,
    IUpdateShortLinkResponse,
    IDeleteShortLinkResponse,
    ICreateShortLinkRequest,
    IUpdateShortLinkRequest,
    IListParams,
    IShortLinkStatisticsResponse,
    IShortLinkBulkRow,
    IShortLinkExportParams,
    IShortLinkRulesInput
} from './interfaces';
import { toShortLinkBody, toShortLinkListQuery } from './helpers/short-link-request.helper';
import { ShortLinkBulkPathsConst, ShortLinkControlsPathsConst, ShortLinkCreateSourceConst } from './short-link.config';

/**
 * Short Link Client for managing Short Links via Posty5 API
 */
export class ShortLinkClient {
    private http: HttpClient;
    private basePath = '/api/short-link';
    private bulkJobs: LinkBulkJobApi;

    /**
     * Create a new Short Link client
     * @param http - HTTP client instance from @posty5/core
     */
    constructor(http: HttpClient) {
        this.http = http;
        this.bulkJobs = new LinkBulkJobApi(http, 'shortLinks');
    }

    /**
     * Search/List Short Links with pagination and filters
     * @param params - Filter parameters. The deprecated `"pageinfo.title"` key is
     * sent as `"pageInfo.title"`; `isEnableMonetization` is never sent.
     * @param pagination - Pagination parameters
     * @returns Paginated list of short links
     */
    async list(params?: IListParams, pagination?: IPaginationParams): Promise<ISearchShortLinkResponse> {
        const response = await this.http.get<ISearchShortLinkResponse>(this.basePath, {
            params: toShortLinkListQuery(params, pagination)
        });
        return response.result!;
    }


    /**
     * Get a Short Link by ID
     * @param id - Short Link ID
     * @returns Short Link full details, including `androidUrl` / `iosUrl`
     */
    async get(id: string): Promise<IGetShortLinkResponse> {
        const response = await this.http.get<IGetShortLinkResponse>(`${this.basePath}/${id}`);
        return response.result!;
    }

    /**
     * Create a new Short Link
     * @param data - Create request data (`templateId` is required)
     * @returns Created short link details
     */
    async create(data: ICreateShortLinkRequest): Promise<ICreateShortLinkResponse> {
        const response = await this.http.post<ICreateShortLinkResponse>(this.basePath, {
            ...toShortLinkBody(data),
            ...ShortLinkCreateSourceConst,
            createdFrom: this.http.createdFrom,
        });
        return response.result!;
    }

    /**
     * Update an existing Short Link
     * @param id - Short Link ID
     * @param data - Update request data (`templateId` is required). Omitted
     * `isEnableLandingPage`, `androidUrl` and `iosUrl` keep (or, for the deep
     * links after a `baseUrl` change, re-derive) the stored values.
     * @returns Updated short link details
     */
    async update(id: string, data: IUpdateShortLinkRequest): Promise<IUpdateShortLinkResponse> {
        const response = await this.http.put<IUpdateShortLinkResponse>(`${this.basePath}/${id}`, toShortLinkBody(data));
        return response.result!;
    }

    /**
     * Delete a Short Link
     * @param id - Short Link ID
     */
    async delete(id: string): Promise<void> {
        await this.http.delete<IDeleteShortLinkResponse>(`${this.basePath}/${id}`);
    }

    /**
     * The caller's distinct tags (an API key: its own links' tags), sorted.
     * @param term - Optional case-insensitive prefix
     * @returns Up to 200 tags
     */
    async listTags(term?: string): Promise<string[]> {
        const response = await this.http.get<string[]>(`${this.basePath}${ShortLinkControlsPathsConst.tags}`, {
            params: term ? { term } : undefined
        });
        return response.result || [];
    }

    /**
     * Queue one destination health check of a link (202). Limited to one per
     * link per 10 minutes. Feature key `healthMonitor`.
     * @param id - Short Link ID
     */
    async checkHealth(id: string): Promise<void> {
        await this.http.post(`${this.basePath}/${id}${ShortLinkControlsPathsConst.healthCheck}`, {});
    }

    /**
     * Set a link's rules (access, routing, variants, UTM, pixels) through
     * `update`. Partial: omitted sections are untouched; `null` / `[]` clears
     * a section. The link is read first only when `baseUrl` or `templateId`
     * is not passed, since the update requires them.
     * @param id - Short Link ID
     * @param rules - The sections to set
     * @returns Updated short link details
     */
    async setRules(id: string, rules: IShortLinkRulesInput): Promise<IUpdateShortLinkResponse> {
        const { baseUrl, templateId, ...sections } = rules;
        let resolvedBaseUrl = baseUrl;
        let resolvedTemplateId = templateId;
        if (!resolvedBaseUrl || !resolvedTemplateId) {
            const stored = await this.get(id);
            resolvedBaseUrl = resolvedBaseUrl || stored.baseUrl || '';
            resolvedTemplateId = resolvedTemplateId || stored.templateId || stored.template?._id || '';
        }
        return this.update(id, { ...sections, baseUrl: resolvedBaseUrl, templateId: resolvedTemplateId });
    }

    /**
     * Visit analytics of one Short Link: totals, a series per day/week/month,
     * and breakdowns by country, device, OS, browser, referrer, channel
     * (`link` click or `qr` scan) and language.
     *
     * - Bots and link-preview fetchers are excluded from `visits` and counted
     *   in `totals.botVisits` only.
     * - `uniqueVisitors` over more than one day is the sum of each day's
     *   uniques; a visitor is not recognised across days.
     * - There is no data before `meta.analyticsStartedAt`. QR images
     *   downloaded before then count their scans as `link`.
     * - No `breakdown` (or `"all"`) returns every breakdown the owner's plan
     *   allows and lists the rest in `meta.locked`; naming a breakdown the plan
     *   does not include, or a `from` older than the plan's history, throws
     *   `AuthorizationError` (403, "This feature is not available on your
     *   current plan."). Reading analytics costs no credits.
     * - An unknown or deleted id throws `ValidationError` (400, "The Short Link
     *   Is Not Found"), not `NotFoundError`; a link the caller may not read
     *   throws `AuthorizationError` (403, "You Have Not Permission").
     *
     * @param id - Short Link ID
     * @param query - Range, interval, time zone, breakdowns and rows per breakdown
     * @returns Totals, series, breakdowns and `meta`
     */
    async getAnalytics(id: string, query?: ILinkAnalyticsQuery): Promise<ILinkAnalyticsResponse> {
        const response = await this.http.get<ILinkAnalyticsResponse>(toLinkAnalyticsPath(this.basePath, id), {
            params: toLinkAnalyticsQuery(query)
        });
        return response.result!;
    }

    /**
     * Statistics over all of the caller's short links (an admin key: all
     * links) for a range.
     *
     * - `daily` has one row per **UTC** day: `createdCount` links created that
     *   day and `visitorsSum` visits by people made that day (bots excluded) —
     *   not the visitors of links created that day.
     * - `totals` holds the lifetime `totalLinks` / `totalVisitors` (the
     *   counter, which includes visits from before visit analytics launched)
     *   and the range's `visitsInRange`, `uniqueVisitorsInRange` (sum of daily
     *   uniques) and `botVisitsInRange`.
     * - `topLinks` is up to ten links with the most visits in the range, each
     *   with `visitsInRange`; links with no visits in the range are left out.
     *
     * @param query - `period` preset, or `from` / `to` (`YYYY-MM-DD`; a `Date`
     * is sent as its UTC day). Default: the last 30 days.
     * @returns The resolved `range` and the statistics `data`
     */
    async statistics(query?: ILinkStatisticsQuery): Promise<IShortLinkStatisticsResponse> {
        const response = await this.http.get<IShortLinkStatisticsResponse>(toLinkStatisticsPath(this.basePath), {
            params: toLinkStatisticsQuery(query)
        });
        return response.result!;
    }

    /**
     * Create many short links in one call.
     *
     * Rows are sent in chunks (default and maximum 100) one after another to
     * `POST /api/short-link/bulk`, each with `Idempotency-Key: <key>-<chunkIndex>`
     * (`options.idempotencyKey`, default a fresh UUID per call). A chunk that
     * fails with a network error or a 5xx is retried with the same key, so it
     * is created and charged once. A refused row never blocks the others: it
     * comes back with `status: "failed"` and its `errors`. `row` is the
     * 1-based position in `rows`.
     *
     * A failure of a whole chunk (plan gate, not enough credits, invalid
     * request, retries exhausted) stops the run and throws
     * `Posty5BulkCreateError`, whose `partialResult` holds the rows done so far.
     *
     * @param rows - The links to create
     * @param options - Defaults, chunk size, idempotency key, progress callback
     * @returns Counters and one item per row, in input order
     */
    async createMany(rows: IShortLinkBulkRow[], options?: IBulkCreateOptions): Promise<IBulkCreateResult> {
        return runLinkBulkCreate(
            this.http,
            {
                url: `${this.basePath}${ShortLinkBulkPathsConst.bulk}`,
                toBody: (links, opts) => ({
                    links,
                    defaults: opts.defaults,
                    fetchMetadata: opts.fetchMetadata,
                    // No templateType: the bulk schema does not allow it (400 "templateType is not allowed").
                    createdFrom: this.http.createdFrom,
                }),
            },
            rows,
            options,
        );
    }

    /**
     * Export the caller's short links as a CSV or JSON file, with the same
     * filters as `list`. Every CSV cell is injection-hardened by the API.
     * @param params - List filters plus `format` (`csv` by default)
     * @returns The file's bytes, content type and file name
     */
    async export(params?: IShortLinkExportParams): Promise<IBinaryResponse> {
        const { format, ...filters } = params || {};
        return this.http.getBinary(`${this.basePath}${ShortLinkBulkPathsConst.export}`, {
            params: { ...toShortLinkListQuery(filters), ...(format ? { format } : {}) },
        });
    }

    /**
     * Start a background job from a CSV or JSON file of up to 5,000 rows, or
     * validate it only with `dryRun: true`.
     * @returns The queued job, or the dry-run report
     */
    async createBulkJob(input: ICreateLinkBulkJobInput): Promise<ILinkBulkJob | IBulkDryRunReport> {
        return this.bulkJobs.create(input);
    }

    /** Get a bulk job with its progress. */
    async getBulkJob(id: string): Promise<ILinkBulkJob> {
        return this.bulkJobs.get(id);
    }

    /** A signed, expiring download link of a finished job's `result` or `errors` CSV. */
    async getBulkJobResultUrl(id: string, file: 'result' | 'errors'): Promise<ILinkBulkJobResultUrl> {
        return this.bulkJobs.getResultUrl(id, file);
    }

    /** Cancel a queued or running job; rows already created stay. */
    async cancelBulkJob(id: string): Promise<ILinkBulkJob> {
        return this.bulkJobs.cancel(id);
    }

    /**
     * Poll a job until it succeeds, partially succeeds, fails or is cancelled.
     * Rejects after `timeoutMs` (default 30 minutes) without cancelling the job.
     */
    async waitForBulkJob(id: string, options?: IWaitForBulkJobOptions): Promise<ILinkBulkJob> {
        return this.bulkJobs.wait(id, options);
    }
}
