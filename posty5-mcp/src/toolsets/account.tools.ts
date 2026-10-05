import { z } from "zod";
import { CREDIT_USAGE_KINDS } from "../config/account-enums.config";
import { cursorFields, defineTool } from "../core/define-tool.helper";
import type { IToolDefinition } from "../interfaces/tool.interface";

const DATE_FIELD = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD");

export const ACCOUNT_TOOLS: IToolDefinition[] = [
  defineTool({
    name: "account_get_current",
    toolset: "account",
    access: "read",
    title: "Who am I",
    description:
      "The Posty5 account this connection acts for: user, plan, and what the connection may do (its access level and toolsets). Call it first in a session.",
    input: z.object({}),
    run: (_args, { clients }) => clients.account.getCurrent(),
  }),
  defineTool({
    name: "account_get_credits",
    toolset: "account",
    access: "read",
    title: "Credit balance",
    description: "The account's credit balance and what this period has used. Check it before paid actions.",
    input: z.object({}),
    run: (_args, { clients }) => clients.account.getCredits(),
  }),
  defineTool({
    name: "account_get_credit_usage",
    toolset: "account",
    access: "read",
    title: "Credit usage history",
    description:
      "The credit ledger, newest first: every charge, grant, carry-over and refund. Filter by module, operation, kind, store or date range (fromDate and toDate together). Pages with cursor.",
    input: z.object({
      module: z.string().optional().describe("Module key, e.g. socialMediaPublisher."),
      operationType: z.string().optional().describe("Operation key, from account_get_operation_costs."),
      kind: z.enum(CREDIT_USAGE_KINDS).optional(),
      settled: z.boolean().optional().describe("false lists deferred charges not yet paid."),
      storeId: z.string().optional().describe("Only operations charged for this store (from store_list)."),
      fromDate: DATE_FIELD.optional().describe("YYYY-MM-DD, with toDate."),
      toDate: DATE_FIELD.optional().describe("YYYY-MM-DD, with fromDate."),
      ...cursorFields(),
    }),
    run: ({ cursor, pageSize, ...filters }, { clients }) => clients.account.getCreditUsage(filters, { cursor, pageSize }),
  }),
  defineTool({
    name: "account_get_operation_costs",
    toolset: "account",
    access: "read",
    title: "Operation prices",
    description: "The live credit price of every paid operation, grouped by module. Prices change — read them here rather than assuming them.",
    input: z.object({
      activeOnly: z.boolean().optional().describe("Default true: only operations currently charged."),
    }),
    run: ({ activeOnly }, { clients }) => clients.account.getOperationCosts(activeOnly ?? true),
  }),
];
