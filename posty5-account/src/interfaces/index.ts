/** `key`: lists show only records this key created. `account`: every record of the owner. */
export type ApiKeyRecordScope = "key" | "account";

/** What an MCP connection on the key may do. */
export type McpAccessLevel = "read" | "write" | "full";

/** The owner's credit balance. */
export interface IAccountCredits {
  /** Granted by the plan for the current period. */
  granted: number;
  /** Bought as top-ups; survives renewal. */
  purchased?: number;
  used: number;
  /** Owed by deferred charges; never spendable. */
  debt: number;
  /** granted + purchased − used, floored at 0. */
  remaining: number;
  /** What can be spent now: remaining − debt, floored at 0. */
  spendable: number;
  periodStartedAt?: string;
  periodEndsAt?: string;
}

/** `GET /api/api-key/current` — who the calling API key is. Carries no email, phone or address. */
export interface IAccountCurrent {
  apiKey: {
    _id: string;
    name?: string;
    recordScope: ApiKeyRecordScope;
    createdAt?: string;
    lastUsedAt: string | null;
  };
  user: {
    _id: string;
    userName?: string;
    fullName?: string;
    isDeveloper: boolean;
  };
  plan: {
    key?: "free" | "basic" | "pro" | "business" | "enterprise";
    name?: string;
    startedAt?: string;
    endedAt?: string;
  } | null;
  credits: IAccountCredits;
  /** Present when the key has an MCP connection. */
  mcp: { access: McpAccessLevel; toolsets: string[] } | null;
}

/** `GET /api/user/current/credits`. */
export interface IAccountCreditsResponse {
  credits: IAccountCredits;
  /** Per-feature usage counters for the period. */
  usageStats: Record<string, unknown>[];
}

/** Filters for the credit history and its summary. */
export interface ICreditUsageFilters {
  /** e.g. `socialMediaPublisher`. */
  module?: string;
  operationType?: string;
  kind?: "charge" | "grant" | "carryOver" | "refund";
  /** `false` lists deferred charges not yet paid. */
  settled?: boolean;
  /** Only operations charged for this store. */
  storeId?: string;
  /** `YYYY-MM-DD`, with `toDate`. */
  fromDate?: string;
  toDate?: string;
}

/** Cursor paging for the credit history. */
export interface ICreditUsagePaging {
  pageSize?: number;
  /** Opaque cursor from the previous page. */
  cursor?: string;
}

/** Filters for the summary — the history's, except by store (the summary ignores it). */
export type ICreditUsageSummaryFilters = Omit<ICreditUsageFilters, "storeId">;

/** What a ledger row is about, e.g. an order. */
export interface ICreditUsageReference {
  type: string;
  id: string;
  /** e.g. an order number. */
  label?: string;
}

/** One credit-ledger row, as `GET /api/user/current/credit-usage` answers it. */
export interface ICreditUsageRow {
  _id: string;
  direction: "in" | "out";
  /** e.g. `"-50"` or `"+1000"`. */
  signedCredits: string;
  kind: string;
  module: string;
  operationType: string;
  reason?: string;
  credits: number;
  balanceBefore?: number;
  balanceAfter?: number;
  settled: boolean;
  settledAt?: string | null;
  reference?: ICreditUsageReference | null;
  /** Present when a staff member, not the payer, performed the operation. */
  actorUserId?: { _id: string; userName?: string; fullName?: string } | null;
  createdAt: string;
  updatedAt?: string;
}

/** A page of credit history (cursor-paged). */
export interface ICreditUsagePage {
  items: ICreditUsageRow[];
  pagination: Record<string, unknown>;
}

/** The current balance, and totals over the filtered history under `range`. */
export interface ICreditUsageSummary {
  /** What can be spent now. */
  balance: number;
  remaining: number;
  debt: number;
  granted: number;
  purchased: number;
  used: number;
  /** How `remaining` divides; the two add up to it. */
  remainingBreakdown: { monthly: number; purchased: number };
  periodStartedAt?: string;
  periodEndsAt?: string;
  range: {
    operations: number;
    creditsSpent: number;
    creditsOwed: number;
    creditsAdded: number;
  };
}

/** One paid operation and its live price. */
export interface IOperationCost {
  operationType: string;
  featurePath: string;
  name: string;
  description?: string;
  cost: number;
  isFree: boolean;
  charged: boolean;
  enabled: boolean;
}

/** `GET /api/plans/operation-costs` — the live price list. */
export interface IOperationCosts {
  currency: "credits";
  operationsCount: number;
  modules: { module: string; moduleName: string; operations: IOperationCost[] }[];
}
