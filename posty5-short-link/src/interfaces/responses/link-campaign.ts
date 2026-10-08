import { IPaginationResponse } from '@posty5/core';
import { LinkCampaignColor } from '../requests/link-campaign';
import { ILinkUtm } from '../requests/link-rules';

/** A link campaign as the API returns it. */
export interface ILinkCampaignResponse {
    _id: string;
    /** Document version: pass it to versioned writes (`update`, `delete`, ...). */
    __v: number;
    userId: string;
    apiKeyId: string | null;
    name: string;
    description: string | null;
    color: LinkCampaignColor | null;
    utm: ILinkUtm | null;
    archivedAt: string | null;
    isArchived: boolean;
    createdFrom: string;
    createdAt?: string;
    updatedAt?: string;
}

/** `get()`: the campaign with its link totals. */
export interface ILinkCampaignDetailsResponse extends ILinkCampaignResponse {
    linkCount: number;
    /** Sum of the links' `numberOfVisitors`. */
    totalVisits: number;
}

export type ISearchLinkCampaignResponse = IPaginationResponse<ILinkCampaignResponse>;
