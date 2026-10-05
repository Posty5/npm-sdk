# Changelog

## 4.5.0

Additive. Required by `@posty5/short-link` 4.5.0, `@posty5/qr-code` 4.5.0 and
`@posty5/webhooks` 4.5.0.

### Added

- **Bulk shapes** shared by both link clients: `IBulkDefaults`,
  `IBulkRowResult`, `IBulkCreateResult`, `IBulkCreateOptions`, `ILinkBulkJob`,
  `IBulkDryRunReport`, `ICreateLinkBulkJobInput`, `ILinkBulkJobResultUrl`,
  `IWaitForBulkJobOptions`, `ILinkExportParams`.
- **`runLinkBulkCreate`** (sequential chunks of at most 100, `Idempotency-Key:
  <key>-<chunkIndex>`, same-key retry on network error/5xx, row renumbering)
  and **`LinkBulkJobApi`** (`/api/link-bulk-jobs`: create, get, result-url,
  cancel, wait). Constants in `utils/link-bulk.config.ts`.
- **`Posty5BulkCreateError`** with `partialResult` and `cause`.

### Fixed

- `CORE_VERSION` (sent in `X-Posty5-Client`) said 4.3.0 while the package was
  4.4.0; both are now 4.5.0.

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

## 4.3.0

### Changed — behaviour fix

- **POST and PATCH are no longer retried after the server answered.** Until
  now every 5xx was retried up to three times whatever the method, so a POST
  that failed after the server had acted on it (a post published, credits
  charged) could be repeated. Idempotent methods (GET, HEAD, OPTIONS, PUT,
  DELETE) are still retried on a network error or a 5xx; POST and PATCH are
  retried only when the connection was never made (`ECONNREFUSED`,
  `ENOTFOUND`, …). The rule is `shouldRetryRequest`, exported.
- `maxRetries: 0` now disables retries (it used to fall back to 3).

### Added

- Every request sends `X-Posty5-Client: posty5-npm/<version>`. A caller may
  rename itself through `headers`; `X-API-Key` cannot be overridden that way.
- Public config options: `headers`, `createdFrom` (the label stamped on
  records the SDK creates, default `"npmPackage"`), `maxRetries`, `timeout`.
- `HttpClient.createdFrom` — read by every package's create methods.
- Exported constants: `CLIENT_HEADER_NAME`, `SDK_CLIENT_ID`, `CORE_VERSION`,
  `DEFAULT_CREATED_FROM` and the other client defaults.
