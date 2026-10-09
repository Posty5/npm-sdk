import { StoreSuppliersClient } from "@posty5/store";
import { CATALOGUE } from "../../posty5-mcp/src/catalogue";
import { ToolInputError } from "../../posty5-mcp/src/core/tool-input.error";
import { STORE_DROPSHIPPING_TOOLS } from "../../posty5-mcp/src/toolsets/store-dropshipping.tools";
import { findTool, previewTool, route, runTool } from "./mcp-test.helper";

/**
 * `@posty5/mcp` — the `store-dropshipping` toolset. Offline: each tool runs
 * over a stub HttpClient and the request it makes is pinned (route, query,
 * body). Confirm tools are also previewed, which may only read — the import's
 * preview is the one POST allowed, because it IS `previewImport`.
 *
 * Decision 7 keeps connecting and configuring suppliers out of MCP; the last
 * two tests hold that line by name and by call.
 */

const base = "/api/store-suppliers/s1";

/** `@posty5/store` supplier methods that must never become tools (catalogue plan, decision 7). */
const EXCLUDED_METHODS = [
  "connect",
  "replaceCredentials",
  "startOAuth",
  "updateSettings",
  "updateAutomation",
  "setEnabled",
  "disconnect",
  "getDisconnectImpact",
] as const;

/** The same methods as a tool name would spell them. */
const EXCLUDED_NAME_PARTS = ["connect", "replace_credentials", "start_oauth", "oauth", "update_settings", "update_automation", "set_enabled", "disconnect", "impact"];

const IMPORT_ARGS = {
  storeId: "s1",
  integrationId: "i1",
  items: [{ supplierProductId: "sp1", supplierVariantIds: ["v1"] }],
  priceRule: { type: "markupPercent", value: 40 },
  defaults: { status: "draft" },
};

const IMPORT_PREVIEW = {
  rows: [
    { supplierProductId: "sp1", name: "Mug", variantCount: 1, costMin: 2, costMax: 2, priceMin: 5, priceMax: 5, currency: "USD", warnings: [] },
    { supplierProductId: "sp2", name: "Cup", variantCount: 1, costMin: 2, costMax: 2, priceMin: 5, priceMax: 5, currency: "USD", warnings: [], duplicateOf: { productId: "p9", name: "Cup" } },
  ],
  totals: { products: 2, creditsPerProduct: 10, credits: 20 },
};

const SUPPLIER_ORDER = {
  _id: "so1",
  orderId: "o1",
  orderNumber: "1042",
  integrationId: "i1",
  supplierKey: "cjdropshipping",
  supplierOrderNumber: "P5-1042-1",
  status: "submitted",
  costs: { products: 10, freight: 2.5, total: 12.5, currency: "USD" },
  payment: { status: "unpaid" },
};

const STORE_ORDER = {
  _id: "o1",
  orderNumber: "1042",
  fulfilmentGroups: [{ key: "supplier:i1", kind: "thirdParty", label: "Shipped by CJ", supplierName: "CJ Dropshipping", lineKeys: ["l1", "l2"], status: "pending" }],
};

const onlyReads = (calls: { method: string }[]) => calls.every((call) => call.method === "GET");

describe("mcp — store-dropshipping toolset", () => {
  it("has the catalogue's 22 tools, in order, with their access and confirm rule", () => {
    expect(STORE_DROPSHIPPING_TOOLS.map((tool) => [tool.name, tool.access, !!tool.confirm])).toEqual([
      ["store_supplier_catalogue", "read", false],
      ["store_supplier_list", "read", false],
      ["store_supplier_test", "read", false],
      ["store_supplier_get_balance", "read", false],
      ["store_supplier_browse_products", "read", false],
      ["store_supplier_get_product", "read", false],
      ["store_supplier_resolve_url", "read", false],
      ["store_supplier_preview_import", "read", false],
      ["store_supplier_get_import_status", "read", false],
      ["store_supplier_list_links", "read", false],
      ["store_supplier_list_orders", "read", false],
      ["store_supplier_get_order", "read", false],
      ["store_supplier_import", "write", true],
      ["store_supplier_link_create", "write", false],
      ["store_supplier_link_update", "write", false],
      ["store_supplier_link_sync", "write", false],
      ["store_supplier_order_retry", "write", true],
      ["store_supplier_link_delete", "full", true],
      ["store_supplier_order_submit", "full", true],
      ["store_supplier_order_pay", "full", true],
      ["store_supplier_order_cancel", "full", true],
      ["store_fulfilment_group_fulfil_manually", "full", true],
    ]);
    expect(STORE_DROPSHIPPING_TOOLS.every((tool) => tool.toolset === "store-dropshipping")).toBe(true);
    expect(STORE_DROPSHIPPING_TOOLS.every((tool) => Object.keys(tool.input.shape)[0] === "storeId")).toBe(true);
  });

  it("store_supplier_catalogue", async () => {
    const { calls } = await runTool("store_supplier_catalogue", { storeId: "s1" });
    expect(route(calls[0])).toBe(`GET ${base}/catalogue`);
  });

  it("store_supplier_list — unwraps the connection list", async () => {
    const { value, calls } = await runTool("store_supplier_list", { storeId: "s1" }, { items: [{ _id: "i1" }] });
    expect(route(calls[0])).toBe(`GET ${base}`);
    expect(value).toEqual([{ _id: "i1" }]);
  });

  it("store_supplier_test", async () => {
    const { calls } = await runTool("store_supplier_test", { storeId: "s1", integrationId: "i1" });
    expect(route(calls[0])).toBe(`POST ${base}/i1/test`);
    expect(calls[0].body).toEqual({});
  });

  it("store_supplier_get_balance", async () => {
    const { calls } = await runTool("store_supplier_get_balance", { storeId: "s1", integrationId: "i1" });
    expect(route(calls[0])).toBe(`GET ${base}/i1/balance`);
  });

  it("store_supplier_browse_products — page-numbered, capped at the catalogue's page size", async () => {
    const { calls } = await runTool("store_supplier_browse_products", { storeId: "s1", integrationId: "i1", q: "mug", categoryId: "c7", page: 2, pageSize: 48 });
    expect(route(calls[0])).toBe(`GET ${base}/i1/products`);
    expect(calls[0].params).toEqual({ q: "mug", categoryId: "c7", page: 2, pageSize: 48 });
    expect(() => findTool("store_supplier_browse_products").input.parse({ storeId: "s1", integrationId: "i1", pageSize: 49 })).toThrow();
  });

  it("store_supplier_get_product — encodes the supplier's id", async () => {
    const { calls } = await runTool("store_supplier_get_product", { storeId: "s1", integrationId: "i1", supplierProductId: "a/b" });
    expect(route(calls[0])).toBe(`GET ${base}/i1/products/a%2Fb`);
  });

  it("store_supplier_resolve_url", async () => {
    const { calls } = await runTool("store_supplier_resolve_url", { storeId: "s1", integrationId: "i1", url: "https://supplier.example/item/1" });
    expect(route(calls[0])).toBe(`POST ${base}/i1/products/resolve-url`);
    expect(calls[0].body).toEqual({ url: "https://supplier.example/item/1" });
  });

  it("store_supplier_preview_import", async () => {
    const { calls } = await runTool("store_supplier_preview_import", IMPORT_ARGS);
    expect(route(calls[0])).toBe(`POST ${base}/i1/import/preview`);
    expect(calls[0].body).toEqual({ items: IMPORT_ARGS.items, priceRule: IMPORT_ARGS.priceRule, defaults: IMPORT_ARGS.defaults });
  });

  it("store_supplier_get_import_status", async () => {
    const { calls } = await runTool("store_supplier_get_import_status", { storeId: "s1", jobId: "j1" });
    expect(route(calls[0])).toBe(`GET ${base}/imports/j1`);
  });

  it("store_supplier_list_links", async () => {
    const { calls } = await runTool("store_supplier_list_links", { storeId: "s1", productId: "p1" }, { items: [] });
    expect(route(calls[0])).toBe(`GET ${base}/links`);
    expect(calls[0].params).toEqual({ productId: "p1" });
  });

  it("store_supplier_list_orders", async () => {
    const { calls } = await runTool("store_supplier_list_orders", { storeId: "s1", needsReview: true, integrationId: "i1", contractModel: "standard", cursor: "c1", pageSize: 10 });
    expect(route(calls[0])).toBe(`GET ${base}/orders`);
    expect(calls[0].params).toEqual({ needsReview: "true", integrationId: "i1", contractModel: "standard", cursor: "c1", pageSize: 10 });
  });

  it("store_supplier_get_order", async () => {
    const { calls } = await runTool("store_supplier_get_order", { storeId: "s1", supplierOrderRowId: "so1" });
    expect(route(calls[0])).toBe(`GET ${base}/orders/so1`);
  });

  it("store_supplier_import — the unconfirmed call is the preview, with the same arguments", async () => {
    const { calls } = await runTool("store_supplier_import", IMPORT_ARGS);
    expect(route(calls[0])).toBe(`POST ${base}/i1/import`);
    expect(calls[0].body).toEqual({ items: IMPORT_ARGS.items, priceRule: IMPORT_ARGS.priceRule, defaults: IMPORT_ARGS.defaults });

    const preview = await previewTool("store_supplier_import", IMPORT_ARGS, IMPORT_PREVIEW);
    expect(preview.calls.map(route)).toEqual([`POST ${base}/i1/import/preview`]);
    expect(preview.calls[0].body).toEqual(calls[0].body);
    expect(preview.text).toEqual({ action: expect.stringContaining("Import 2 product(s)"), details: IMPORT_PREVIEW });
    expect(findTool("store_supplier_import").confirm!.costFeaturePath).toBe("onlineStore.supplierImport");

    const entity = findTool("store_supplier_import").entity!;
    expect(entity({ jobId: null, rows: [{ state: "added" }, { state: "failed" }] }, IMPORT_ARGS)).toEqual({ entityType: "storeProduct", count: 1 });
    expect(entity({ jobId: "j1", rows: null }, IMPORT_ARGS)).toEqual({ entityType: "supplierImport", entityId: "j1" });
  });

  it("store_supplier_link_create", async () => {
    const input = { productId: "p1", integrationId: "i1", supplierProductId: "sp1", variants: [{ combinationKey: null, supplierVariantId: "v1" }], syncNow: false };
    const { calls } = await runTool("store_supplier_link_create", { storeId: "s1", ...input });
    expect(route(calls[0])).toBe(`POST ${base}/links`);
    expect(calls[0].body).toEqual(input);
    expect(findTool("store_supplier_link_create").entity!({ _id: "l1" }, { storeId: "s1", ...input })).toEqual({ entityType: "supplierLink", entityId: "l1" });
  });

  it("store_supplier_link_update — and refuses a call that changes nothing", async () => {
    const { calls } = await runTool("store_supplier_link_update", { version: 1, storeId: "s1", linkId: "l1", sync: { price: false }, applyPriceRuleNow: true });
    expect(route(calls[0])).toBe(`PUT ${base}/links/l1`);
    expect(calls[0].body).toEqual({ sync: { price: false }, applyPriceRuleNow: true });
    await expect(runTool("store_supplier_link_update", { version: 1, storeId: "s1", linkId: "l1" })).rejects.toThrow(ToolInputError);
  });

  it("store_supplier_link_sync", async () => {
    const { calls } = await runTool("store_supplier_link_sync", { storeId: "s1", linkId: "l1" });
    expect(route(calls[0])).toBe(`POST ${base}/links/l1/sync`);
  });

  it("store_supplier_order_retry — preview reads the order and says money can move", async () => {
    const { calls } = await runTool("store_supplier_order_retry", { version: 1, storeId: "s1", supplierOrderRowId: "so1", acceptCost: true });
    expect(route(calls[0])).toBe(`POST ${base}/orders/so1/retry`);
    expect(calls[0].body).toEqual({ acceptCost: true });

    const preview = await previewTool("store_supplier_order_retry", { version: 1, storeId: "s1", supplierOrderRowId: "so1" }, SUPPLIER_ORDER);
    expect(preview.calls.map(route)).toEqual([`GET ${base}/orders/so1`]);
    expect(preview.text).toContain("cannot be undone");
  });

  it("store_supplier_link_delete — preview makes no request", async () => {
    const { calls } = await runTool("store_supplier_link_delete", { version: 1, storeId: "s1", linkId: "l1" });
    expect(route(calls[0])).toBe(`DELETE ${base}/links/l1`);

    const preview = await previewTool("store_supplier_link_delete", { version: 1, storeId: "s1", linkId: "l1" });
    expect(preview.calls).toEqual([]);
    expect(preview.text).toContain("l1");
  });

  it("store_supplier_order_submit — preview reads the order to name the part", async () => {
    const { calls } = await runTool("store_supplier_order_submit", { storeId: "s1", orderId: "o1", groupKey: "supplier:i1", payNow: true });
    expect(route(calls[0])).toBe(`POST ${base}/orders/o1/groups/supplier%3Ai1/submit`);
    expect(calls[0].body).toEqual({ payNow: true });

    const preview = await previewTool("store_supplier_order_submit", { storeId: "s1", orderId: "o1", groupKey: "supplier:i1", payNow: true }, STORE_ORDER);
    expect(preview.calls.map(route)).toEqual(["GET /api/store-orders/s1/o1"]);
    expect(onlyReads(preview.calls)).toBe(true);
    expect(preview.text).toContain("CJ Dropshipping");
    expect(preview.text).toContain("real money");
  });

  it("store_supplier_order_pay — preview reads the order and the balance", async () => {
    const { calls } = await runTool("store_supplier_order_pay", { version: 1, storeId: "s1", supplierOrderRowId: "so1" });
    expect(route(calls[0])).toBe(`POST ${base}/orders/so1/pay`);
    expect(calls[0].body).toEqual({});

    const preview = await previewTool("store_supplier_order_pay", { version: 1, storeId: "s1", supplierOrderRowId: "so1" }, undefined, [SUPPLIER_ORDER, { amount: 80, currency: "USD" }]);
    expect(preview.calls.map(route)).toEqual([`GET ${base}/orders/so1`, `GET ${base}/i1/balance`]);
    expect(onlyReads(preview.calls)).toBe(true);
    expect(preview.text).toContain("12.5 USD");
    expect(preview.text).toContain("80 USD");
    expect(preview.text).toContain("real money");
  });

  it("store_supplier_order_cancel — preview reads the order", async () => {
    const { calls } = await runTool("store_supplier_order_cancel", { version: 1, storeId: "s1", supplierOrderRowId: "so1" });
    expect(route(calls[0])).toBe(`POST ${base}/orders/so1/cancel`);

    const preview = await previewTool("store_supplier_order_cancel", { version: 1, storeId: "s1", supplierOrderRowId: "so1" }, SUPPLIER_ORDER);
    expect(preview.calls.map(route)).toEqual([`GET ${base}/orders/so1`]);
    expect(onlyReads(preview.calls)).toBe(true);
    expect(preview.text).toContain("P5-1042-1");
  });

  it("store_fulfilment_group_fulfil_manually — preview reads the order to name the part", async () => {
    const { calls } = await runTool("store_fulfilment_group_fulfil_manually", { orderVersion: 1, storeId: "s1", orderId: "o1", groupKey: "supplier:i1" });
    expect(route(calls[0])).toBe(`POST ${base}/orders/o1/groups/supplier%3Ai1/fulfil-manually`);
    expect(calls[0].body).toEqual({});

    const preview = await previewTool("store_fulfilment_group_fulfil_manually", { orderVersion: 1, storeId: "s1", orderId: "o1", groupKey: "supplier:i1" }, STORE_ORDER);
    expect(preview.calls.map(route)).toEqual(["GET /api/store-orders/s1/o1"]);
    expect(onlyReads(preview.calls)).toBe(true);
    expect(preview.text).toContain("CJ Dropshipping");
  });

  it("no tool is named after a supplier method decision 7 excludes", () => {
    const names = CATALOGUE.filter((tool) => tool.name.startsWith("store_supplier") || tool.toolset === "store-dropshipping").map((tool) => tool.name);
    expect(names.filter((name) => EXCLUDED_NAME_PARTS.some((part) => name.includes(part)))).toEqual([]);
  });

  it("no tool calls a supplier method decision 7 excludes", async () => {
    const spies = EXCLUDED_METHODS.map((method) => jest.spyOn(StoreSuppliersClient.prototype, method));
    const minimalArgs: Record<string, Record<string, unknown>> = {
      store_supplier_catalogue: { storeId: "s1" },
      store_supplier_list: { storeId: "s1" },
      store_supplier_test: { storeId: "s1", integrationId: "i1" },
      store_supplier_get_balance: { storeId: "s1", integrationId: "i1" },
      store_supplier_browse_products: { storeId: "s1", integrationId: "i1" },
      store_supplier_get_product: { storeId: "s1", integrationId: "i1", supplierProductId: "sp1" },
      store_supplier_resolve_url: { storeId: "s1", integrationId: "i1", url: "https://supplier.example/item/1" },
      store_supplier_preview_import: IMPORT_ARGS,
      store_supplier_get_import_status: { storeId: "s1", jobId: "j1" },
      store_supplier_list_links: { storeId: "s1" },
      store_supplier_list_orders: { storeId: "s1" },
      store_supplier_get_order: { storeId: "s1", supplierOrderRowId: "so1" },
      store_supplier_import: IMPORT_ARGS,
      store_supplier_link_create: { storeId: "s1", productId: "p1", integrationId: "i1", supplierProductId: "sp1", variants: [{ supplierVariantId: "v1" }] },
      store_supplier_link_update: { storeId: "s1", linkId: "l1", applyPriceRuleNow: true },
      store_supplier_link_sync: { storeId: "s1", linkId: "l1" },
      store_supplier_order_retry: { storeId: "s1", supplierOrderRowId: "so1" },
      store_supplier_link_delete: { storeId: "s1", linkId: "l1" },
      store_supplier_order_submit: { storeId: "s1", orderId: "o1", groupKey: "supplier:i1" },
      store_supplier_order_pay: { storeId: "s1", supplierOrderRowId: "so1" },
      store_supplier_order_cancel: { storeId: "s1", supplierOrderRowId: "so1" },
      store_fulfilment_group_fulfil_manually: { storeId: "s1", orderId: "o1", groupKey: "supplier:i1" },
    };
    try {
      expect(Object.keys(minimalArgs)).toEqual(STORE_DROPSHIPPING_TOOLS.map((tool) => tool.name));
      for (const tool of STORE_DROPSHIPPING_TOOLS) {
        await runTool(tool.name, minimalArgs[tool.name], { items: [] });
        if (tool.confirm) await previewTool(tool.name, minimalArgs[tool.name], tool.name === "store_supplier_import" ? IMPORT_PREVIEW : SUPPLIER_ORDER);
      }
      for (const spy of spies) expect(spy).not.toHaveBeenCalled();
    } finally {
      for (const spy of spies) spy.mockRestore();
    }
  });
});
