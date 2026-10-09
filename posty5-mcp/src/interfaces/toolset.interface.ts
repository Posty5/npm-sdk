import type { AccessLevel } from "../config/access.config";
import type { ToolsetName } from "../config/toolsets.config";

/** A toolset as `listToolsets()` describes it. */
export interface IToolsetDescriptor {
  name: ToolsetName;
  label: string;
  description: string;
  defaultOn: boolean;
  alwaysOn: boolean;
  toolCount: number;
  tools: { name: string; access: AccessLevel }[];
}

/** Narrows `listTools()`. */
export interface IToolFilter {
  toolsets?: ToolsetName[];
  /** Only tools this level may use. */
  access?: AccessLevel;
}
