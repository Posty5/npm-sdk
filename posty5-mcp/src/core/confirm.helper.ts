/**
 * The answer of a `confirm` tool called without `confirm: true`: what it
 * would do and, when the action is paid, its live price. Nothing upstream
 * changes.
 */
import type { IToolDefinition, IToolRunContext } from "../interfaces/tool.interface";

export interface IConfirmationPreview {
  awaitingConfirmation: true;
  action: string;
  details?: unknown;
  cost?: { credits: number; isFree: boolean; operation: string };
  next: string;
}

const NEXT_STEP = "Nothing was done. Ask the user to approve this action; if they agree, call this tool again with the same arguments and confirm: true.";

async function liveCost(featurePath: string, ctx: IToolRunContext): Promise<IConfirmationPreview["cost"]> {
  try {
    const costs = await ctx.clients.account.getOperationCosts(true);
    for (const module of costs.modules) {
      const operation = module.operations.find((item) => item.featurePath === featurePath);
      if (operation) return { credits: operation.cost, isFree: operation.isFree, operation: operation.name };
    }
  } catch {
    // The price is a courtesy; the description alone still lets the user decide.
  }
  return undefined;
}

export async function previewConfirmation(tool: IToolDefinition, args: Record<string, unknown>, ctx: IToolRunContext): Promise<IConfirmationPreview> {
  const described = await tool.confirm!.describe(args, ctx);
  const { action, details } = typeof described === "string" ? { action: described, details: undefined } : described;
  const cost = tool.confirm!.costFeaturePath ? await liveCost(tool.confirm!.costFeaturePath, ctx) : undefined;
  return { awaitingConfirmation: true, action, ...(details !== undefined ? { details } : {}), ...(cost ? { cost } : {}), next: NEXT_STEP };
}
