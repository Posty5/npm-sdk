# Changelog

## 4.4.0

Additive. Required by `@posty5/short-link` 4.4.0 and `@posty5/qr-code` 4.4.0.
(4.3.0 is the MCP release, which lands first.)

### Added

- **Link analytics types**, shared by `ShortLinkClient.getAnalytics()` and
  `QRCodeClient.getAnalytics()`: `ILinkAnalyticsQuery`,
  `ILinkAnalyticsResponse` (`totals`, `series`, `breakdowns`, `meta`),
  `ILinkAnalyticsTotals`, `ILinkAnalyticsSeriesPoint`,
  `ILinkAnalyticsBreakdownRow`, `ILinkAnalyticsLockedBreakdown`,
  `ILinkAnalyticsMeta`, and the unions `LinkAnalyticsBreakdown`,
  `LinkAnalyticsInterval`, `LinkAnalyticsSource`.
- **Link statistics types**, shared by `ShortLinkClient.statistics()` and
  `QRCodeClient.statistics()`: `ILinkStatisticsQuery` (`period`, `from`, `to`),
  `ILinkStatisticsResponse<TData>` (`range`, `data`), `ILinkStatisticsRange`,
  `ILinkStatisticsVisitTotals` (`visitsInRange`, `uniqueVisitorsInRange`,
  `botVisitsInRange`), `ILinkStatisticsDailyRow` (one UTC day), and
  `LinkStatisticsPeriod`.
- `LinkAnalyticsBreakdownsConst` and `LinkAnalyticsIntervalsConst` — the
  breakdown names and intervals the API accepts, as lists.
- `toLinkAnalyticsQuery(query)` — the query string of an analytics call: dates
  as `YYYY-MM-DD`, a breakdown list joined with `,`, `"all"` as is, an empty
  list and absent fields left out. `toLinkAnalyticsPath(basePath, id)`.
- `toLinkStatisticsQuery(query)` and `toLinkStatisticsPath(basePath)` — the
  same for a statistics call.
- `toIsoDateString(value)` — a `Date` as its UTC calendar day (`YYYY-MM-DD`);
  a string unchanged.
