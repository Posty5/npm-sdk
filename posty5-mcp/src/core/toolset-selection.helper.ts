import { ACCESS_RANK, type AccessLevel } from "../config/access.config";
import { ALWAYS_ON_TOOLSET, DEFAULT_TOOLSETS, TOOLSET_NAMES, type ToolsetName } from "../config/toolsets.config";
import type { IToolDefinition } from "../interfaces/tool.interface";

/**
 * The toolsets a connection gets: the requested ones (or the defaults) and
 * `account` always — in catalogue order, unknown names dropped.
 */
export function resolveToolsets(requested?: readonly string[]): ToolsetName[] {
  const wanted = new Set<string>(requested && requested.length ? requested : DEFAULT_TOOLSETS);
  wanted.add(ALWAYS_ON_TOOLSET);
  return TOOLSET_NAMES.filter((name) => wanted.has(name));
}

/** True when a connection at `access` may use the tool. */
export function isToolAllowed(tool: IToolDefinition, access: AccessLevel): boolean {
  return ACCESS_RANK[tool.access] <= ACCESS_RANK[access];
}

/** The tools a connection exposes, in catalogue order. */
export function selectTools(all: readonly IToolDefinition[], toolsets: readonly ToolsetName[], access: AccessLevel): IToolDefinition[] {
  const on = new Set(toolsets);
  return all.filter((tool) => on.has(tool.toolset) && isToolAllowed(tool, access));
}
