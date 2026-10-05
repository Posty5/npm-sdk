# Changelog

## 4.5.0

Needs `@posty5/core` 4.5.0 and the API release of link bulk create, bulk jobs
and export.

### Added

- **`createMany(rows, options?)`** — `POST /api/short-link/bulk` in sequential
  chunks of at most 100 with a per-chunk `Idempotency-Key`; a chunk is retried
  with the same key on a network error or 5xx; `row` is the 1-based index in
  `rows`. A whole-request failure (gate, credits) throws
  `Posty5BulkCreateError` with `partialResult`. `createMany([])` sends nothing.
- **`export(params?)`** — `GET /api/short-link/export`, CSV or JSON, list filters.
- **`createBulkJob`, `getBulkJob`, `getBulkJobResultUrl(id, "result" | "errors")`,
  `cancelBulkJob`, `waitForBulkJob`** over `/api/link-bulk-jobs` (kind `shortLinks`).

## 4.4.0

Needs `@posty5/core` 4.4.0 (the analytics and statistics types and query
helpers live there) and the API release of link + QR visit analytics; against
an older API `getAnalytics()` fails, as the route does not exist there, and
`statistics()` answers the old meaning of `daily` (links created per day).

### Added

- **`getAnalytics(id, query?)`** — `GET /api/short-link/:id/analytics`. Returns
  `ILinkAnalyticsResponse`: `totals` (`visits`, `uniqueVisitors`,
  `botVisits`), `series` (one point per `interval`), `breakdowns` and `meta`
  (`from`, `to`, `interval`, `timezone`, `source`, `analyticsStartedAt`,
  `locked`, `maxHistoryDays`). Query: `from` / `to` (`YYYY-MM-DD` or an ISO date-time;
  a `Date` is sent as its UTC day), `interval` (`day` | `week` | `month`), `tz` (IANA),
  `breakdown` (a list, joined with `,`, or `"all"`; omitted or an empty list
  means every breakdown the plan allows), `limit` (rows per breakdown, 1–50,
  default 10; the overflow is key `other`, missing values are key `unknown`).
- **`statistics(query?)`** — `GET /api/short-link/statistics`, over all your links.
  Query: `period` (`today` | `7d` | `30d` | `month` | `custom`, default `30d`)
  or `from` / `to` (`YYYY-MM-DD`; a `Date` is sent as its UTC day). Returns
  `{ range, data }`: `data.totals` (`totalLinks`, `totalVisitors`, `avgVisitorsPerLink`,
  `visitsInRange`, `uniqueVisitorsInRange`, `botVisitsInRange`), `data.daily`
  (one row per **UTC** day: `createdCount`, and `visitorsSum` = visits by
  people that day, bots excluded) and `data.topLinks` (up to ten links with the
  most visits in the range, each with `visitsInRange`; links with no visits in
  the range are left out). Deferred from 4.3.0 (TP-D6) until `daily` meant
  visits per day.
- Re-exports of the analytics and statistics types from `@posty5/core`
  (`ILinkAnalyticsQuery`, `ILinkAnalyticsResponse`, `ILinkStatisticsQuery`, …).

### Notes

- Bots and link-preview fetchers are not in `visits`; they are counted in
  `totals.botVisits`. `uniqueVisitors` over several days is the sum of each
  day's uniques. There is no data before `meta.analyticsStartedAt`.
- `breakdown: "all"` returns what the owner's plan allows and lists the rest in
  `meta.locked`; naming a breakdown the plan does not include (or a `from` older
  than the plan's history) throws `AuthorizationError` (403, "This feature is
  not available on your current plan."). `meta.maxHistoryDays` is `30` on Free
  and `null` on Starter and up; `requiredPlan` is a plan key such as `"basic"`.
  Reading analytics costs no credits.
- An unknown or deleted id throws `ValidationError` (400, "The Short Link Is Not Found"),
  not `NotFoundError`.
- `channel` is `qr` for scans of short-link QR images downloaded after the
  API release, `link` otherwise (older images count as `link`).

## 4.3.0

Targets the API release of the link + QR truth pass: `androidUrl`, `iosUrl`,
the `isEnableLandingPage` keep-on-update rule and the `pageInfo.title` filter
need that API; against an older API, `androidUrl` / `iosUrl` are refused as
unknown keys.

### Added

- **`androidUrl` / `iosUrl`** on `create()` and `update()` — the Android and iOS
  destinations opened instead of `baseUrl`. `https:`, `http:` or an app scheme
  (`myapp://…`); never `javascript:`, `data:`, `vbscript:`, `file:`, `about:`,
  `blob:`. On create, an empty value falls back to the target page's `al:*`
  meta. On update, a present key wins (`""`/`null` clears it); an absent key is
  re-derived when `baseUrl` changes and kept when it does not.
- **`isEnableLandingPage`** on `create()`, and as a `list()` filter.
- **`"pageInfo.title"`** list filter.
- `IShortLinkFullDetailsResponse.isSupportAndroidDeepUrl` /
  `isSupportIOSDeepUrl` (always `!!androidUrl` / `!!iosUrl`).

### Changed

- **`templateId` is required** on `ICreateShortLinkRequest` and
  `IUpdateShortLinkRequest`. The API refuses every API-key create or update
  without it, so code that omitted it never worked; it now fails to compile.
- `get()` returns `IGetShortLinkResponse` (full details, deep links included);
  `ICreateShortLinkResponse` and `IUpdateShortLinkResponse` are the full
  details too — what the API already returned. Both are supersets of the old
  types.
- `update()` documents that an omitted `isEnableLandingPage` keeps the stored
  value.
- The client copies the request instead of sending it as is; the caller's
  object is never modified.

### Deprecated

- **`isEnableMonetization`** (create, update, list, response). The API never
  accepted it — its validation answered 400. The client now deletes it from
  every body and query, so old code compiles and stops failing. Removed in
  5.0.0.
- **`"pageinfo.title"`** list filter (lower-case `i`): it never matched the
  stored field. `list()` sends it as `"pageInfo.title"`; an explicit
  `"pageInfo.title"` wins. Removed in 5.0.0.

### Documentation

- README: monetization removed; `templateId` stated as required at the top of
  "Create"; landing page, deep links and the upgrade note documented.
