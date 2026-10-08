import { HttpClient, IBulkVersionedResult, IPaginationParams, assertVersion, assertVersions, withVersion } from "@posty5/core";
import {
  ISearchFormSubmissionsResponse,
  IGetFormSubmissionResponse,
  INextPreviousSubmissionsResponse,
  IDeleteFormSubmissionResponse,
  IListParams,
  IChangeStatusRequest,
  IChangeStatusResponse,
} from "./interfaces";

/**
 * HTML Hosting Form Submission Client for managing form submissions via Posty5 API
 */
export class HtmlHostingFormSubmissionClient {
  private http: HttpClient;
  private basePath = "/api/html-hosting-form-submission";

  /**
   * Create a new HTML Hosting Form Submission client
   * @param http - HTTP client instance from @posty5/core
   */
  constructor(http: HttpClient) {
    this.http = http;
  }

  /**
   * Get a form submission by ID
   * @param id - Submission ID
   * @returns Form submission details with populated HTML hosting info
   * @example
   * ```typescript
   * const submission = await client.get('submission_id_123');
   * console.log(submission.data); // Form data
   * console.log(submission.status); // Current status
   * ```
   */
  async get(id: string): Promise<IGetFormSubmissionResponse> {
    const response = await this.http.get<IGetFormSubmissionResponse>(`${this.basePath}/${id}`);
    return response.result!;
  }

  /**
   * Get next and previous form submissions for navigation
   * @param id - Current submission ID
   * @returns Next and previous submission references (if they exist)
   * @example
   * ```typescript
   * const navigation = await client.getNextPrevious('submission_id_123');
   * if (navigation.previous) {
   *   console.log('Previous:', navigation.previous._id);
   * }
   * if (navigation.next) {
   *   console.log('Next:', navigation.next._id);
   * }
   * ```
   */
  async getNextPrevious(id: string): Promise<INextPreviousSubmissionsResponse> {
    const response = await this.http.get<INextPreviousSubmissionsResponse>(`${this.basePath}/${id}/next-previous`);
    return response.result!;
  }

  /**
   * List form submissions with pagination and optional filters
   * @param params - Pagination parameters with optional filters (htmlHostingId, formId, status, search)
   * @returns Paginated list of form submissions
   * @example
   * ```typescript
   * const result = await client.list({
   *   page: 1,
   *   limit: 10,
   *   htmlHostingId: 'html_hosting_id',
   *   status: 'New'
   * });
   * console.log(result.items); // Array of submissions
   * console.log(result.total); // Total count
   * ```
   */
  async list(params?: IListParams, pagination?: IPaginationParams): Promise<ISearchFormSubmissionsResponse> {
    const response = await this.http.get<ISearchFormSubmissionsResponse>(this.basePath, {
      params: {
        ...params,
        ...pagination,
      },
    });
    return response.result!;
  }

  /**
   * Change the status of a form submission
   * @param id - Submission ID
   * @param request - Status change request (status, rejectedReason, notes)
   * @param version - The submission's `__v` as you read it. A stale one throws `ConflictError`.
   * @returns `{ _id, __v }` with the new version (plus whatever the API answers)
   * @example
   * ```typescript
   * const s = await client.get('submission_id_123');
   * const result = await client.changeStatus('submission_id_123', {
   *   status: 'Approved',
   *   notes: 'Looks good!'
   * }, s.__v);
   * console.log(result.__v); // the new version
   * ```
   */
  async changeStatus(id: string, request: IChangeStatusRequest, version: number): Promise<IChangeStatusResponse> {
    assertVersion(version);
    const response = await this.http.put<IChangeStatusResponse>(`${this.basePath}/${id}/status`, request, { version });
    return withVersion(response, id);
  }

  /**
   * Delete a form submission
   * @param id - Submission ID to delete
   * @returns Success response
   * @example
   * ```typescript
   * await client.delete('submission_id_123', submission.__v);
   * ```
   */
  async delete(id: string, version: number): Promise<void> {
    assertVersion(version);
    await this.http.delete<IDeleteFormSubmissionResponse>(`${this.basePath}/${id}`, { version });
  }

  /**
   * Delete many submissions. Each id needs its `__v`; the items whose
   * versions match are deleted, the rest come back in `skipped` (with
   * `currentVersion` on a conflict). Throws `ConflictError` only when nothing
   * was deleted and at least one item conflicted.
   * @param versions - `{ [submissionId]: __v }`, one entry per submission to delete
   * @example
   * ```typescript
   * const { applied, skipped } = await client.deleteBulk({ [a._id]: a.__v, [b._id]: b.__v });
   * ```
   */
  async deleteBulk(versions: Record<string, number>): Promise<IBulkVersionedResult> {
    assertVersions(versions);
    const ids = Object.keys(versions);
    const response = await this.http.delete<Partial<IBulkVersionedResult>>(`${this.basePath}/bulk`, { data: { ids, versions } });
    const result = response.result ?? {};
    return {
      ...result,
      applied: result.applied ?? [],
      skipped: result.skipped ?? [],
      versions: response.versions ?? result.versions ?? {},
    };
  }
}
