# Changelog

## 4.7.0 — QR content types (static)

Needs the API release of QR content types; an older API answers "Schema not
found for this type", surfaced unchanged.

### Added

- `createVCard` / `updateVCard`, `createEvent` / `updateEvent`,
  `createWhatsApp` / `updateWhatsApp`, `createReview` / `updateReview`,
  `createSocial` / `updateSocial` — `POST /api/qr-code/<type>` and
  `PUT /api/qr-code/<type>/:id` for `vcard`, `event`, `whatsapp`, `review`,
  `social`. They send `qrCodeTarget` only; the API builds the encoded text.
  `mode` and `access` pass through like the other types.
- Targets `IQRCodeVCardTarget` (+ `IQRCodeVCardPhone`, `IQRCodeVCardAddress`),
  `IQRCodeEventTarget`, `IQRCodeWhatsappTarget`, `IQRCodeReviewTarget`,
  `IQRCodeSocialTarget` (+ `IQRCodeSocialProfile`); request types
  `ICreate<Type>QRCodeRequest` / `IUpdate<Type>QRCodeRequest`; unions
  `QrCodeVCardPhoneKind`, `QrCodeReviewPlatform`, `QrCodeSocialPlatform`;
  `QrCodeTargetType` extended. Responses' `qrCodeTarget` carries the new
  sub-objects.
- `event.startsAt` / `endsAt` accept `Date | string`; a `Date` is sent as ISO.
- Dynamic-only types (QT pass 2, same unpublished 4.7.0):
  `createAppStore` / `updateAppStore` (`appStore: { androidUrl, iosUrl, fallbackUrl }`)
  and `createFile(data, content)` / `updateFile(id, data, content?)`, which run
  `POST /api/qr-code/file/upload-url` → PUT to the signed URL (`uploadToR2`,
  60 s) → `POST /api/qr-code/file` / `PUT /api/qr-code/file/:id` with
  `bucketFilePath`. Content is a `Blob` or an `ArrayBuffer` / `Buffer` (then
  `file.mimeType` is required — `ValidationError` before any request).
  `updateFile` without content keeps the stored file. The PUT is retried once
  on a network error; a failure after the URL expired throws `NetworkError`
  saying so. Types `IQRCodeAppStoreTarget`, `IQRCodeFileTarget`,
  `IQRCodeFileInput`, `IQRCodeFileUploadTicket`, `QrCodeFileContent`,
  `QrCodeFileMimeType`; `QrCodeTargetType` gains `appStore`, `file`.
- `social` takes up to 12 profiles on a dynamic code (one on a static code).

## 4.6.0 — dynamic QR codes

Needs the API release of dynamic QR codes; an older API rejects `mode`.

### Added

- **`mode?: "static" | "dynamic"`** (`QRCodeMode`) on every create and update
  request and as a `list()` filter. Sent only when defined, so calls without
  it send exactly what they sent before. Omitted on create → the API makes a
  static code; omitted on update → the stored mode is kept.
- A dynamic code's image encodes its Posty5 link (`qrCodeLandingPageURL`), so
  the target can change later without reprinting. `createFreeText` /
  `updateFreeText` send no `options.text` for a dynamic code.
- Wi-Fi codes cannot be dynamic: `ICreateWifiQRCodeRequest` /
  `IUpdateWifiQRCodeRequest` accept `mode?: "static"` only (the API's 400
  "This QR code type cannot be dynamic" is surfaced unchanged).
- `IQRCode.mode` and `IQRCode.dynamicSince` on responses.
- **`access?: IQRCodeAccess | null`** — scan rules for dynamic codes
  (`activeFrom`, `expiresAt` as ISO string or `Date`, `maxVisits`,
  `fallbackUrl`) on create/update requests, sent only when defined. On update,
  omitted keeps the rules, an object replaces them whole, `null` (or an
  all-empty object) clears them. Starter plan or above (403 surfaced unchanged);
  static codes get the API's 400. Wi-Fi request types take no `access`.
  `IQRCode.access` (`IQRCodeAccessResponse`, each value or `null`) on responses.

## 4.5.0 — bulk create, bulk jobs, export

Needs `@posty5/core` 4.5.0 and the API release of QR bulk generation.

### Added

- **`createMany(items, options?)`** — `POST /api/qr-code/bulk`; rows are
  `IQrCodeBulkRow`, a union over the seven types (`{ type, target, mode?, name?,
  customId?, tag?, refId?, templateId?, fileName? }`). Chunking, keys, retry
  and `Posty5BulkCreateError` as in `@posty5/short-link`.
- **`export(params?)`** — `GET /api/qr-code/export`.
- **Bulk jobs** (kind `qrCodes`): `createBulkJob` (with `image: { format, sizePx }`),
  `getBulkJob`, `getBulkJobResultUrl(id, "result" | "errors" | "zip")`,
  `cancelBulkJob`, `waitForBulkJob`.

## 4.4.0

Needs `@posty5/core` 4.4.0 (the analytics and statistics types and query
helpers live there) and the API release of link + QR visit analytics; against
an older API `getAnalytics()` fails, as the route does not exist there, and
`statistics()` answers the old meaning of `daily` (codes created per day).

### Added

- **`getAnalytics(id, query?)`** — `GET /api/qr-code/:id/analytics`. Returns
  `ILinkAnalyticsResponse`: `totals` (`visits`, `uniqueVisitors`,
  `botVisits`), `series` (one point per `interval`), `breakdowns` and `meta`
  (`from`, `to`, `interval`, `timezone`, `source`, `analyticsStartedAt`,
  `locked`, `maxHistoryDays`). Query: `from` / `to` (`YYYY-MM-DD` or an ISO date-time;
  a `Date` is sent as its UTC day), `interval` (`day` | `week` | `month`), `tz` (IANA),
  `breakdown` (a list, joined with `,`, or `"all"`; omitted or an empty list
  means every breakdown the plan allows), `limit` (rows per breakdown, 1–50,
  default 10; the overflow is key `other`, missing values are key `unknown`).
- **`statistics(query?)`** — `GET /api/qr-code/statistics`, over all your codes.
  Query: `period` (`today` | `7d` | `30d` | `month` | `custom`, default `30d`)
  or `from` / `to` (`YYYY-MM-DD`; a `Date` is sent as its UTC day). Returns
  `{ range, data }`: `data.totals` (`totalQRCodes`, `totalVisitors`, `avgVisitorsPerQRCode`,
  `visitsInRange`, `uniqueVisitorsInRange`, `botVisitsInRange`), `data.daily`
  (one row per **UTC** day: `createdCount`, and `visitorsSum` = visits by
  people that day, bots excluded) and `data.topQRCodes` (up to ten codes with the
  most visits in the range, each with `visitsInRange`; codes with no visits in
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
- An unknown or deleted id throws `ValidationError` (400, "The QR Code Is Not Found"),
  not `NotFoundError`.
- A static QR code's image encodes its content directly, so scanning it never
  reaches Posty5: the numbers are visits of the code's Posty5 page, the same
  visits `numberOfVisitors` counts — not scans. `channel` is always `qr`.

## 4.3.0

Targets the API release of the link + QR truth pass, in which the API builds
the text every code encodes from `qrCodeTarget` and ignores a client-sent
`options.text`.

### Changed

- **The SDK no longer builds the encoded text.** `createEmail`, `createWifi`,
  `createCall`, `createSMS`, `createURL`, `createGeolocation` and their
  `update*` methods send `qrCodeTarget` only — no `options.text`. The API
  builds and escapes it, so a subject with `&`, a Wi-Fi password with `;` or an
  omitted SMS message (which the SDK used to send as `body=undefined`) no longer
  produces a code that opens the wrong thing. `createFreeText` /
  `updateFreeText` still send `options.text = text`.
- **Requests are no longer mutated.** The typed methods used to set the
  content key (`email`, `wifi`, …) to `undefined` on the caller's object.
- `createFreeText` / `updateFreeText` forward every field of the request
  (`isEnableLandingPage` included) instead of a fixed list.
- `templateId` (already required in the types) is documented as required for
  every API-key call.

### Added

- **`isEnableLandingPage`** on every create and update request, and as a
  `list()` filter.
- `IQRCodeTarget.url` (the URL target was missing from the response type).
- `QrCodeStructuredTargetType`.
- TSDoc: `numberOfVisitors` / `lastVisitorDate` count visits to the code's
  Posty5 page, not scans of a downloaded image; `pageInfo` is required when
  `isEnableLandingPage` is true (it used to say "when monetization is
  enabled"); URL targets must be `http://` or `https://`.

### Deprecated

- **`isEnableMonetization`** (request, list, response). The API never accepted
  it — its validation answered 400 whenever a request carried it. The client
  now deletes it from every body and query.
  Removed in 5.0.0.

### Documentation

- README: "dynamic QR", scan analytics, short-link and contact-card claims
  removed; what `numberOfVisitors` counts explained; upgrade note added.
- `examples.ts` rewritten against the real client (it called `create`,
  `update` and `lookup`, which do not exist, and never compiled).
