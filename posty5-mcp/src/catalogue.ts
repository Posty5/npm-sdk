/**
 * Every tool, in catalogue order (toolset order, then each file's order), and
 * the read-only views of it the hosted service and the guide build on.
 */
import { DEFAULT_TOOLSETS, ALWAYS_ON_TOOLSET, TOOLSET_INFO, TOOLSET_NAMES } from "./config/toolsets.config";
import { isToolAllowed } from "./core/toolset-selection.helper";
import { toDescriptor } from "./core/tool-schema.helper";
import type { IToolDefinition, IToolDescriptor } from "./interfaces/tool.interface";
import type { IToolFilter, IToolsetDescriptor } from "./interfaces/toolset.interface";
import { ACCOUNT_TOOLS } from "./toolsets/account.tools";
import { HTML_HOSTING_TOOLS } from "./toolsets/html-hosting.tools";
import { QR_CODE_TOOLS } from "./toolsets/qr-codes.tools";
import { SHORT_LINK_TOOLS } from "./toolsets/short-links.tools";
import { SOCIAL_PUBLISHER_TOOLS } from "./toolsets/social-publisher.tools";
import { STORE_CATALOG_TOOLS } from "./toolsets/store-catalog.tools";
import { STORE_DROPSHIPPING_TOOLS } from "./toolsets/store-dropshipping.tools";
import { STORE_ORDER_TOOLS } from "./toolsets/store-orders.tools";
import { STORE_SHIPPING_TOOLS } from "./toolsets/store-shipping.tools";
import { STORE_TOOLS } from "./toolsets/store.tools";

export const CATALOGUE: readonly IToolDefinition[] = [
  ...ACCOUNT_TOOLS,
  ...SHORT_LINK_TOOLS,
  ...QR_CODE_TOOLS,
  ...HTML_HOSTING_TOOLS,
  ...SOCIAL_PUBLISHER_TOOLS,
  ...STORE_TOOLS,
  ...STORE_CATALOG_TOOLS,
  ...STORE_ORDER_TOOLS,
  ...STORE_SHIPPING_TOOLS,
  ...STORE_DROPSHIPPING_TOOLS,
];

/** Every tool, optionally narrowed by toolset and access level, in catalogue order. */
export function listTools(filter: IToolFilter = {}): IToolDescriptor[] {
  const toolsets = filter.toolsets ? new Set(filter.toolsets) : undefined;
  return CATALOGUE.filter((tool) => (!toolsets || toolsets.has(tool.toolset)) && (!filter.access || isToolAllowed(tool, filter.access))).map(toDescriptor);
}

/** Every toolset with its tools, in catalogue order. */
export function listToolsets(): IToolsetDescriptor[] {
  return TOOLSET_NAMES.map((name) => {
    const tools = CATALOGUE.filter((tool) => tool.toolset === name).map((tool) => ({ name: tool.name, access: tool.access }));
    return {
      name,
      label: TOOLSET_INFO[name].label,
      description: TOOLSET_INFO[name].description,
      defaultOn: DEFAULT_TOOLSETS.includes(name),
      alwaysOn: name === ALWAYS_ON_TOOLSET,
      toolCount: tools.length,
      tools,
    };
  });
}
