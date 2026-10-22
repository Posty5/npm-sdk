import { z } from "zod";

/**
 * A `YYYY-MM-DD` date argument: the one date field every tool uses (the
 * `fromDate` / `toDate` ranges of the store lists, the account history, and the
 * short-link, QR code, HTML page and post lists). Where it is a range, both ends
 * are needed — the API ignores one alone.
 */
export function dateField(description: string) {
  return z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD")
    .describe(description);
}
