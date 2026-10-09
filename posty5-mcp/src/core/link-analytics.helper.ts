import { z } from "zod";
import { LINK_ANALYTICS_ALL_BREAKDOWNS, LINK_ANALYTICS_BREAKDOWNS, LINK_ANALYTICS_INTERVALS, LINK_ANALYTICS_LIMIT } from "../config/link-analytics.config";
import { idField } from "./define-tool.helper";

/** What both analytics tools tell the agent about the numbers, before it reads them. */
export const LINK_ANALYTICS_CAVEATS =
  "Bots and link-preview crawlers are excluded and reported apart as botVisits. Unique visitors are counted per day and summed over the range. " +
  "Data starts at meta.analyticsStartedAt; earlier visits exist only in the lifetime visit count. Days are in meta.timezone. " +
  "meta.locked lists breakdowns the owner's plan does not include, with the plan that unlocks them (requiredPlan): tell the user which plan instead of retrying. " +
  "meta.maxHistoryDays limits how far back the plan reaches (null = no limit).";

/** The `getAnalytics()` input shared by `short_link_get_analytics` and `qr_code_get_analytics`. */
export function linkAnalyticsInput(idDescription: string) {
  return z.object({
    id: idField(idDescription),
    from: z.string().optional().describe("First day, YYYY-MM-DD (or an ISO date-time). Default: 30 days ago."),
    to: z.string().optional().describe("Last day, YYYY-MM-DD (or an ISO date-time). Default: today. At most 400 days after from."),
    interval: z.enum(LINK_ANALYTICS_INTERVALS).optional().describe("Bucket size of the series. Default: day."),
    tz: z.string().optional().describe('IANA time zone for day boundaries, e.g. "Africa/Cairo". Default: UTC.'),
    breakdown: z
      .union([z.literal(LINK_ANALYTICS_ALL_BREAKDOWNS), z.array(z.enum(LINK_ANALYTICS_BREAKDOWNS))])
      .optional()
      .describe('"all" (the default) or a list of breakdowns. Naming one the plan does not include is refused with 403.'),
    limit: z
      .number()
      .int()
      .min(LINK_ANALYTICS_LIMIT.min)
      .max(LINK_ANALYTICS_LIMIT.max)
      .optional()
      .describe(`Rows per breakdown (default ${LINK_ANALYTICS_LIMIT.default}); the rest is summed under "other".`),
  });
}

/** Splits the tool arguments into the record id and the SDK query. */
export function toLinkAnalyticsArgs<T extends { id: string }>(args: T): { id: string; query: Omit<T, "id"> } {
  const { id, ...query } = args;
  return { id, query };
}
