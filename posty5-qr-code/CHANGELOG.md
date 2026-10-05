# Changelog

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
