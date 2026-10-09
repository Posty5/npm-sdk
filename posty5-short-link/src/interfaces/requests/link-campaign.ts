import { ILinkUtm } from './link-rules';

/** Palette keys a campaign may carry. */
export type LinkCampaignColor =
    | 'slate' | 'red' | 'orange' | 'amber' | 'green' | 'teal' | 'blue' | 'indigo' | 'purple' | 'pink';

/** `POST /api/link-campaign`. Feature key `urlShortener.campaigns` (plan-gated). */
export interface ICreateLinkCampaignRequest {
    /** 1 – the API's name limit, trimmed */
    name: string;
    description?: string | null;
    color?: LinkCampaignColor | null;
    /** Copied into a link's empty UTM fields when the link is saved with this campaign. */
    utm?: ILinkUtm | null;
    /** `true` archives (hidden from pickers; links keep working). */
    archived?: boolean;
}

/** `PUT /api/link-campaign/:id`. Omitted keys keep the stored value. */
export interface IUpdateLinkCampaignRequest {
    name?: string;
    description?: string | null;
    color?: LinkCampaignColor | null;
    utm?: ILinkUtm | null;
    /** `true` archives, `false` restores. */
    archived?: boolean;
}

/** `GET /api/link-campaign` filters. */
export interface ILinkCampaignListParams {
    archived?: boolean;
    /** Name search */
    term?: string;
}

/** `DELETE /api/link-campaign/:id` options. */
export interface IDeleteLinkCampaignOptions {
    /** Detach the campaign's links instead of refusing while links use it. */
    detach?: boolean;
}
