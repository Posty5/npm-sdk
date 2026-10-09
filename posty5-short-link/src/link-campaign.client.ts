import { HttpClient, IPaginationParams, assertVersion, withVersion } from '@posty5/core';
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

    /**
     * Update a campaign; omitted keys keep the stored value. `version` is the
     * campaign's `__v`; a stale one throws `ConflictError`.
     */
    async update(id: string, data: IUpdateLinkCampaignRequest, version: number): Promise<ILinkCampaignResponse> {
        assertVersion(version);
        const response = await this.http.put<ILinkCampaignResponse>(`${this.basePath}/${id}`, data, { version });
        return withVersion(response, id);
    }

    /**
     * Delete a campaign.
     * @param version - The campaign's `__v`
     * @param options.detach - `true` detaches the campaign's links first
     */
    async delete(id: string, version: number, options?: IDeleteLinkCampaignOptions): Promise<void> {
        assertVersion(version);
        await this.http.delete(`${this.basePath}/${id}`, {
            params: options?.detach ? { detach: true } : undefined,
            version,
        });
    }
}
