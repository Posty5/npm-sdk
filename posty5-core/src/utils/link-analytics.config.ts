import { LinkAnalyticsBreakdown, LinkAnalyticsInterval } from '../types/link-analytics.interface';

/** Request constants shared by the short-link and QR-code `getAnalytics()`. */
export const LinkAnalyticsQueryConst = {
    /** Path segment after `/:id` */
    pathSegment: 'analytics',
    /** Path segment of the account-wide statistics route, after the base path */
    statisticsPathSegment: 'statistics',
    /** `breakdown` value asking for every breakdown the plan allows */
    allBreakdowns: 'all',
    /** Separator of an explicit `breakdown` list */
    breakdownSeparator: ',',
} as const;

/** Every breakdown name the API accepts (contract C2). */
export const LinkAnalyticsBreakdownsConst: readonly LinkAnalyticsBreakdown[] = [
    'country',
    'device',
    'os',
    'browser',
    'referrer',
    'channel',
    'language',
    'variant',
    'rule',
];

/** Every `interval` the API accepts. */
export const LinkAnalyticsIntervalsConst: readonly LinkAnalyticsInterval[] = ['day', 'week', 'month'];
