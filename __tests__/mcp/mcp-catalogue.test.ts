import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { CATALOGUE, listTools, listToolsets } from "../../posty5-mcp/src/catalogue";
import { ACCESS_LEVELS, ACCESS_RANK } from "../../posty5-mcp/src/config/access.config";
import { PACKAGE_VERSION } from "../../posty5-mcp/src/config/instructions.config";
import { DEFAULT_TOOLSETS, TOOLSET_NAMES } from "../../posty5-mcp/src/config/toolsets.config";
import { buildInputSchema, RESERVED_ARGUMENTS } from "../../posty5-mcp/src/core/tool-schema.helper";
import { resolveToolsets } from "../../posty5-mcp/src/core/toolset-selection.helper";
import { createPosty5McpServer } from "../../posty5-mcp/src/server";
import { readFileSync } from "fs";
import * as path from "path";

/**
 * The catalogue's promises (mcp-server feature, npm-sdk/mcp-tool-catalogue-
 * package): 135 tools, stable names and order, the catalogue's own arguments
 * on every write, confirmation on every ✋ tool, and a server that registers
 * exactly what its access level and toolsets allow.
 */

/** Tools per toolset, from the plan's catalogue table. */
const EXPECTED_COUNTS: Record<string, number> = {
  account: 4,
  "short-links": 5,
  "qr-codes": 6,
  "html-hosting": 20,
  "social-publisher": 21,
  store: 1,
  "store-catalog": 23,
  "store-orders": 10,
  "store-shipping": 23,
  "store-dropshipping": 22,
};

/** The ✋ tools of the table. */
const CONFIRM_TOOLS = [
  "short_link_delete",
  "qr_code_delete",
  "html_page_delete",
  "html_variable_delete",
  "form_submission_delete",
  "social_workspace_delete",
  "social_post_publish_long_video",
  "social_post_delete",
  "social_post_remove_from_platforms",
  "store_product_clone_from_url",
  "store_product_generate_ai_content",
  "store_product_delete",
  "store_tag_delete",
  "store_shipping_delete_country",
  "store_shipping_clear_route",
  "store_shipping_delete_profile",
  "store_shipping_remove_parcel_price",
  "store_supplier_import",
  "store_supplier_link_delete",
  "store_supplier_order_submit",
  "store_supplier_order_retry",
  "store_supplier_order_pay",
  "store_supplier_order_cancel",
  "store_fulfilment_group_fulfil_manually",
];

function registeredNames(options: Parameters<typeof createPosty5McpServer>[0]): string[] {
  const spy = jest.spyOn(McpServer.prototype, "registerTool");
  try {
    createPosty5McpServer(options);
    return spy.mock.calls.map((call) => call[0] as string);
  } finally {
    spy.mockRestore();
  }
}

describe("@posty5/mcp — the catalogue", () => {
  it("holds 135 tools, as many per toolset as the table lists", () => {
    expect(CATALOGUE).toHaveLength(135);
    for (const name of TOOLSET_NAMES) {
      expect([name, CATALOGUE.filter((tool) => tool.toolset === name).length]).toEqual([name, EXPECTED_COUNTS[name]]);
    }
  });

  it("names every tool once, snake_case, at most 64 characters", () => {
    const names = CATALOGUE.map((tool) => tool.name);
    expect(new Set(names).size).toBe(names.length);
    for (const name of names) {
      expect(name).toMatch(/^[a-z][a-z0-9_]*$/);
      expect(name.length).toBeLessThanOrEqual(64);
    }
  });

  it("keeps toolsets contiguous and in toolset order", () => {
    const order = CATALOGUE.map((tool) => TOOLSET_NAMES.indexOf(tool.toolset));
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it("never lets a toolset declare the catalogue's own arguments", () => {
    for (const tool of CATALOGUE) {
      for (const reserved of RESERVED_ARGUMENTS) expect([tool.name, reserved in tool.input.shape]).toEqual([tool.name, false]);
    }
  });

  it("gives every write and full tool a required aiModel and an optional idempotencyKey; reads get neither", () => {
    for (const tool of CATALOGUE) {
      const shape = buildInputSchema(tool).shape;
      if (tool.access === "read") {
        expect([tool.name, "aiModel" in shape]).toEqual([tool.name, false]);
        continue;
      }
      expect([tool.name, shape.aiModel?.safeParse(undefined).success]).toEqual([tool.name, false]);
      expect([tool.name, shape.idempotencyKey?.safeParse(undefined).success]).toEqual([tool.name, true]);
    }
  });

  it("asks for confirm on exactly the ✋ tools of the table", () => {
    expect(CATALOGUE.filter((tool) => tool.confirm).map((tool) => tool.name).sort()).toEqual([...CONFIRM_TOOLS].sort());
    for (const tool of CATALOGUE) expect([tool.name, "confirm" in buildInputSchema(tool).shape]).toEqual([tool.name, !!tool.confirm]);
  });

  it("only ever points the model at tools that exist", () => {
    const names = new Set(CATALOGUE.map((tool) => tool.name));
    const mention = /\b(?:account|short_link|qr_code|html_page|html_variable|form_submission|social|store)_[a-z_]+\b/g;
    for (const tool of CATALOGUE) {
      const text = `${tool.description} ${JSON.stringify(z.toJSONSchema(buildInputSchema(tool)))}`;
      for (const name of text.match(mention) ?? []) expect([tool.name, name, names.has(name)]).toEqual([tool.name, name, true]);
    }
  });

  it("never quotes a price in a description", () => {
    for (const tool of CATALOGUE) expect([tool.name, /\d+(\.\d+)?\s*credits?\b/i.test(tool.description)]).toEqual([tool.name, false]);
  });

  it("marks every full tool destructive or idempotent, and no read tool destructive", () => {
    for (const tool of listTools()) {
      if (tool.access === "read") expect([tool.name, tool.annotations.destructiveHint]).toEqual([tool.name, false]);
      if (tool.access === "full") expect([tool.name, tool.annotations.destructiveHint || tool.annotations.idempotentHint]).toEqual([tool.name, true]);
    }
  });

  it("keeps PACKAGE_VERSION in step with package.json", () => {
    const pkg = JSON.parse(readFileSync(path.join(__dirname, "../../posty5-mcp/package.json"), "utf8"));
    expect(PACKAGE_VERSION).toBe(pkg.version);
  });
});

describe("@posty5/mcp — toolset selection", () => {
  it("defaults to the five default toolsets", () => {
    expect(resolveToolsets()).toEqual(DEFAULT_TOOLSETS);
  });

  it("always adds account, adds store with any store-* group, drops unknown names, keeps catalogue order", () => {
    expect(resolveToolsets(["store-orders", "nope", "qr-codes"])).toEqual(["account", "qr-codes", "store", "store-orders"]);
  });
});

describe("@posty5/mcp — what a server registers", () => {
  it("registers exactly listTools() for its access level and toolsets, in catalogue order", () => {
    for (const access of ACCESS_LEVELS) {
      const toolsets = resolveToolsets([...TOOLSET_NAMES]);
      expect(registeredNames({ access, toolsets: [...TOOLSET_NAMES] })).toEqual(listTools({ access, toolsets }).map((tool) => tool.name));
    }
  });

  it("registers no write or full tool at read, and no full tool at write", () => {
    const at = (access: "read" | "write") => registeredNames({ access, toolsets: [...TOOLSET_NAMES] });
    const accessOf = new Map(CATALOGUE.map((tool) => [tool.name, tool.access]));
    expect(at("read").every((name) => accessOf.get(name) === "read")).toBe(true);
    expect(at("write").every((name) => ACCESS_RANK[accessOf.get(name)!] <= ACCESS_RANK.write)).toBe(true);
  });

  it("registers the same list twice in a row", () => {
    expect(registeredNames({ access: "full" })).toEqual(registeredNames({ access: "full" }));
  });

  it("describes every toolset with its tools", () => {
    const toolsets = listToolsets();
    expect(toolsets.map((item) => item.name)).toEqual([...TOOLSET_NAMES]);
    expect(toolsets.find((item) => item.name === "account")!.alwaysOn).toBe(true);
    expect(toolsets.filter((item) => item.defaultOn).map((item) => item.name)).toEqual(DEFAULT_TOOLSETS);
    expect(toolsets.reduce((sum, item) => sum + item.toolCount, 0)).toBe(CATALOGUE.length);
  });
});
