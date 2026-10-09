import { ILinkAnalyticsQuery } from '../types/link-analytics.interface';
import { ILinkStatisticsQuery } from '../types/link-statistics.interface';
import { toIsoDateString } from './date.helper';
import { LinkAnalyticsQueryConst } from './link-analytics.config';

/**
 * The query string of `getAnalytics()`: dates as `YYYY-MM-DD`, an explicit
 * breakdown list joined with `,`, `"all"` as is, an empty list and absent
 * fields left out (the API defaults apply: no `breakdown` means every
 * breakdown the plan allows). The caller's object is not
 * modified.
 */
export function toLinkAnalyticsQuery(query?: ILinkAnalyticsQuery): Record<string, string | number> {
    const params: Record<string, string | number> = {};
    if (!query) {
        return params;
    }
    if (query.from != null) {
        params.from = toIsoDateString(query.from);
    }
    if (query.to != null) {
        params.to = toIsoDateString(query.to);
    }
    if (query.interval != null) {
        params.interval = query.interval;
    }
    if (query.tz != null) {
        params.tz = query.tz;
    }
    if (query.breakdown === LinkAnalyticsQueryConst.allBreakdowns) {
        params.breakdown = query.breakdown;
    } else if (Array.isArray(query.breakdown) && query.breakdown.length > 0) {
        params.breakdown = query.breakdown.join(LinkAnalyticsQueryConst.breakdownSeparator);
    }
    if (query.limit != null) {
        params.limit = query.limit;
    }
    return params;
}

/**
 * The query string of `statistics()`: dates as `YYYY-MM-DD`, `period` as
 * given, absent fields left out (the API defaults to the last 30 days).
 */
export function toLinkStatisticsQuery(query?: ILinkStatisticsQuery): Record<string, string> {
    const params: Record<string, string> = {};
    if (!query) {
        return params;
    }
    if (query.period != null) {
        params.period = query.period;
    }
    if (query.from != null) {
        params.from = toIsoDateString(query.from);
    }
    if (query.to != null) {
        params.to = toIsoDateString(query.to);
    }
    return params;
}

/** The statistics path of a resource: `<basePath>/statistics`. */
export function toLinkStatisticsPath(basePath: string): string {
    return `${basePath}/${LinkAnalyticsQueryConst.statisticsPathSegment}`;
}

/** The analytics path of one record: `<basePath>/<id>/analytics`. */
export function toLinkAnalyticsPath(basePath: string, id: string): string {
    return `${basePath}/${id}/${LinkAnalyticsQueryConst.pathSegment}`;
}
