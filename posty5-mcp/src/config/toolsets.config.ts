/**
 * The tool groups (mcp-server feature, decision 5). Names are a public
 * contract: the API stores them on MCP tokens (`api/packages/common/src/
 * constants/mcp.const.ts` keeps the same list) and users put them in URLs.
 * Order here is catalogue order — `tools/list` answers in it.
 */
export const TOOLSET_NAMES = [
  "account",
  "short-links",
  "qr-codes",
  "html-hosting",
  "social-publisher",
  "store",
  "store-catalog",
  "store-orders",
  "store-shipping",
  "store-dropshipping",
] as const;

export type ToolsetName = (typeof TOOLSET_NAMES)[number];

/** Always on: an assistant must be able to ask who it is and what things cost. */
export const ALWAYS_ON_TOOLSET: ToolsetName = "account";

/** On whenever any `store-*` group is: every store tool takes a `storeId` it lists. */
export const STORE_LIST_TOOLSET: ToolsetName = "store";

/** What a new connection gets when it names no toolsets. The store groups are opt-in. */
export const DEFAULT_TOOLSETS: ToolsetName[] = ["account", "short-links", "qr-codes", "html-hosting", "social-publisher"];

/** Display label and one-line description per toolset, for `listToolsets()` and the dashboard picker. */
export const TOOLSET_INFO: Record<ToolsetName, { label: string; description: string }> = {
  account: { label: "Account", description: "Who the connection is, credits, and what operations cost." },
  "short-links": { label: "Short links", description: "Create, find, edit and delete short links." },
  "qr-codes": { label: "QR codes", description: "QR codes of every type, and the templates that style them." },
  "html-hosting": { label: "HTML hosting", description: "Hosted pages, their variables and their form submissions." },
  "social-publisher": { label: "Social publisher", description: "Workspaces, connected accounts, and posts to every platform." },
  store: { label: "Stores", description: "The stores this connection can manage." },
  "store-catalog": { label: "Store catalogue", description: "Products and tags." },
  "store-orders": { label: "Store orders", description: "Orders and customers — includes shoppers' personal data." },
  "store-shipping": { label: "Store shipping", description: "Countries, routes, profiles and assignments." },
  "store-dropshipping": { label: "Store dropshipping", description: "Supplier catalogue, imports, product links and supplier orders." },
};
