import { HttpClient, IPaginationParams } from '@posty5/core';
import {
    ISearchShortLinkResponse,
    IShortLinkResponse,
    ICreateShortLinkResponse,
    IUpdateShortLinkResponse,
    IDeleteShortLinkResponse,
    ICreateShortLinkRequest,
    IUpdateShortLinkRequest,
    IListParams
} from './interfaces';

/**
 * Short Link Client for managing Short Links via Posty5 API
 */
export class ShortLinkClient {
    private http: HttpClient;
    private basePath = '/api/short-link';

    /**
     * Create a new Short Link client
     * @param http - HTTP client instance from @posty5/core
     */
    constructor(http: HttpClient) {
        this.http = http;
    }

    /**
     * Search/List Short Links with pagination and filters
     * @param params - Filter parameters
     * @param pagination - Pagination parameters
     * @returns Paginated list of short links
     */
    async list(params?: IListParams, pagination?: IPaginationParams): Promise<ISearchShortLinkResponse> {
        const response = await this.http.get<ISearchShortLinkResponse>(this.basePath, {
            params: {
                ...params,
                ...pagination
            }
        });
        return response.result!;
    }


    /**
     * Get a Short Link by ID
     * @param id - Short Link ID
     * @returns Short Link full details
     */
    async get(id: string): Promise<IShortLinkResponse> {
        const response = await this.http.get<IShortLinkResponse>(`${this.basePath}/${id}`);
        return response.result!;
    }

    /**
     * Create a new Short Link
     * @param data - Create request data
     * @returns Created short link details
     */
    async create(data: ICreateShortLinkRequest): Promise<ICreateShortLinkResponse> {
        const response = await this.http.post<ICreateShortLinkResponse>(this.basePath, {
            ...data,
            templateType: "user",
            createdFrom: "npmPackage"
        });
        return response.result!;
    }

    /**
     * Update an existing Short Link
     * @param id - Short Link ID
     * @param data - Update request data
     * @returns Updated short link details
     */
    async update(id: string, data: IUpdateShortLinkRequest): Promise<IUpdateShortLinkResponse> {
        const response = await this.http.put<IUpdateShortLinkResponse>(`${this.basePath}/${id}`, data);
        return response.result!;
    }

    /**
     * Delete a Short Link
     * @param id - Short Link ID
     */
    async delete(id: string): Promise<void> {
        await this.http.delete<IDeleteShortLinkResponse>(`${this.basePath}/${id}`);
    }
}
