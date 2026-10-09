/**
 * A tool's return value turned into an MCP result: `structuredContent` for
 * clients that read it, a compact JSON text block for the rest — without the
 * bulky or secret-shaped fields, and never larger than `RESULT_MAX_BYTES`.
 */
import { RESULT_MAX_BYTES, STRIPPED_RESULT_FIELDS } from "../config/limits.config";

export interface IToolResult {
  [key: string]: unknown;
  content: { type: "text"; text: string }[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}

function strip(value: unknown, depth = 0): unknown {
  if (value === null || typeof value !== "object" || depth > 12) return value;
  if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) return "[binary omitted]";
  if (Array.isArray(value)) return value.map((item) => strip(item, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (STRIPPED_RESULT_FIELDS.includes(key)) continue;
    if (typeof item === "string" && item.startsWith("data:")) {
      out[key] = "[inline data omitted]";
      continue;
    }
    out[key] = strip(item, depth + 1);
  }
  return out;
}

/** A successful result. Non-object values are wrapped as `{ result }` for `structuredContent`. */
export function toToolResult(value: unknown, note?: string): IToolResult {
  const cleaned = strip(value === undefined ? null : value);
  const structured = cleaned !== null && typeof cleaned === "object" && !Array.isArray(cleaned) ? (cleaned as Record<string, unknown>) : { result: cleaned };
  const text = JSON.stringify(structured);
  if (Buffer.byteLength(text, "utf8") > RESULT_MAX_BYTES) {
    const message = "The result is too large to return. Ask for less: a smaller pageSize, a filter, or one item by id.";
    return { content: [{ type: "text", text: message }], structuredContent: { truncated: true, message } };
  }
  const content: IToolResult["content"] = [{ type: "text", text }];
  if (note) content.unshift({ type: "text", text: note });
  return { content, structuredContent: structured };
}

/** A tool failure: `isError: true` and a sentence the model can act on. */
export function toToolError(message: string, code: string): IToolResult {
  return { content: [{ type: "text", text: message }], structuredContent: { error: { code, message } }, isError: true };
}
