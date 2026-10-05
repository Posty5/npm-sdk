# 18 - Decisions

## D01 - Feature packages share @posty5/core rather than duplicating transport.

**Status:** observed in current source. Revisit only with compatibility, migration, and verification impact documented.

## D02 - Packages publish CJS, ESM, and type declarations from dist.

**Status:** observed in current source. Revisit only with compatibility, migration, and verification impact documented.

## D03 - The root package is private and orchestrates eight workspaces.

**Status:** observed in current source. Revisit only with compatibility, migration, and verification impact documented.

## D04 - Feature clients expose typed domain operations rather than raw endpoint strings.

**Status:** observed in current source. Revisit only with compatibility, migration, and verification impact documented.

## D05 - ROUTE_INDEX is empty because this repository is a client SDK.

**Status:** observed in current source. Revisit only with compatibility, migration, and verification impact documented.

## D06 - A request key the API never accepted is deprecated and stripped, not deleted, in a minor.

**Status:** decided 2026-10-05 (link + QR truth pass, owner decision TP-D5 default).
`isEnableMonetization` on `@posty5/short-link` and `@posty5/qr-code` was typed,
documented and sent, but every API Joi schema rejects it, so any request that
carried it answered 400. In 4.3.0 it stays in the types as `@deprecated` and the
clients delete it from every body and query (`ShortLinkDeprecatedRequestKeysConst`,
`QrCodeDeprecatedRequestKeysConst`), so old code compiles and stops failing. It
is deleted in 5.0.0. Deleting it in the minor would break compilation for code
that only ever named it. The legacy list key `"pageinfo.title"` follows the same
rule: deprecated, sent as `"pageInfo.title"`.

## D07 - The server, not the SDK, builds the text a QR code encodes.

**Status:** decided 2026-10-05 (link + QR truth pass, feature contract "API
changes (QR code)"). The API builds `options.text` for all seven types from
`qrCodeTarget` with one escaping encoder and ignores a client-sent value, so its
URL safety checks inspect exactly what the image encodes. `QRCodeClient` sends
`qrCodeTarget` only for `email`, `wifi`, `call`, `sms`, `url`, `geolocation`; free
text keeps `options.text = text` (the same value as `freeText.text`). The SDK's
old encoders were unescaped and sent `undefined` for omitted fields. Never add a
client-side encoder back as the source of the stored text.

## D08 - No `statistics()` in the SDKs yet.

**Status:** deferred 2026-10-05 (owner decision TP-D6 default). The statistics
route groups links by **creation** date, and contract C2 of the link + QR
roadmap redefines `daily`. Publishing today's meaning in a typed client would
freeze a meaning the visitor-analytics feature (VA) changes; VA's SDK task adds
the method after C2.

Do not invent historical rationale. Record evidence-based current decisions and label unknown rationale explicitly.
