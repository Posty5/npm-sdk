/**
 * An SDK error turned into a sentence the model can act on (mcp-server
 * feature, decision 6). Tool failures are results with `isError: true`, never
 * protocol errors.
 */
import { AuthenticationError, AuthorizationError, ConflictError, NetworkError, NotFoundError, Posty5Error, RateLimitError, ServerError, ValidationError, VersionRequiredError } from "@posty5/core";
import type { ToolOutcomeStatus } from "../interfaces/hooks.interface";
import { ToolInputError } from "./tool-input.error";

export interface IMappedToolError {
  status: Extract<ToolOutcomeStatus, "toolError" | "failed" | "rateLimited">;
  code: string;
  message: string;
}

const UNKNOWN_OUTCOME =
  "The request did not complete, so its outcome is unknown — it may or may not have taken effect. Check (for example with the matching list or get tool) before retrying, and retry with the same idempotencyKey.";

function detailOf(error: any): string {
  const errors = error?.errors ?? error?.details;
  if (Array.isArray(errors) && errors.length) {
    return errors.map((item: any) => item?.message || item?.msg || JSON.stringify(item)).join("; ");
  }
  return error?.message || "";
}

export function mapToolError(error: unknown, isWrite: boolean): IMappedToolError {
  if (error instanceof ToolInputError) {
    return { status: "toolError", code: "invalidArguments", message: error.message };
  }
  if (error instanceof AuthenticationError) {
    return { status: "toolError", code: "unauthenticated", message: "This Posty5 connection is no longer valid (the API key or MCP link was revoked or rotated). Create a new MCP link in Posty5 → Account settings → API keys." };
  }
  if (error instanceof AuthorizationError) {
    return { status: "toolError", code: "forbidden", message: `Not allowed for this account or plan. ${detailOf(error)}`.trim() };
  }
  if (error instanceof NotFoundError) {
    return { status: "toolError", code: "notFound", message: `Not found. Check the id with the matching list tool. ${detailOf(error)}`.trim() };
  }
  if (error instanceof RateLimitError) {
    const wait = error.retryAfter ? ` Retry after ${error.retryAfter} seconds.` : "";
    return { status: "rateLimited", code: "rateLimited", message: `Too many requests.${wait}` };
  }
  if (error instanceof ConflictError) {
    const now = error.currentVersion >= 0 ? ` Its current version is ${error.currentVersion}.` : "";
    return {
      status: "toolError",
      code: "versionConflict",
      message: `This item has changed since you read it, so nothing was saved.${now} Re-read it with the matching get tool, check the latest values, then retry with its new version (__v) if the change still applies.`,
    };
  }
  if (error instanceof VersionRequiredError) {
    return { status: "toolError", code: "versionRequired", message: "This write needs the item's current version. Read it with the matching get tool and pass its __v as version." };
  }
  if (error instanceof ValidationError) {
    const message = detailOf(error);
    const credits = /credit/i.test(message) ? " See account_get_credits and account_get_operation_costs." : "";
    return { status: "toolError", code: "invalid", message: `${message || "The request was refused."}${credits}` };
  }
  if (error instanceof NetworkError || error instanceof ServerError) {
    return { status: "failed", code: error instanceof NetworkError ? "network" : "server", message: isWrite ? UNKNOWN_OUTCOME : "Posty5 could not be reached or failed. Try again shortly." };
  }
  if (error instanceof Posty5Error) {
    return { status: "toolError", code: "posty5", message: detailOf(error) || "Posty5 refused the request." };
  }
  return { status: "failed", code: "unexpected", message: (error as any)?.message || "Unexpected error." };
}
