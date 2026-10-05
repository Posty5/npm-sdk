import { z } from "zod";
import { MAX_PAGE_SIZE } from "../config/limits.config";
import type { IToolDefinition } from "../interfaces/tool.interface";
import { ToolInputError } from "./tool-input.error";

/**
 * Declare a tool. An identity function: it exists so a toolset file gets its
 * `run(args)` typed from its `input` schema without spelling the generic.
 */
export function defineTool<TInput extends z.ZodObject<any>>(definition: IToolDefinition<TInput>): IToolDefinition<TInput> {
  return definition;
}

/** A required id argument, described with where the id comes from. */
export function idField(description: string) {
  return z.string().min(1).describe(description);
}

/** Page-numbered paging fields, for SDK list methods that take `IPaginationParams`. */
export function pageFields() {
  return {
    page: z.number().int().min(1).optional().describe("Page number, from 1. Default 1."),
    pageSize: z.number().int().min(1).max(MAX_PAGE_SIZE).optional().describe(`Rows per page, at most ${MAX_PAGE_SIZE}. Default 10.`),
  };
}

/** Cursor paging fields, for the store's list methods. */
export function cursorFields() {
  return {
    cursor: z.string().optional().describe("The `nextCursor` from the previous page; omit for the first page."),
    pageSize: z.number().int().min(1).max(MAX_PAGE_SIZE).optional().describe(`Rows per page, at most ${MAX_PAGE_SIZE}. Default 10.`),
  };
}

/** `{ page, pageSize }` out of a tool's arguments, for an SDK `pagination` parameter. */
export function pickPage(args: { page?: number; pageSize?: number }): { page?: number; pageSize?: number } {
  const out: { page?: number; pageSize?: number } = {};
  if (args.page !== undefined) out.page = args.page;
  if (args.pageSize !== undefined) out.pageSize = args.pageSize;
  return out;
}

/** Throws a `ToolInputError` naming every field in `fields` that `args` lacks; `context` says why they are needed (e.g. `type "email"`). */
export function requireFields(args: Record<string, unknown>, fields: readonly string[], context: string): void {
  const missing = fields.filter((field) => args[field] === undefined || args[field] === null || args[field] === "");
  if (missing.length) throw new ToolInputError(`${context} needs: ${missing.join(", ")}.`);
}

/**
 * Throws a `ToolInputError` unless at least one of `fields` is set — for
 * partial updates, where the API refuses a body that changes nothing.
 * `context` names the call (e.g. `store_shipping_update_country`).
 */
export function requireAtLeastOne(args: Record<string, unknown>, fields: readonly string[], context: string): void {
  const set = fields.some((field) => args[field] !== undefined);
  if (!set) throw new ToolInputError(`${context} changes nothing: give at least one of ${fields.join(", ")}.`);
}

/** Throws a `ToolInputError` unless exactly one of `fields` is set; returns the one that is. */
export function requireExactlyOne<K extends string>(args: Partial<Record<K, unknown>>, fields: readonly K[]): K {
  const set = fields.filter((field) => args[field] !== undefined && args[field] !== null && args[field] !== "");
  if (set.length !== 1) throw new ToolInputError(`Give exactly one of: ${fields.join(", ")}.`);
  return set[0];
}

/** The tool's arguments without the paging fields, for an SDK `params` filter object. */
export function withoutPaging<T extends Record<string, unknown>>(args: T): Omit<T, "page" | "pageSize" | "cursor"> {
  const { page: _page, pageSize: _pageSize, cursor: _cursor, ...rest } = args as any;
  return rest;
}
