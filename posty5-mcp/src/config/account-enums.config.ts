/** Closed value lists the account tools accept, mirrored from the SDK unions. */
// Every ledger kind the API returns; `transferOut` / `transferIn` are credit transfers (credit-transfer).
export const CREDIT_USAGE_KINDS = ["charge", "grant", "settlement", "carryOver", "adminAdjustment", "refund", "transferOut", "transferIn"] as const;

/** `account_list_credit_transfers` filters. */
export const CREDIT_TRANSFER_DIRECTIONS = ["sent", "received", "all"] as const;
export const CREDIT_TRANSFER_STATUSES = ["pending", "debited", "completed", "failed", "reversed"] as const;
