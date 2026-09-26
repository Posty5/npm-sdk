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

