/**
 * Account-wide statistics of the caller's short links or QR codes
 * (`GET /api/short-link/statistics`, `GET /api/qr-code/statistics`). The
 * envelope, range and daily rows are the same for both resources and declared
 * here; each package declares its own `totals` and top-list row.
 */

/** Preset range of a statistics call. */
export type LinkStatisticsPeriod =
    "today" | // Today so far
    "7d" | // The last 7 days, today included
    "30d" | // The last 30 days, today included
    "month" | // This calendar month
    "custom"; // `from` / `to`

/** Query of `statistics()`. Every field is optional. */
export interface ILinkStatisticsQuery {
    /**
     * Preset range. Sending `from` or `to` makes it `"custom"`.
     * @default "30d"
     */
    period?: LinkStatisticsPeriod;
    /**
     * Range start, `YYYY-MM-DD`. A `Date` is sent as its UTC calendar day.
     * @default 29 days ago
     */
    from?: string | Date;
    /**
     * Range end, `YYYY-MM-DD`. A `Date` is sent as its UTC calendar day.
     * @default today
     */
    to?: string | Date;
}

/** The range the API resolved. */
export interface ILinkStatisticsRange {
    /** Range start, ISO date-time */
    from: string;
    /** Range end, ISO date-time */
    to: string;
    /** The resolved preset (`"custom"` when `from` or `to` was sent) */
    period: LinkStatisticsPeriod;
}

/** `totals` fields computed from visit events in the range. */
export interface ILinkStatisticsVisitTotals {
    /** Visits by people in the range (bots and link-preview fetchers excluded) */
    visitsInRange: number;
    /** Sum of each day's unique visitors in the range */
    uniqueVisitorsInRange: number;
    /** Bot and link-preview visits in the range */
    botVisitsInRange: number;
}

/** One UTC day of `daily`. */
export interface ILinkStatisticsDailyRow {
    /** UTC day, `YYYY-MM-DD` */
    _id: string;
    /** Records created that day */
    createdCount: number;
    /** Visits by people made that day (bots excluded) — not visitors of records created that day */
    visitorsSum: number;
}

/** Envelope of a `statistics()` answer. */
export interface ILinkStatisticsResponse<TData> {
    /** The range the API resolved */
    range: ILinkStatisticsRange;
    /** Totals, daily rows and the top list */
    data: TData;
}
