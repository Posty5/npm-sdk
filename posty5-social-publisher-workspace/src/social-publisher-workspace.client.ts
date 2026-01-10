import { HttpClient, IPaginationParams } from '@posty5/core';
import {
    ICreateSocialPublisherWorkspaceRequest,
    IUpdateSocialPublisherWorkspaceRequest,
    ISearchSocialPublisherWorkspaceParams,
    ISearchSocialPublisherWorkspaceResponse,
    ISocialPublisherWorkspaceResponse,
    ICreateSocialPublisherWorkspaceResponse,
    IUpdateSocialPublisherWorkspaceResponse,
    IDeleteSocialPublisherWorkspaceResponse
} from './interfaces';

/**
 * Social Publisher Organization Client
 */
export class SocialPublisherWorkspaceClient {
    private http: HttpClient;
    private basePath = '/api/social-publisher-workspace';

    /**
     * Create client
     * @param http - HttpClient instance
     */
    constructor(http: HttpClient) {
        this.http = http;
    }

    /**
     * Search organizations
     * @param params - Search filters
     * @param pagination - Pagination options
     */
    async search(params?: ISearchSocialPublisherWorkspaceParams, pagination?: IPaginationParams): Promise<ISearchSocialPublisherWorkspaceResponse> {
        const response = await this.http.get<ISearchSocialPublisherWorkspaceResponse>(this.basePath, {
            params: {
                ...params,
                ...pagination
            }
        });
        return response.result!;
    }

    /**
     * Get organization by ID
     * @param id - Organization ID
     */
    async get(id: string): Promise<ISocialPublisherWorkspaceResponse> {
        const response = await this.http.get<ISocialPublisherWorkspaceResponse>(`${this.basePath}/${id}`);
        return response.result!;
    }

    /**
     * Create organization
     * @param data - Organization data
     * @returns Organization ID
     */
    async create(data: ICreateSocialPublisherWorkspaceRequest): Promise<ICreateSocialPublisherWorkspaceResponse> {
        const response = await this.http.post<ICreateSocialPublisherWorkspaceResponse>(this.basePath, {
            ...data,
            createdFrom: "npmPackage"
        });
        return response.result!;
    }

    /**
     * Update organization
     * @param id - Organization ID
     * @param data - Organization data
     */
    async update(id: string, data: IUpdateSocialPublisherWorkspaceRequest): Promise<IUpdateSocialPublisherWorkspaceResponse> {
        const response = await this.http.put<IUpdateSocialPublisherWorkspaceResponse>(`${this.basePath}/${id}`, data);
        return response.result!;
    }

    /**
     * Delete organization
     * @param id - Organization ID
     */
    async delete(id: string): Promise<void> {
        await this.http.delete<IDeleteSocialPublisherWorkspaceResponse>(`${this.basePath}/${id}`);
    }
}
