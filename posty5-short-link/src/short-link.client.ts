import { HttpClient, IPaginationParams } from '@posty5/core';
import {
    ISearchShortLinkResponse,
    IGetShortLinkResponse,
    ICreateShortLinkResponse,
    IUpdateShortLinkResponse,
    IDeleteShortLinkResponse,
    ICreateShortLinkRequest,
    IUpdateShortLinkRequest,
    IListParams
} from './interfaces';
import { toShortLinkBody, toShortLinkListQuery } from './helpers/short-link-request.helper';
import { ShortLinkCreateSourceConst } from './short-link.config';

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
            ...ShortLinkCreateSourceConst
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
}
