/**
 * Visit analytics of one short link or one QR code
 * (`GET /api/short-link/:id/analytics`, `GET /api/qr-code/:id/analytics`).
 * Both resources answer the same shape, so it is declared once here and
 * re-exported by `@posty5/short-link` and `@posty5/qr-code`.
 */

/** A dimension visits can be broken down by. */
export type LinkAnalyticsBreakdown =
    "country" | // Upper-case ISO-2 country code of the visitor
    "device" | // desktop, mobile, tablet, …
    "os" | // Operating system
    "browser" | // Browser family
    "referrer" | // Referrer host
    "channel" | // "link" (click) or "qr" (scan)
    "language" | // Primary browser language
    "variant" | // A/B variant (empty until link campaigns ship)
    "rule"; // Routing rule (empty until link campaigns ship)

/** Width of one point of `series`. */
export type LinkAnalyticsInterval = "day" | "week" | "month";

/** Where the answer was computed from. */
export type LinkAnalyticsSource =
    "events" | // Raw visit events (exact days in the requested time zone)
    "rollup" | // Daily rollups (UTC days)
    "mixed"; // Rollups for rolled-up days, events for the rest

/** Query of `getAnalytics()`. Every field is optional. */
export interface ILinkAnalyticsQuery {
    /**
     * First day of the range, as `YYYY-MM-DD` or an ISO date-time. A `Date`
     * is sent as its UTC calendar day.
     * @default 30 days before `to`
     */
    from?: string | Date;
    /**
     * Last day of the range, as `YYYY-MM-DD` or an ISO date-time. A `Date` is
     * sent as its UTC calendar day. A future date is clamped to now by the API.
     * @default today
     */
    to?: string | Date;
    /**
     * Width of one point of `series`.
     * @default "day"
     */
    interval?: LinkAnalyticsInterval;
    /**
     * IANA time zone the days are counted in (e.g. `"Africa/Cairo"`). Not
     * validated client-side; an unknown zone answers 400.
     * @default the owner's time zone, else `"UTC"`
     */
    tz?: string;
    /**
     * Breakdowns to return. Omitted (or an empty list, which is not sent) and
     * `"all"` both return every breakdown the owner's plan allows and list the
     * others in `meta.locked`; naming a breakdown the plan does not include
     * answers 403.
     * @default every breakdown the plan allows
     */
    breakdown?: LinkAnalyticsBreakdown[] | "all";
    /**
     * Rows per breakdown, 1–50; the overflow is summed into an `other` row.
     * Not validated client-side; out of range answers 400.
     * @default 10
     */
    limit?: number;
}

/** Visit totals over the whole range. */
export interface ILinkAnalyticsTotals {
    /** Human visits; bots and link-preview fetchers are not counted here */
    visits: number;
    /** Sum of each day's unique visitors (uniques are not de-duplicated across days) */
    uniqueVisitors: number;
    /** Visits by bots, crawlers and link-preview fetchers */
    botVisits: number;
}

/** One point of the series. */
export interface ILinkAnalyticsSeriesPoint {
    /** First day of the bucket, `YYYY-MM-DD` in `meta.timezone` */
    date: string;
    /** Human visits in the bucket */
    visits: number;
    /** Sum of each day's unique visitors in the bucket */
    uniqueVisitors: number;
}

/** One row of a breakdown. */
export interface ILinkAnalyticsBreakdownRow {
    /** The dimension's value (e.g. `"EG"`, `"mobile"`); `"unknown"` when the visit had none; `"other"` for the rows past `limit` */
    key: string;
    /** Human visits with this value */
    visits: number;
    /** Sum of each day's unique visitors with this value */
    uniqueVisitors: number;
}

/** A breakdown the owner's plan does not include. */
export interface ILinkAnalyticsLockedBreakdown {
    /** The breakdown left out of `breakdowns` */
    breakdown: LinkAnalyticsBreakdown;
    /** Key of the lowest plan that includes it, e.g. `"basic"` (Starter) */
    requiredPlan: string;
}

/** How the answer was computed. */
export interface ILinkAnalyticsMeta {
    /** First day of the range answered, `YYYY-MM-DD` in `timezone` */
    from: string;
    /** Last day of the range answered, `YYYY-MM-DD` in `timezone` */
    to: string;
    /** Width of one point of `series` */
    interval: LinkAnalyticsInterval;
    /** Time zone the days are counted in; `"UTC"` when the range reaches past raw-event retention */
    timezone: string;
    /** Where the answer was computed from */
    source: LinkAnalyticsSource;
    /** When Posty5 started recording visit events; there is no data before it */
    analyticsStartedAt: string;
    /** Breakdowns `breakdown: "all"` left out because of the owner's plan */
    locked: ILinkAnalyticsLockedBreakdown[];
    /** How far back the owner's plan can read, in days: `30` on Free, `null` (unlimited) on Starter and up */
    maxHistoryDays: number | null;
}

/** Answer of `getAnalytics()`. */
export interface ILinkAnalyticsResponse {
    /** Totals over the range */
    totals: ILinkAnalyticsTotals;
    /** One point per `interval` over the range */
    series: ILinkAnalyticsSeriesPoint[];
    /** One list per requested (and allowed) breakdown */
    breakdowns: Partial<Record<LinkAnalyticsBreakdown, ILinkAnalyticsBreakdownRow[]>>;
    /** How the answer was computed */
    meta: ILinkAnalyticsMeta;
}
