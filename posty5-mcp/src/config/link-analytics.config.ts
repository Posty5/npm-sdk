/**
 * Visit analytics value lists (roadmap C2), mirrored from `@posty5/core` 5.0.0
 * `LinkAnalyticsBreakdownsConst` / `LinkAnalyticsIntervalsConst` — core does
 * not export them from its index. Checked against the API's analytics Joi
 * (`link-tools-service/.../link-visit/core/services/analytics/analytics.config.ts`).
 */
export const LINK_ANALYTICS_BREAKDOWNS = ["country", "device", "os", "browser", "referrer", "channel", "language", "variant", "rule"] as const;
export const LINK_ANALYTICS_INTERVALS = ["day", "week", "month"] as const;
export const LINK_ANALYTICS_ALL_BREAKDOWNS = "all";
/** Rows per breakdown the API accepts; the rest is folded into `other`. */
export const LINK_ANALYTICS_LIMIT = { min: 1, max: 50, default: 10 } as const;
