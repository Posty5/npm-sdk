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
link/unlink round trip. The live part never connects, imports, sends or pays.
The offline part imports `@posty5/store` from its build, so run
`npm run build:all` first.

