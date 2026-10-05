# 12 - Testing and Debugging

- Jest/ts-jest is configured at the root.
- The root suite is integration-oriented and may call the configured API with media fixtures.
- Never run live tests with production credentials or against production unless explicitly authorized.
- Build/typecheck every affected package; peer dependency errors can be missed by root tests.

## Debugging order

1. Reproduce with the smallest owning module or route/API call.
2. Inspect the exact entrypoint and boundary contract.
3. Check configuration names without printing values.
4. Run the narrow check, then the project build/typecheck.
5. Record any check that could not run and why.

## Store dropshipping tests

`__tests__/store-suppliers.test.ts` has an offline part (a stub stands in for
`HttpClient` and pins every route, verb, body and encoding) and a live part that
runs only when `POSTY5_API_KEY` and `POSTY5_TEST_STORE_ID` are set.
`POSTY5_TEST_SUPPLIER_INTEGRATION_ID` (a **test-mode** connection),
`POSTY5_TEST_SUPPLIER_PRODUCT_ID` and `POSTY5_TEST_PRODUCT_ID` enable the
balance/test/browse/preview reads, the automation round trip (restored in
`finally`) and the link → update → sync → unlink round trip. Guarded, each
skipped visibly without its variable:

| Variable | Enables |
| --- | --- |
| `POSTY5_TEST_ALLOW_CHARGES=true` | `importProducts` of one draft (charges credits; the product is deleted afterwards). |
| `POSTY5_TEST_ORDER_ID` + `POSTY5_TEST_GROUP_KEY` | `submitGroup`, `retry`, `pay` on a part of the test-mode connection; each must answer `testMode`. |
| `POSTY5_TEST_ALLOW_PART_TAKEOVER=true` (with the two above) | `cancel` then `fulfilGroupManually` — ends the fixture part's supplier flow, so re-make it afterwards. |

The live part never connects, disconnects or writes a credential.
The offline part imports `@posty5/store` from its build, so run
`npm run build:all` first.

## Short-link and QR-code tests

`__tests__/short-link.test.ts` and `__tests__/qr-code.test.ts` follow the same
shape: an offline part on the shared `__tests__/helpers/stub-http.helper.ts`
(no `isEnableMonetization` in any body or query, no `options.text` on
structured QR types, `pageinfo.title` sent as `pageInfo.title`, `templateId`
required — pinned by `@ts-expect-error`, so a type check of the file is part of
the test), and a live part that runs only when `POSTY5_API_KEY` is set. The
live S13 / truth-pass blocks (deep-link round trip, re-derive on a `baseUrl`
change, `refId` and landing-page filters, server-built QR text) need the API's
link + QR truth pass deployed on the stack `POSTY5_BASE_URL` points at. Both
import the packages from their builds.

## Link analytics tests (VA)

`__tests__/link-analytics.test.ts` (offline) pins `toLinkAnalyticsQuery` from
`@posty5/core`; its `@ts-expect-error` lines make a type check of the file part
of the test. `short-link.test.ts` and `qr-code.test.ts` pin the
`getAnalytics()` route and query offline, and their live `VA — getAnalytics`
blocks need the API's visit-analytics routes on the stack `POSTY5_BASE_URL`
points at (zeros and `meta.analyticsStartedAt` on a new record, `"all"`, an
explicit list, 400 on a bad `interval`). The same files pin `statistics()`
offline (route, `period` / `from` / `to`) and live (`VA — statistics`: visit
totals, UTC-day `_id`s, top rows with `visitsInRange > 0`). Build core first:
the packages import it from its `dist`.
