import { CATALOGUE } from "../../posty5-mcp/src/catalogue";
import { BULK_CREATE_MAX_ITEMS } from "../../posty5-mcp/src/config/limits.config";
import { PRODUCT_SECTIONS } from "../../posty5-mcp/src/config/store-catalog-enums.config";
import { createClients } from "../../posty5-mcp/src/core/clients.factory";
import { ToolInputError } from "../../posty5-mcp/src/core/tool-input.error";
import { fakeCall, findTool, previewTool, route, runTool, stubHttp } from "./mcp-test.helper";

/**
 * The `store` and `store-catalog` toolsets (mcp-server feature, npm-sdk/mcp-
 * tool-catalogue-package): the route each tool calls and the arguments it
 * forwards, what the confirm tools read before asking (reads only — plus the
 * free AI estimate), and the caps the schemas hold. Offline: a stub stands in
 * for HttpClient.
 */

const S = "s1";
const PRODUCT = { _id: "p1", name: "Tee", sku: "TEE-1", status: "active", price: 20 };
const TAG = { _id: "t1", name: "Sale", productsCount: 4 };
const AI_REQUEST = { brief: "A soft cotton tee for summer days", sectionKeys: ["hero", "faq"] };

/** The table's order. */
const CATALOG_TOOL_NAMES = [
  "store_product_search",
  "store_product_get",
  "store_product_estimate_ai_content",
  "store_product_create",
  "store_product_create_draft",
  "store_product_bulk_create",
  "store_product_clone_from_url",
  "store_product_update",
  "store_product_update_section",
  "store_product_reorder",
  "store_product_generate_ai_content",
  "store_product_delete",
  "store_tag_search",
  "store_tag_get",
  "store_tag_resolve_products",
  "store_tag_list_products",
  "store_tag_get_product_tags",
  "store_tag_create",
  "store_tag_update",
  "store_tag_assign_products",
  "store_tag_unassign_product",
  "store_tag_set_product_tags",
  "store_tag_delete",
];

/** One valid `data` per product section, and the route it must reach. */
const SECTION_SAMPLES: Record<string, { data: Record<string, unknown>; path: string }> = {
  basicInformation: { data: { name: "Tee", sku: "" }, path: "basic-information" },
  media: { data: { images: [{ url: "https://cdn.example.com/a.png" }] }, path: "media" },
  price: { data: { price: 20, compareAtPrice: null }, path: "price" },
  stock: { data: { stock: 5, saleBuffer: 0, outOfStockBehavior: "hide" }, path: "stock" },
  variants: { data: { variantGroups: [{ name: "Size", type: "size", values: [{ name: "M", key: "m" }] }] }, path: "variants" },
  tags: { data: { tagIds: ["t1"] }, path: "tags" },
  seo: { data: { seo: { title: "Tee" }, slug: "tee" }, path: "seo" },
  settings: { data: { status: "active", isFeatured: true }, path: "settings" },
  landing: { data: { sectionOrder: ["hero"], sections: { hero: { isEnabled: true, data: { brandName: "Acme" } } } }, path: "landing" },
  shipping: { data: { extraFeePerUnit: null, weight: 0.4 }, path: "shipping" },
  purchase: { data: { mode: "both", externalLinks: [{ url: "https://shop.example.com/tee", platform: "custom" }] }, path: "purchase" },
};

describe("@posty5/mcp — store", () => {
  it("store_list → GET /api/store/lookup with term and pageSize", async () => {
    const { value, calls } = await runTool("store_list", { term: "acme", pageSize: 5 }, [{ _id: S, name: "acme - Acme" }]);
    expect(route(calls[0])).toBe("GET /api/store/lookup");
    expect(calls[0].params).toEqual({ term: "acme", pageSize: 5 });
    expect(value).toEqual([{ _id: S, name: "acme - Acme" }]);
  });
});

describe("@posty5/mcp — store-catalog products", () => {
  it("keeps the table's order", () => {
    expect(CATALOGUE.filter((tool) => tool.toolset === "store-catalog").map((tool) => tool.name)).toEqual(CATALOG_TOOL_NAMES);
  });

  it("store_product_search → GET /api/store-products/:storeId with filters and cursor paging", async () => {
    const { calls } = await runTool("store_product_search", { storeId: S, name: "tee", status: "active", tagIds: ["t1", "t2"], cursor: "c1", pageSize: 20 });
    expect(route(calls[0])).toBe("GET /api/store-products/s1");
    expect(calls[0].params).toEqual({ name: "tee", status: "active", tagIds: "t1,t2", cursor: "c1", pageSize: 20 });
  });

  it("store_product_get → GET /api/store-products/:storeId/:productId", async () => {
    const { calls } = await runTool("store_product_get", { storeId: S, productId: "p1" }, PRODUCT);
    expect(route(calls[0])).toBe("GET /api/store-products/s1/p1");
  });

  it("store_product_estimate_ai_content → POST …/ai/estimate with the brief", async () => {
    const { calls } = await runTool("store_product_estimate_ai_content", { storeId: S, productId: "p1", ...AI_REQUEST, tone: "friendly" });
    expect(route(calls[0])).toBe("POST /api/store-products/s1/p1/ai/estimate");
    expect(calls[0].body).toEqual({ ...AI_REQUEST, tone: "friendly" });
  });

  it("store_product_create → POST /api/store-products/:storeId with the product, and names the new product", async () => {
    const args = { storeId: S, name: "Tee", price: 20, images: [{ url: "https://cdn.example.com/a.png" }], stock: null, status: "hidden" };
    const { value, calls } = await runTool("store_product_create", args, PRODUCT);
    expect(route(calls[0])).toBe("POST /api/store-products/s1");
    expect(calls[0].body).toEqual({ name: "Tee", price: 20, images: [{ url: "https://cdn.example.com/a.png" }], stock: null, status: "hidden" });
    expect(findTool("store_product_create").entity!(value, args as any)).toEqual({ entityType: "storeProduct", entityId: "p1" });
  });

  it("store_product_create refuses a draft status (that is store_product_create_draft)", () => {
    expect(findTool("store_product_create").input.safeParse({ storeId: S, name: "Tee", price: 20, status: "draft" }).success).toBe(false);
  });

  it("store_product_create_draft → POST …/draft with sku and name", async () => {
    const { calls } = await runTool("store_product_create_draft", { storeId: S, sku: "TEE-1", name: "Tee" }, PRODUCT);
    expect(route(calls[0])).toBe("POST /api/store-products/s1/draft");
    expect(calls[0].body).toEqual({ sku: "TEE-1", name: "Tee" });
  });

  it("store_product_bulk_create → POST …/bulk with { products }, and counts what was imported", async () => {
    const args = { storeId: S, products: [{ name: "Tee", price: 20 }, { name: "Cap", price: 9, stock: 3 }] };
    const report = { totalRows: 2, imported: 2, failed: 0, creditsCharged: 0, rows: [] };
    const { value, calls } = await runTool("store_product_bulk_create", args, report);
    expect(route(calls[0])).toBe("POST /api/store-products/s1/bulk");
    expect(calls[0].body).toEqual({ products: [{ name: "Tee", price: 20 }, { name: "Cap", price: 9, stock: 3 }] });
    expect(findTool("store_product_bulk_create").entity!(value, args as any)).toEqual({ entityType: "storeProduct", count: 2 });
  });

  it(`store_product_bulk_create refuses more than ${BULK_CREATE_MAX_ITEMS} products before any request`, async () => {
    const products = Array.from({ length: BULK_CREATE_MAX_ITEMS + 1 }, (_, index) => ({ name: `Item ${index}`, price: 1 }));
    expect(findTool("store_product_bulk_create").input.safeParse({ storeId: S, products }).success).toBe(false);
    expect(findTool("store_product_bulk_create").input.safeParse({ storeId: S, products: products.slice(1) }).success).toBe(true);
    await expect(runTool("store_product_bulk_create", { storeId: S, products })).rejects.toThrow();
  });

  it("store_product_clone_from_url → POST …/clone with the url; the preview sends nothing", async () => {
    const url = "https://www.amazon.com/dp/B000000000";
    const { value, calls } = await runTool("store_product_clone_from_url", { storeId: S, url }, { product: { ...PRODUCT, _id: "p9" }, clone: { platform: "amazon" } });
    expect(route(calls[0])).toBe("POST /api/store-products/s1/clone");
    expect(calls[0].body).toEqual({ url });
    expect(findTool("store_product_clone_from_url").entity!(value, { storeId: S, url } as any)).toEqual({ entityType: "storeProduct", entityId: "p9" });
    expect(findTool("store_product_clone_from_url").annotations?.openWorld).toBe(true);
    expect(findTool("store_product_clone_from_url").confirm?.costFeaturePath).toBe("onlineStore.addProduct");

    const preview = await previewTool("store_product_clone_from_url", { storeId: S, url });
    expect(preview.calls).toHaveLength(0);
    expect(preview.text).toContain(url);
  });

  it("store_product_update → PUT …/:productId with only the given fields", async () => {
    const { calls } = await runTool("store_product_update", { version: 1, storeId: S, productId: "p1", price: 25, compareAtPrice: null, status: "draft" }, PRODUCT);
    expect(route(calls[0])).toBe("PUT /api/store-products/s1/p1");
    expect(calls[0].body).toEqual({ price: 25, compareAtPrice: null, status: "draft" });
  });

  it("store_product_update with nothing to change is a ToolInputError", async () => {
    await expect(runTool("store_product_update", { version: 1, storeId: S, productId: "p1" })).rejects.toBeInstanceOf(ToolInputError);
  });

  it("store_product_update_section → PATCH …/:productId/<section> for each of the eleven sections", async () => {
    expect(Object.keys(SECTION_SAMPLES).sort()).toEqual([...PRODUCT_SECTIONS].sort());
    for (const [section, sample] of Object.entries(SECTION_SAMPLES)) {
      const { calls } = await runTool("store_product_update_section", { version: 1, storeId: S, productId: "p1", section, data: sample.data }, PRODUCT);
      expect([section, route(calls[0])]).toEqual([section, `PATCH /api/store-products/s1/p1/${sample.path}`]);
      expect([section, calls[0].body]).toEqual([section, sample.data]);
    }
  });

  it("store_product_update_section with data that does not fit the section is a ToolInputError, and sends nothing", async () => {
    const tool = findTool("store_product_update_section");
    for (const [section, data] of [
      ["stock", { stock: "many" }],
      ["basicInformation", { description: "no name or sku" }],
      ["purchase", { mode: "nowhere" }],
    ] as const) {
      const { http, calls } = stubHttp(PRODUCT);
      const args = tool.input.parse({ storeId: S, productId: "p1", section, data, version: 1 });
      const outcome = tool.run(args, { clients: createClients(http), call: fakeCall(tool, args) });
      await expect(outcome).rejects.toBeInstanceOf(ToolInputError);
      await expect(outcome).rejects.toThrow(`section "${section}"`);
      expect([section, calls]).toEqual([section, []]);
    }
  });

  it("store_product_reorder → PUT …/reorder with { items }", async () => {
    const items = [{ _id: "p1", sortOrder: 0 }, { _id: "p2", sortOrder: 1 }];
    const { calls } = await runTool("store_product_reorder", { storeId: S, items });
    expect(route(calls[0])).toBe("PUT /api/store-products/s1/reorder");
    expect(calls[0].body).toEqual({ items });
  });

  it("store_product_generate_ai_content → POST …/ai/generate; the preview reads the product and the free estimate only", async () => {
    const { calls } = await runTool("store_product_generate_ai_content", { storeId: S, productId: "p1", ...AI_REQUEST, generateVariants: true });
    expect(route(calls[0])).toBe("POST /api/store-products/s1/p1/ai/generate");
    expect(calls[0].body).toEqual({ ...AI_REQUEST, generateVariants: true });
    expect(findTool("store_product_generate_ai_content").confirm?.costFeaturePath).toBe("onlineStore.aiProductContent");

    const estimate = { credits: 3, canAfford: true, sections: ["hero", "faq"] };
    const preview = await previewTool("store_product_generate_ai_content", { storeId: S, productId: "p1", ...AI_REQUEST }, undefined, [PRODUCT, estimate]);
    expect(preview.calls.map(route)).toEqual(["GET /api/store-products/s1/p1", "POST /api/store-products/s1/p1/ai/estimate"]);
    expect(preview.calls[1].body).toEqual(AI_REQUEST);
    expect(preview.text).toMatchObject({ action: expect.stringContaining('"Tee"'), details: estimate });
  });

  it("store_product_delete → DELETE …/:productId; the preview only reads the product", async () => {
    const { value, calls } = await runTool("store_product_delete", { version: 1, storeId: S, productId: "p1" });
    expect(route(calls[0])).toBe("DELETE /api/store-products/s1/p1");
    expect(value).toEqual({ deleted: true, productId: "p1" });

    const preview = await previewTool("store_product_delete", { version: 1, storeId: S, productId: "p1" }, PRODUCT);
    expect(preview.calls.map(route)).toEqual(["GET /api/store-products/s1/p1"]);
    expect(preview.text).toContain('"Tee"');
    expect(preview.text).toContain("cannot be undone");
  });
});

describe("@posty5/mcp — store-catalog tags", () => {
  it("store_tag_search → GET /api/store-tags/:storeId with filters, a date range and cursor paging", async () => {
    const { calls } = await runTool("store_tag_search", { storeId: S, name: "sa", hasAutoRemoval: false, fromDate: "2026-01-01", toDate: "2026-02-01", pageSize: 10 });
    expect(route(calls[0])).toBe("GET /api/store-tags/s1");
    expect(calls[0].params).toEqual({ name: "sa", hasAutoRemoval: "false", fromDate: "2026-01-01", toDate: "2026-02-01", pageSize: 10 });
  });

  it("store_tag_get → GET /api/store-tags/:storeId/:tagId", async () => {
    const { calls } = await runTool("store_tag_get", { storeId: S, tagId: "t1" }, TAG);
    expect(route(calls[0])).toBe("GET /api/store-tags/s1/t1");
  });

  it("store_tag_resolve_products → GET …/resolve with the tag ids joined and the limit", async () => {
    const { calls } = await runTool("store_tag_resolve_products", { storeId: S, tagIds: ["t1", "t2"], limit: 12 });
    expect(route(calls[0])).toBe("GET /api/store-tags/s1/resolve");
    expect(calls[0].params).toEqual({ tagIds: "t1,t2", limit: 12 });
  });

  it("store_tag_list_products → GET …/:tagId/products with search and paging", async () => {
    const { calls } = await runTool("store_tag_list_products", { storeId: S, tagId: "t1", search: "tee", cursor: "c1" });
    expect(route(calls[0])).toBe("GET /api/store-tags/s1/t1/products");
    expect(calls[0].params).toEqual({ search: "tee", cursor: "c1" });
  });

  it("store_tag_get_product_tags → GET …/product/:productId", async () => {
    const { calls } = await runTool("store_tag_get_product_tags", { storeId: S, productId: "p1" }, [TAG]);
    expect(route(calls[0])).toBe("GET /api/store-tags/s1/product/p1");
  });

  it("store_tag_create → POST /api/store-tags/:storeId with the tag, and names the new tag", async () => {
    const args = { storeId: S, name: "Sale", autoRemoveAfterDays: 30 };
    const { value, calls } = await runTool("store_tag_create", args, TAG);
    expect(route(calls[0])).toBe("POST /api/store-tags/s1");
    expect(calls[0].body).toEqual({ name: "Sale", autoRemoveAfterDays: 30 });
    expect(findTool("store_tag_create").entity!(value, args as any)).toEqual({ entityType: "storeTag", entityId: "t1" });
  });

  it("store_tag_update → PUT …/:tagId with only the given fields; nothing to change is a ToolInputError", async () => {
    const { calls } = await runTool("store_tag_update", { version: 1, storeId: S, tagId: "t1", status: "hidden", autoRemoveAfterDays: null }, TAG);
    expect(route(calls[0])).toBe("PUT /api/store-tags/s1/t1");
    expect(calls[0].body).toEqual({ status: "hidden", autoRemoveAfterDays: null });
    await expect(runTool("store_tag_update", { version: 1, storeId: S, tagId: "t1" })).rejects.toBeInstanceOf(ToolInputError);
  });

  it("store_tag_assign_products → POST …/:tagId/products with { productIds }", async () => {
    const { calls } = await runTool("store_tag_assign_products", { storeId: S, tagId: "t1", productIds: ["p1", "p2"] });
    expect(route(calls[0])).toBe("POST /api/store-tags/s1/t1/products");
    expect(calls[0].body).toEqual({ productIds: ["p1", "p2"] });
  });

  it("store_tag_unassign_product → DELETE …/:tagId/products/:productId", async () => {
    const { calls } = await runTool("store_tag_unassign_product", { storeId: S, tagId: "t1", productId: "p1" });
    expect(route(calls[0])).toBe("DELETE /api/store-tags/s1/t1/products/p1");
  });

  it("store_tag_set_product_tags → PUT …/product/:productId with the whole list (empty clears it)", async () => {
    const { calls } = await runTool("store_tag_set_product_tags", { version: 1, storeId: S, productId: "p1", tagIds: [] });
    expect(route(calls[0])).toBe("PUT /api/store-tags/s1/product/p1");
    expect(calls[0].body).toEqual({ tagIds: [] });
  });

  it("store_tag_delete → DELETE …/:tagId; the preview only reads the tag", async () => {
    const { value, calls } = await runTool("store_tag_delete", { version: 1, storeId: S, tagId: "t1" });
    expect(route(calls[0])).toBe("DELETE /api/store-tags/s1/t1");
    expect(value).toEqual({ deleted: true, tagId: "t1" });

    const preview = await previewTool("store_tag_delete", { version: 1, storeId: S, tagId: "t1" }, TAG);
    expect(preview.calls.map(route)).toEqual(["GET /api/store-tags/s1/t1"]);
    expect(preview.text).toContain('"Sale"');
    expect(preview.text).toContain("4 products");
    expect(preview.text).toContain("cannot be undone");
  });
});
