import { z } from "zod";

/**
 * A `YYYY-MM-DD` date argument, for the store lists' `fromDate` / `toDate`
 * range (both ends are needed — the API ignores one alone).
 */
export function dateField(description: string) {
  return z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD")
    .describe(description);
}
