# Changelog

## 5.0.0

**Breaking.** The Online Store Builder left Posty5 and is now StorVilo (owner
decision D22, 2026-10-26).

- `ICreditUsageFilters` loses `storeId` (only operations charged for one
  store); `ICreditUsageSummaryFilters` is now the same type as
  `ICreditUsageFilters`.

## 4.4.0

- Credit transfers (read-only): `getCreditTransferEligibility`,
  `listCreditTransfers`, `getCreditTransfer`, and their interfaces
  (`ICreditTransfer`, `ICreditTransferEligibility`, …). Sending stays in the
  Posty5 dashboard — an API key cannot send credits.
- `CreditUsageKind` covers every ledger kind the API returns: `settlement`,
  `adminAdjustment`, `transferOut` and `transferIn` were missing from the
  `kind` filter.
- `ICreditUsageSummary.range` gains optional `creditsTransferredIn` and
  `creditsTransferredOut`.

## 4.3.0

First release.

- `AccountClient`: `getCurrent`, `getCredits`, `getCreditUsage`,
  `getCreditUsageSummary`, `getOperationCosts`.
- Needs `@posty5/core` 4.3.0 or later.
