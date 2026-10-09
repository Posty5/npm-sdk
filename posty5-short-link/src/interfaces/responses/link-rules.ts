import { ILinkPixel, ILinkRoutingRule, ILinkUtm, ILinkVariant } from '../requests/link-rules';

/** `access` as responses carry it: never the password, only `hasPassword`. */
export interface ILinkAccess {
    activeFrom: string | null;
    expiresAt: string | null;
    maxVisits: number | null;
    fallbackUrl: string | null;
    hasPassword?: boolean;
}

/** Destination health state (system-written except `enabled`). */
export type LinkHealthStatus = 'unknown' | 'healthy' | 'unhealthy';

export interface ILinkHealthLastResult {
    url: string;
    httpStatus?: number;
    errorCode?: string;
}

/** Destination health monitor state of a link. */
export interface ILinkHealth {
    enabled: boolean;
    status: LinkHealthStatus;
    checkedAt?: string | null;
    lastOkAt?: string | null;
    failingSince?: string | null;
    consecutiveFailures?: number;
    lastResult?: ILinkHealthLastResult | null;
}

/** List-row health: only the status. */
export interface ILinkHealthSummary {
    status?: LinkHealthStatus;
    enabled?: boolean;
}

/** Rule sections returned by `get()`, `create()` and `update()`. */
export interface IShortLinkRulesResponse {
    access?: ILinkAccess | null;
    /** Each rule carries its server-assigned `id`. */
    routing?: ILinkRoutingRule[];
    variants?: ILinkVariant[];
    utm?: ILinkUtm | null;
    pixels?: ILinkPixel[];
    pixelsAcknowledgedAt?: string | null;
}
