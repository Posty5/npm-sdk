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

/**
 * Every kind of credit-ledger row the API returns. `transferOut` / `transferIn`
 * are credits sent to / received from another Posty5 account (4.4.0).
 */
export type CreditUsageKind =
  | "charge"
  | "grant"
  | "settlement"
  | "carryOver"
  | "adminAdjustment"
  | "refund"
  | "transferOut"
  | "transferIn";

/** Filters for the credit history and its summary. */
export interface ICreditUsageFilters {
  /** e.g. `socialMediaPublisher`. */
  module?: string;
  operationType?: string;
  kind?: CreditUsageKind;
  /** `false` lists deferred charges not yet paid. */
  settled?: boolean;
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

/** Filters for the summary — the same as the history's. */
export type ICreditUsageSummaryFilters = ICreditUsageFilters;

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
  /** One of `CreditUsageKind`; typed as a string so a kind added later never breaks a caller. */
  kind: CreditUsageKind | (string & {});
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
    /** Credits added in the range, including credits received by transfer. */
    creditsAdded: number;
    /** Credits received from other Posty5 accounts in the range (4.4.0). */
    creditsTransferredIn?: number;
    /** Credits sent to other Posty5 accounts in the range — never counted as spent (4.4.0). */
    creditsTransferredOut?: number;
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

// ─── Credit transfers (4.4.0) ────────────────────────────────────────────────

/** A transfer's lifecycle. `pending` / `debited` are still completing. */
export type CreditTransferStatus = "pending" | "debited" | "completed" | "failed" | "reversed";

/** Which side of a transfer the key owner is on. */
export type CreditTransferDirection = "sent" | "received";

/** The refusal codes of `/api/credit-transfers`. */
export type CreditTransferRefusalCode =
  | "PLAN_REQUIRED"
  | "PLAN_EXPIRED"
  | "SESSION_REQUIRED"
  | "AMOUNT_INVALID"
  | "INSUFFICIENT"
  | "DAILY_LIMIT"
  | "SELF_TRANSFER"
  | "RECIPIENT_UNAVAILABLE";

/** `GET /api/credit-transfers/eligibility`. Sending itself is done from the Posty5 dashboard only. */
export interface ICreditTransferEligibility {
  canSend: boolean;
  sendRefusal?: {
    code: CreditTransferRefusalCode;
    message: string;
    /** The lowest plan that can send: `enterprise` (shown as Business). */
    requiredPlan?: string;
  };
  spendable: number;
  transferable: number;
  minAmount: number;
  maxAmount: number;
  /** Present only when a daily cap is configured. */
  dailyRemaining?: number;
  canReceive: boolean;
  /** 1 on Free; `null` when unlimited. */
  freeReceiveLimit: number | null;
  freeReceivesUsed: number;
}

/** The other party of a transfer, masked by the API. */
export interface ICreditTransferCounterparty {
  /** First name plus last initial, e.g. `Ahmed N.`; may be empty. */
  displayName: string;
  /** e.g. `a***d@g***.com`. */
  emailMasked: string;
}

/** One credit transfer the key owner sent or received. */
export interface ICreditTransfer {
  _id: string;
  __v: number;
  direction: CreditTransferDirection;
  amount: number;
  note?: string;
  status: CreditTransferStatus;
  counterparty: ICreditTransferCounterparty;
  createdAt: string;
  completedAt?: string;
  reversedAt?: string;
}

/** Filters for `listCreditTransfers`. */
export interface ICreditTransferFilters {
  direction?: "sent" | "received" | "all";
  status?: CreditTransferStatus;
  /** `YYYY-MM-DD`, with `toDate`. */
  fromDate?: string;
  toDate?: string;
}

/** A page of credit transfers (cursor-paged, like the credit history). */
export interface ICreditTransferPage {
  items: ICreditTransfer[];
  pagination: Record<string, unknown>;
}
