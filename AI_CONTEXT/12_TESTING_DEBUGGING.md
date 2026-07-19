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
