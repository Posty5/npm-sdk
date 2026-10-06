import {
  HttpClient,
  IBinaryResponse,
  IBulkCreateOptions,
  IBulkCreateResult,
  IBulkDryRunReport,
  ILinkBulkJob,
  ILinkBulkJobResultUrl,
  IWaitForBulkJobOptions,
  LinkBulkJobApi,
  runLinkBulkCreate,
  ILinkAnalyticsQuery,
  ILinkAnalyticsResponse,
  ILinkStatisticsQuery,
  IPaginationParams,
  IPaginationResponse,
  toLinkAnalyticsPath,
  toLinkAnalyticsQuery,
  toLinkStatisticsPath,
  toLinkStatisticsQuery,
} from "@posty5/core";
import {
  ICreateQRCodeResponse,
  IUpdateQRCodeResponse,
  IGetQRCodeResponse,
  IDeleteQRCodeResponse,
  // ISearchQRCodesResponse,
  IListParams,
  ICreateFreeTextQRCodeRequest,
  ICreateEmailQRCodeRequest,
  ICreateWifiQRCodeRequest,
  ICreateCallQRCodeRequest,
  ICreateSMSQRCodeRequest,
  ICreateURLQRCodeRequest,
  ICreateGeolocationQRCodeRequest,
  IQRCode,
  IUpdateEmailQRCodeRequest,
  IUpdateWifiQRCodeRequest,
  IUpdateCallQRCodeRequest,
  IUpdateSMSQRCodeRequest,
  IUpdateURLQRCodeRequest,
  IUpdateGeolocationQRCodeRequest,
  QrCodeTargetType,
  IQRCodeStatisticsResponse,
  IQrCodeBulkRow,
  IQrCodeExportParams,
  ICreateQrCodeBulkJobInput,
} from "./interfaces";
import { toFreeTextQrCodeBody, toQrCodeListQuery, toStructuredQrCodeBody } from "./helpers/qr-code-request.helper";
import { QrCodeBulkPathsConst, QrCodeRequestSourceConst } from "./qr-code.config";

/**
 * QR Code Client for managing QR codes via Posty5 API
 *
 * The text a code's image encodes is built by the API from `qrCodeTarget`
 * (escaped per type); this client sends the target only. A downloaded image
 * encodes the content directly, so scanning it does not reach Posty5 and is
 * not counted in `numberOfVisitors`.
 *
 * @example
 * ```typescript
 * import { HttpClient } from '@posty5/core';
 * import { QRCodeClient } from '@posty5/qr-code';
 *
 * const http = new HttpClient({
 *   baseUrl: 'https://api.posty5.com',
 *   apiKey: 'your-api-key'
 * });
 *
 * const qrCodeClient = new QRCodeClient(http);
 *
 * // Create a URL QR code
 * const qrCode = await qrCodeClient.createURL({
 *   name: 'My Website',
 *   templateId: 'template_123',
 *   url: {
 *     url: 'https://example.com'
 *   }
 * });
 * ```
 */
export class QRCodeClient {
  private http: HttpClient;
  private basePath = "/api/qr-code";
  private bulkJobs: LinkBulkJobApi;

  /**
   * Create a new QR Code client
   * @param http - HTTP client instance from @posty5/core
   */
  constructor(http: HttpClient) {
    this.http = http;
    this.bulkJobs = new LinkBulkJobApi(http, "qrCodes");
  }

  /**
   * Create a free text QR code with custom text content
   *
   * @param data - Free text QR code creation data
   * @returns Created QR code with ID and landing page URL
   *
   * @example
   * ```typescript
   * const qrCode = await qrCodeClient.createFreeText({
   *   name: 'Custom Text QR',
   *   templateId: 'template_123',
   *   text: 'Any custom text you want to encode'
   * });
   * console.log('QR Code URL:', qrCode.qrCodeLandingPageURL);
   * ```
   */
  async createFreeText(data: ICreateFreeTextQRCodeRequest): Promise<ICreateQRCodeResponse> {
    return this.createOfType("freeText", toFreeTextQrCodeBody(data));
  }

  /**
   * Create an email QR code that opens the default email client
   *
   * @param data - Email QR code creation data
   * @returns Created QR code with ID and landing page URL
   *
   * @example
   * ```typescript
   * const qrCode = await qrCodeClient.createEmail({
   *   name: 'Contact Us',
   *   templateId: 'template_123',
   *   email: {
   *     email: 'contact@example.com',
   *     subject: 'Inquiry from QR Code',
   *     body: 'Hello, I would like to know more about...'
   *   }
   * });
   * ```
   */
  async createEmail(data: ICreateEmailQRCodeRequest): Promise<ICreateQRCodeResponse> {
    return this.createOfType("email", toStructuredQrCodeBody("email", data));
  }

  /**
   * Create a WiFi QR code for easy network connection
   *
   * @param data - WiFi QR code creation data
   * @returns Created QR code with ID and landing page URL
   *
   * @example
   * ```typescript
   * const qrCode = await qrCodeClient.createWifi({
   *   name: 'Office WiFi',
   *   templateId: 'template_123',
   *   wifi: {
   *     name: 'OfficeNetwork',
   *     authenticationType: 'WPA',
   *     password: 'secret123'
   *   }
   * });
   * ```
   */
  async createWifi(data: ICreateWifiQRCodeRequest): Promise<ICreateQRCodeResponse> {
    return this.createOfType("wifi", toStructuredQrCodeBody("wifi", data));
  }

  /**
   * Create a phone call QR code that initiates a call
   *
   * @param data - Call QR code creation data
   * @returns Created QR code with ID and landing page URL
   *
   * @example
   * ```typescript
   * const qrCode = await qrCodeClient.createCall({
   *   name: 'Call Support',
   *   templateId: 'template_123',
   *   call: {
   *     phoneNumber: '+1234567890'
   *   }
   * });
   * ```
   */
  async createCall(data: ICreateCallQRCodeRequest): Promise<ICreateQRCodeResponse> {
    return this.createOfType("call", toStructuredQrCodeBody("call", data));
  }

  /**
   * Create an SMS QR code with pre-filled message
   *
   * @param data - SMS QR code creation data
   * @returns Created QR code with ID and landing page URL
   *
   * @example
   * ```typescript
   * const qrCode = await qrCodeClient.createSMS({
   *   name: 'Text Us',
   *   templateId: 'template_123',
   *   sms: {
   *     phoneNumber: '+1234567890',
   *     message: 'I scanned your QR code!'
   *   }
   * });
   * ```
   */
  async createSMS(data: ICreateSMSQRCodeRequest): Promise<ICreateQRCodeResponse> {
    return this.createOfType("sms", toStructuredQrCodeBody("sms", data));
  }
  /**
   * Create a URL QR code that opens a website
   *
   * @param data - URL QR code creation data
   * @returns Created QR code with ID and landing page URL
   *
   * @example
   * ```typescript
   * const qrCode = await qrCodeClient.createURL({
   *   name: 'Website Link',
   *   templateId: 'template_123',
   *   url: {
   *     url: 'https://example.com'
   *   },
   *   tag: 'marketing',
   *   refId: 'CAMPAIGN-001'
   * });
   * ```
   */
  async createURL(data: ICreateURLQRCodeRequest): Promise<ICreateQRCodeResponse> {
    return this.createOfType("url", toStructuredQrCodeBody("url", data));
  }
  /**
   * Create a geolocation QR code that opens map coordinates
   *
   * @param data - Geolocation QR code creation data
   * @returns Created QR code with ID and landing page URL
   *
   * @example
   * ```typescript
   * const qrCode = await qrCodeClient.createGeolocation({
   *   name: 'Our Office Location',
   *   templateId: 'template_123',
   *   geolocation: {
   *     latitude: 40.7128,
   *     longitude: -74.0060
   *   }
   * });
   * ```
   */
  async createGeolocation(data: ICreateGeolocationQRCodeRequest): Promise<ICreateQRCodeResponse> {
    return this.createOfType("geolocation", toStructuredQrCodeBody("geolocation", data));
  }

  /**
   * Update a free text QR code with custom text content
   *
   * @param data - Free text QR code update data
   * @returns Updated QR code with ID and landing page URL
   *
   * @example
   * ```typescript
   * const qrCode = await qrCodeClient.updateFreeText("qr_code_id",{
   *   name: 'Custom Text QR',
   *   templateId: 'template_123',
   *   text: 'Any custom text you want to encode'
   * });
   * console.log('QR Code URL:', qrCode.qrCodeLandingPageURL);
   * ```
   */
  async updateFreeText(id: string, data: ICreateFreeTextQRCodeRequest): Promise<ICreateQRCodeResponse> {
    return this.updateOfType("freeText", id, toFreeTextQrCodeBody(data));
  }

  /**
   * Update an email QR code that opens the default email client
   *
   * @param data - Email QR code update data
   * @returns Updated QR code with ID and landing page URL
   *
   * @example
   * ```typescript
   * const qrCode = await qrCodeClient.updateEmail("qr_code_id",{
   *   name: 'Contact Us',
   *   templateId: 'template_123',
   *   email: {
   *     email: 'contact@example.com',
   *     subject: 'Inquiry from QR Code',
   *     body: 'Hello, I would like to know more about...'
   *   }
   * });
   * ```
   */
  async updateEmail(id: string, data: IUpdateEmailQRCodeRequest): Promise<IUpdateQRCodeResponse> {
    return this.updateOfType("email", id, toStructuredQrCodeBody("email", data));
  }

  /**
   * Update a WiFi QR code for easy network connection
   *
   * @param data - WiFi QR code update data
   * @returns Updated QR code with ID and landing page URL
   *
   * @example
   * ```typescript
   * const qrCode = await qrCodeClient.updateWifi("qr_code_id",{
   *   name: 'Office WiFi',
   *   templateId: 'template_123',
   *   wifi: {
   *     name: 'OfficeNetwork',
   *     authenticationType: 'WPA',
   *     password: 'secret123'
   *   }
   * });
   * ```
   */
  async updateWifi(id: string, data: IUpdateWifiQRCodeRequest): Promise<IUpdateQRCodeResponse> {
    return this.updateOfType("wifi", id, toStructuredQrCodeBody("wifi", data));
  }

  /**
   * Update a phone call QR code that initiates a call
   *
   * @param data - Call QR code update data
   * @returns Updated QR code with ID and landing page URL
   *
   * @example
   * ```typescript
   * const qrCode = await qrCodeClient.updateCall("qr_code_id",{
   *   name: 'Call Support',
   *   templateId: 'template_123',
   *   call: {
   *     phoneNumber: '+1234567890'
   *   }
   * });
   * ```
   */
  async updateCall(id: string, data: IUpdateCallQRCodeRequest): Promise<IUpdateQRCodeResponse> {
    return this.updateOfType("call", id, toStructuredQrCodeBody("call", data));
  }

  /**
   * Update an SMS QR code with pre-filled message
   *
   * @param data - SMS QR code update data
   * @returns Updated QR code with ID and landing page URL
   *
   * @example
   * ```typescript
   * const qrCode = await qrCodeClient.updateSMS("qr_code_id",{
   *   name: 'Text Us',
   *   templateId: 'template_123',
   *   sms: {
   *     phoneNumber: '+1234567890',
   *     message: 'I scanned your QR code!'
   *   }
   * });
   * ```
   */
  async updateSMS(id: string, data: IUpdateSMSQRCodeRequest): Promise<IUpdateQRCodeResponse> {
    return this.updateOfType("sms", id, toStructuredQrCodeBody("sms", data));
  }
  /**
   * Update a URL QR code that opens a website
   *
   * @param data - URL QR code update data
   * @returns Updated QR code with ID and landing page URL
   *
   * @example
   * ```typescript
   * const qrCode = await qrCodeClient.updateURL("qr_code_id",{
   *   name: 'Website Link',
   *   templateId: 'template_123',
   *   url: {
   *     url: 'https://example.com'
   *   },
   *   tag: 'marketing',
   *   refId: 'CAMPAIGN-001'
   * });
   * ```
   */
  async updateURL(id: string, data: IUpdateURLQRCodeRequest): Promise<IUpdateQRCodeResponse> {
    return this.updateOfType("url", id, toStructuredQrCodeBody("url", data));
  }
  /**
   * Update a geolocation QR code that opens map coordinates
   *
   * @param data - Geolocation QR code update data
   * @returns Updated QR code with ID and landing page URL
   *
   * @example
   * ```typescript
   * const qrCode = await qrCodeClient.updateGeolocation("qr_code_id",{
   *   name: 'Our Office Location',
   *   templateId: 'template_123',
   *   geolocation: {
   *     latitude: 40.7128,
   *     longitude: -74.0060
   *   }
   * });
   * ```
   */
  async updateGeolocation(id: string, data: IUpdateGeolocationQRCodeRequest): Promise<IUpdateQRCodeResponse> {
    return this.updateOfType("geolocation", id, toStructuredQrCodeBody("geolocation", data));
  }

  /**
   * Get a QR code by ID
   *
   * @param id - QR code ID
   * @returns QR code details
   *
   * @example
   * ```typescript
   * const qrCode = await qrCodeClient.get('qr123');
   * console.log(qrCode.name);
   * console.log(qrCode.numberOfVisitors); // landing-page visits, not scans
   * ```
   */
  async get(id: string): Promise<IGetQRCodeResponse> {
    const response = await this.http.get<IGetQRCodeResponse>(`${this.basePath}/${id}`);
    return response.result!;
  }

  /**
   * Delete a QR code
   *
   * @param id - QR code ID
   *
   * @example
   * ```typescript
   * await qrCodeClient.delete('qr123');
   * ```
   */
  async delete(id: string): Promise<void> {
    await this.http.delete<IDeleteQRCodeResponse>(`${this.basePath}/${id}`);
  }

  /**
   * List QR codes with pagination and optional filters
   *
   * @param params - Filter parameters (optional); `isEnableMonetization` is never sent
   * @param pagination - Pagination parameters (optional)
   * @returns Paginated list of QR codes
   *
   * @example
   * ```typescript
   * // List all QR codes
   * const result = await qrCodeClient.list();
   * console.log(result.items);
   * console.log(result.pagination);
   *
   * // List with filters
   * const filtered = await qrCodeClient.list(
   *   { status: 'approved', tag: 'marketing' },
   *   { page: 1, pageSize: 20 }
   * );
   * ```
   */
  async list(params?: IListParams, pagination?: IPaginationParams): Promise<IPaginationResponse<IQRCode>> {
    const response = await this.http.get<IPaginationResponse<IQRCode>>(this.basePath, {
      params: toQrCodeListQuery(params, pagination),
    });
    return response.result!;
  }

  /**
   * Visit analytics of one QR code: totals, a series per day/week/month, and
   * breakdowns by country, device, OS, browser, referrer and language
   * (`channel` is always `qr`).
   *
   * - A static QR code's image encodes its content directly, so scanning it
   *   never reaches Posty5: these numbers are visits of the code's Posty5 page
   *   (`qr_<id>`), the same visits `numberOfVisitors` counts — not scans.
   * - Bots and link-preview fetchers are excluded from `visits` and counted in
   *   `totals.botVisits` only.
   * - `uniqueVisitors` over more than one day is the sum of each day's uniques;
   *   a visitor is not recognised across days.
   * - There is no data before `meta.analyticsStartedAt`.
   * - No `breakdown` (or `"all"`) returns every breakdown the owner's plan
   *   allows and lists the rest in `meta.locked`; naming a breakdown the plan
   *   does not include, or a `from` older than the plan's history, throws
   *   `AuthorizationError` (403, "This feature is not available on your current
   *   plan."). Reading analytics costs no credits.
   * - An unknown or deleted id throws `ValidationError` (400, "The QR Code Is
   *   Not Found"), not `NotFoundError`; a code the caller may not read throws
   *   `AuthorizationError` (403, "You Have Not Permission").
   *
   * @param id - QR code ID
   * @param query - Range, interval, time zone, breakdowns and rows per breakdown
   * @returns Totals, series, breakdowns and `meta`
   *
   * @example
   * ```typescript
   * const analytics = await qrCodeClient.getAnalytics('qr123', {
   *   from: '2026-10-01',
   *   to: '2026-10-31',
   *   breakdown: ['device', 'country'],
   * });
   * console.log(analytics.totals.visits, analytics.breakdowns.device);
   * ```
   */
  async getAnalytics(id: string, query?: ILinkAnalyticsQuery): Promise<ILinkAnalyticsResponse> {
    const response = await this.http.get<ILinkAnalyticsResponse>(toLinkAnalyticsPath(this.basePath, id), {
      params: toLinkAnalyticsQuery(query),
    });
    return response.result!;
  }

  /**
   * Statistics over all of the caller's QR codes (an admin key: all codes)
   * for a range.
   *
   * - `daily` has one row per **UTC** day: `createdCount` codes created that
   *   day and `visitorsSum` visits by people to the codes' Posty5 pages made
   *   that day (bots excluded). A scan of a static code opens its content
   *   directly and is never seen by Posty5.
   * - `totals` holds the lifetime `totalQRCodes` / `totalVisitors` and the
   *   range's `visitsInRange`, `uniqueVisitorsInRange` (sum of daily uniques)
   *   and `botVisitsInRange`.
   * - `topQRCodes` is up to ten codes with the most visits in the range, each
   *   with `visitsInRange`; codes with no visits in the range are left out.
   *
   * @param query - `period` preset, or `from` / `to` (`YYYY-MM-DD`; a `Date` is
   * sent as its UTC day). Default: the last 30 days.
   * @returns The resolved `range` and the statistics `data`
   *
   * @example
   * ```typescript
   * const stats = await qrCodeClient.statistics({ period: '7d' });
   * console.log(stats.data.totals.visitsInRange, stats.data.daily);
   * ```
   */
  async statistics(query?: ILinkStatisticsQuery): Promise<IQRCodeStatisticsResponse> {
    const response = await this.http.get<IQRCodeStatisticsResponse>(toLinkStatisticsPath(this.basePath), {
      params: toLinkStatisticsQuery(query),
    });
    return response.result!;
  }

  /**
   * Create many QR codes in one call.
   *
   * Rows are sent in chunks (default and maximum 100) one after another to
   * `POST /api/qr-code/bulk`, each with `Idempotency-Key: <key>-<chunkIndex>`
   * (`options.idempotencyKey`, default a fresh UUID per call). A chunk that
   * fails with a network error or a 5xx is retried with the same key, so it
   * is created and charged once. A refused row comes back with
   * `status: "failed"` and its `errors`; created rows carry
   * `qrCodeDownloadURL`. `row` is the 1-based position in `items`.
   *
   * A failure of a whole chunk (plan gate, not enough credits, invalid
   * request, retries exhausted) stops the run and throws
   * `Posty5BulkCreateError`, whose `partialResult` holds the rows done so far.
   *
   * @param items - The QR codes to create, one per type-tagged row
   * @param options - Defaults, chunk size, idempotency key, progress callback
   * @returns Counters and one item per row, in input order
   */
  async createMany(items: IQrCodeBulkRow[], options?: IBulkCreateOptions): Promise<IBulkCreateResult> {
    return runLinkBulkCreate(
      this.http,
      {
        url: `${this.basePath}${QrCodeBulkPathsConst.bulk}`,
        toBody: (rows, opts) => ({
          items: rows,
          defaults: opts.defaults,
          // No templateType: the bulk schema does not allow it (400 "templateType is not allowed").
          createdFrom: this.http.createdFrom,
        }),
      },
      items,
      options,
    );
  }

  /**
   * Export the caller's QR codes as a CSV or JSON file, with the same filters
   * as `list`. Every CSV cell is injection-hardened by the API.
   * @param params - List filters plus `format` (`csv` by default)
   * @returns The file's bytes, content type and file name
   */
  async export(params?: IQrCodeExportParams): Promise<IBinaryResponse> {
    const { format, ...filters } = params || {};
    return this.http.getBinary(`${this.basePath}${QrCodeBulkPathsConst.export}`, {
      params: { ...toQrCodeListQuery(filters), ...(format ? { format } : {}) },
    });
  }

  /**
   * Start a background job from a CSV or JSON file of up to 5,000 rows, or
   * validate it only with `dryRun: true`. `image` sets the ZIP's image format
   * (`png` by default; `svg`/`pdf` once vector export is live) and size.
   * @returns The queued job, or the dry-run report
   */
  async createBulkJob(input: ICreateQrCodeBulkJobInput): Promise<ILinkBulkJob | IBulkDryRunReport> {
    const { image, ...rest } = input;
    return this.bulkJobs.create(rest, image);
  }

  /** Get a bulk job with its progress. */
  async getBulkJob(id: string): Promise<ILinkBulkJob> {
    return this.bulkJobs.get(id);
  }

  /** A signed, expiring download link of a finished job's `result` CSV, `errors` CSV or image `zip`. */
  async getBulkJobResultUrl(id: string, file: "result" | "errors" | "zip"): Promise<ILinkBulkJobResultUrl> {
    return this.bulkJobs.getResultUrl(id, file);
  }

  /** Cancel a queued or running job; codes already created stay. */
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

  /** POST `/api/qr-code/:type` with the body and this SDK's source fields. */
  private async createOfType(type: QrCodeTargetType, body: Record<string, unknown>): Promise<ICreateQRCodeResponse> {
    const response = await this.http.post<ICreateQRCodeResponse>(`${this.basePath}/${type}`, {
      ...body,
      ...QrCodeRequestSourceConst,
      createdFrom: this.http.createdFrom,
    });
    return response.result!;
  }

  /** PUT `/api/qr-code/:type/:id` with the body and this SDK's source fields. */
  private async updateOfType(type: QrCodeTargetType, id: string, body: Record<string, unknown>): Promise<IUpdateQRCodeResponse> {
    const response = await this.http.put<IUpdateQRCodeResponse>(`${this.basePath}/${type}/${id}`, {
      ...body,
      ...QrCodeRequestSourceConst,
      createdFrom: this.http.createdFrom,
    });
    return response.result!;
  }
}
