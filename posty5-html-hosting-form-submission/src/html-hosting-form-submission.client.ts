import { HttpClient, IPaginationParams } from '@posty5/core';
import {
    ISearchFormSubmissionsResponse,
    IGetFormSubmissionResponse,
    INextPreviousSubmissionsResponse,
    IDeleteFormSubmissionResponse,
    IListParams,
} from './interfaces';

/**
 * HTML Hosting Form Submission Client for managing form submissions via Posty5 API
 */
export class HtmlHostingFormSubmissionClient {
    private http: HttpClient;
    private basePath = '/api/html-hosting-form-submission';

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
        const response = await this.http.get<INextPreviousSubmissionsResponse>(
            `${this.basePath}/${id}/next-previous`
        );
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
    async list(
        params?: IListParams,
        pagination?: IPaginationParams
    ): Promise<ISearchFormSubmissionsResponse> {
        const response = await this.http.get<ISearchFormSubmissionsResponse>(this.basePath, {
            params: {
                ...params,
                ...pagination
            }
        });
        return response.result!;
    }


    /**
     * Delete a form submission
     * @param id - Submission ID to delete
     * @returns Success response
     * @example
     * ```typescript
     * await client.delete('submission_id_123');
     * ```
     */
    async delete(id: string): Promise<void> {
        await this.http.delete<IDeleteFormSubmissionResponse>(`${this.basePath}/${id}`);
    }
}
