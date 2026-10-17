/** The routes `AccountClient` reads. Three API bases, one purpose: who the key is and what it can spend. */
export const ACCOUNT_PATHS = {
  current: "/api/api-key/current",
  credits: "/api/user/current/credits",
  creditUsage: "/api/user/current/credit-usage",
  creditUsageSummary: "/api/user/current/credit-usage/summary",
  operationCosts: "/api/plans/operation-costs",
  /** Credit transfers between Posty5 accounts — read-only for an API key (sending is session-only). */
  creditTransfers: "/api/credit-transfers",
  creditTransferEligibility: "/api/credit-transfers/eligibility",
} as const;
