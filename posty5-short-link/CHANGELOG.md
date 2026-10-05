# Changelog

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
