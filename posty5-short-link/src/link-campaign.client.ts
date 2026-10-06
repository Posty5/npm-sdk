import { HttpClient, IPaginationParams } from '@posty5/core';
import {
    ICreateLinkCampaignRequest,
    IDeleteLinkCampaignOptions,
    ILinkCampaignDetailsResponse,
    ILinkCampaignListParams,
    ILinkCampaignResponse,
    ISearchLinkCampaignResponse,
    IUpdateLinkCampaignRequest
} from './interfaces';
import { LinkCampaignBasePathConst } from './short-link.config';

/**
 * Link campaigns: named groups of short links with optional default UTM
 * (copied into a link's empty UTM fields when it is saved with the campaign).
 * Create and update need the `urlShortener.campaigns` feature; a plan without
 * it gets the API's 403 as `AuthorizationError`.
 */
export class LinkCampaignClient {
    private http: HttpClient;
    private basePath = LinkCampaignBasePathConst;

    constructor(http: HttpClient) {
        this.http = http;
    }

    /** List the caller's campaigns. */
    async list(params?: ILinkCampaignListParams, pagination?: IPaginationParams): Promise<ISearchLinkCampaignResponse> {
        const response = await this.http.get<ISearchLinkCampaignResponse>(this.basePath, {
            params: { ...params, ...pagination }
        });
        return response.result!;
    }

    /** Get a campaign with `linkCount` and `totalVisits`. */
    async get(id: string): Promise<ILinkCampaignDetailsResponse> {
        const response = await this.http.get<ILinkCampaignDetailsResponse>(`${this.basePath}/${id}`);
        return response.result!;
    }

    /** Create a campaign. */
    async create(data: ICreateLinkCampaignRequest): Promise<ILinkCampaignResponse> {
        const response = await this.http.post<ILinkCampaignResponse>(this.basePath, {
            ...data,
            createdFrom: this.http.createdFrom,
        });
        return response.result!;
    }

    /** Update a campaign; omitted keys keep the stored value. */
    async update(id: string, data: IUpdateLinkCampaignRequest): Promise<ILinkCampaignResponse> {
        const response = await this.http.put<ILinkCampaignResponse>(`${this.basePath}/${id}`, data);
        return response.result!;
    }

    /**
     * Delete a campaign.
     * @param options.detach - `true` detaches the campaign's links first
     */
    async delete(id: string, options?: IDeleteLinkCampaignOptions): Promise<void> {
        await this.http.delete(`${this.basePath}/${id}`, {
            params: options?.detach ? { detach: true } : undefined
        });
    }
}
