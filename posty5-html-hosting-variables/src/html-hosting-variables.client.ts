import { HttpClient, IPaginationParams } from '@posty5/core';
import {
    ICreateHtmlHostingVariableRequest,
    ISearchHtmlHostingVariablesResponse,
    IGetHtmlHostingVariableResponse,
    ICreateHtmlHostingVariableResponse,
    IUpdateHtmlHostingVariableResponse,
    IDeleteHtmlHostingVariableResponse,
    IListParams,
} from './interfaces';

/**
 * HTML Hosting Variables Client for managing HTML page variables via Posty5 API
 */
export class HtmlHostingVariablesClient {
    private http: HttpClient;
    private basePath = '/api/html-hosting-variables';

    /**
     * Create a new HTML Hosting Variables client
     * @param http - HTTP client instance from @posty5/core
     */
    constructor(http: HttpClient) {
        this.http = http;
    }

    /**
     * Create a new HTML hosting variable
     * @param data - Variable data (name, key, value)
     * @returns Success response
     * @example
     * ```typescript
     * await client.create({
     *   name: 'API Key',
     *   key: 'api_key',
     *   value: 'sk_test_123456'
     * });
     * ```
     */
    async create(data: ICreateHtmlHostingVariableRequest): Promise<void> {
        if (!data.key.startsWith("pst5_")) {
            throw new Error(`Key must start with 'pst5_', change to pst5_${data.key}`);
        }
        await this.http.post<ICreateHtmlHostingVariableResponse>(this.basePath, {
            ...data,
            createdFrom: "npmPackage"

        });
    }

    /**
     * Get an HTML hosting variable by ID
     * @param id - Variable ID
     * @returns Variable details
     * @example
     * ```typescript
     * const variable = await client.get('variable_id_123');
     * console.log(variable.key, variable.value);
     * ```
     */
    async get(id: string): Promise<IGetHtmlHostingVariableResponse> {
        const response = await this.http.get<IGetHtmlHostingVariableResponse>(`${this.basePath}/${id}`);
        return response.result!;
    }

    /**
     * Update an HTML hosting variable
     * @param id - Variable ID to update
     * @param data - Updated variable data (name, key, value)
     * @returns Success response
     * @example
     * ```typescript
     * await client.update('variable_id_123', {
     *   name: 'Updated API Key',
     *   key: 'api_key',
     *   value: 'sk_live_789012'
     * });
     * ```
     */
    async update(id: string, data: ICreateHtmlHostingVariableRequest): Promise<void> {
        if (!data.key.startsWith("pst5_")) {
            throw new Error(`Key must start with 'pst5_', change to pst5_${data.key}`);
        }
        await this.http.put<IUpdateHtmlHostingVariableResponse>(`${this.basePath}/${id}`, data);
    }

    /**
     * Delete an HTML hosting variable
     * @param id - Variable ID to delete
     * @returns Success response
     * @example
     * ```typescript
     * await client.delete('variable_id_123');
     * ```
     */
    async delete(id: string): Promise<void> {
        await this.http.delete<IDeleteHtmlHostingVariableResponse>(`${this.basePath}/${id}`);
    }

    /**
     * List HTML hosting variables with pagination and optional search
     * @param params - Pagination parameters with optional search query  
     * @returns Paginated list of variables
     * @example
     * ```typescript
     * const result = await client.list({
     *   page: 1,
     *   limit: 10,
     *   search: 'api'
     * });
     * console.log(result.items); // Array of variables
     * console.log(result.total); // Total count
     * ```
     */
    async list(params?: IListParams, pagination?: IPaginationParams): Promise<ISearchHtmlHostingVariablesResponse> {
        const response = await this.http.get<ISearchHtmlHostingVariablesResponse>(this.basePath, {
            params: {
                ...params,
                ...pagination
            }
        });
        return response.result!;
    }
}
