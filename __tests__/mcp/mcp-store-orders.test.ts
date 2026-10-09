import { CATALOGUE } from "../../posty5-mcp/src/catalogue";
import { findTool, route, runTool } from "./mcp-test.helper";

/**
 * The `store-orders` toolset (mcp-server feature, npm-sdk/mcp-tool-catalogue-
 * package): the route each order and customer tool calls and the arguments it
 * forwards. Offline: a stub stands in for HttpClient.
 */

const S = "s1";
const ORDER = { _id: "o1", orderNumber: "1001", status: "pending" };

/** The table's order. */
const ORDER_TOOL_NAMES = [
  "store_order_search",
  "store_order_get",
  "store_order_statistics",
  "store_order_create",
  "store_order_update_status",
  "store_order_add_note",
  "store_customer_search",
  "store_customer_get",
  "store_customer_get_addresses",
  "store_customer_list_orders",
];

describe("@posty5/mcp — store-orders", () => {
  it("keeps the table's order, and flags every tool that returns shoppers' text as open-world", () => {
    const tools = CATALOGUE.filter((tool) => tool.toolset === "store-orders");
    expect(tools.map((tool) => tool.name)).toEqual(ORDER_TOOL_NAMES);
    for (const tool of tools) expect([tool.name, !!tool.annotations?.openWorld]).toEqual([tool.name, tool.name !== "store_order_statistics"]);
  });

  it("store_order_search → GET /api/store-orders/:storeId with filters and cursor paging", async () => {
    const { calls } = await runTool("store_order_search", {
      storeId: S,
      status: "pending",
      orderSource: "storefront",
      customer: "sara",
      tagIds: ["t1"],
      needsAttention: true,
      fromDate: "2026-09-01",
      toDate: "2026-09-30",
      cursor: "c1",
      pageSize: 10,
    });
    expect(route(calls[0])).toBe("GET /api/store-orders/s1");
    expect(calls[0].params).toEqual({
      status: "pending",
      orderSource: "storefront",
      customer: "sara",
      tagIds: "t1",
      needsAttention: "true",
      fromDate: "2026-09-01",
      toDate: "2026-09-30",
      cursor: "c1",
      pageSize: 10,
    });
  });

  it("store_order_get → GET /api/store-orders/:storeId/:orderId", async () => {
    const { calls } = await runTool("store_order_get", { storeId: S, orderId: "o1" }, ORDER);
    expect(route(calls[0])).toBe("GET /api/store-orders/s1/o1");
  });

  it("store_order_statistics → GET …/statistics with the window and filters", async () => {
    const { calls } = await runTool("store_order_statistics", { storeId: S, days: 7, status: "delivered" });
    expect(route(calls[0])).toBe("GET /api/store-orders/s1/statistics");
    expect(calls[0].params).toEqual({ days: 7, status: "delivered" });
  });

  it("store_order_create → POST /api/store-orders/:storeId with the order, tagged createdFrom mcp", async () => {
    const order = {
      items: [{ productId: "p1", qty: 2, options: { Size: "M" } }],
      customer: { name: "Sara Ali", phone: "+201000000000", address: "12 Nile St", countryIso: "eg", governorateCode: "C", cityKey: "nasr-city" },
      orderSource: "whatsapp",
      orderSourceNote: "WhatsApp chat",
    };
    const args = { storeId: S, ...order };
    const { value, calls } = await runTool("store_order_create", args, ORDER);
    expect(route(calls[0])).toBe("POST /api/store-orders/s1");
    expect(calls[0].body).toEqual({ ...order, createdFrom: "mcp" });
    expect(findTool("store_order_create").entity!(value, args as any)).toEqual({ entityType: "storeOrder", entityId: "o1" });
  });

  it("store_order_create refuses an order with no items or the storefront channel", () => {
    const customer = { name: "Sara Ali", phone: "+201000000000", address: "12 Nile St" };
    const input = findTool("store_order_create").input;
    expect(input.safeParse({ storeId: S, items: [], customer }).success).toBe(false);
    expect(input.safeParse({ storeId: S, items: [{ productId: "p1", qty: 1 }], customer, orderSource: "storefront" }).success).toBe(false);
  });

  it("store_order_update_status → POST …/:orderId/status with the status and the customer note", async () => {
    const { calls } = await runTool("store_order_update_status", { version: 1, storeId: S, orderId: "o1", status: "shipped", note: "On its way" }, ORDER);
    expect(route(calls[0])).toBe("POST /api/store-orders/s1/o1/status");
    expect(calls[0].body).toEqual({ status: "shipped", note: "On its way" });

    const { calls: withoutNote } = await runTool("store_order_update_status", { version: 1, storeId: S, orderId: "o1", status: "confirmed" }, ORDER);
    expect(withoutNote[0].body).toEqual({ status: "confirmed", note: "" });
  });

  it("store_order_add_note → POST …/:orderId/notes with the note", async () => {
    const { calls } = await runTool("store_order_add_note", { storeId: S, orderId: "o1", note: "Called the customer" }, ORDER);
    expect(route(calls[0])).toBe("POST /api/store-orders/s1/o1/notes");
    expect(calls[0].body).toEqual({ note: "Called the customer" });
  });

  it("store_customer_search → GET /api/store-customers/:storeId with the term, account filter and paging", async () => {
    const { calls } = await runTool("store_customer_search", { storeId: S, text: "sara", hasAccount: false, pageSize: 5 });
    expect(route(calls[0])).toBe("GET /api/store-customers/s1");
    expect(calls[0].params).toEqual({ text: "sara", hasAccount: "false", pageSize: 5 });
  });

  it("store_customer_get → GET /api/store-customers/:storeId/:customerId", async () => {
    const { calls } = await runTool("store_customer_get", { storeId: S, customerId: "c1" });
    expect(route(calls[0])).toBe("GET /api/store-customers/s1/c1");
  });

  it("store_customer_get_addresses → GET …/:customerId/addresses", async () => {
    const { calls } = await runTool("store_customer_get_addresses", { storeId: S, customerId: "c1" }, []);
    expect(route(calls[0])).toBe("GET /api/store-customers/s1/c1/addresses");
  });

  it("store_customer_list_orders → GET …/:customerId/orders with cursor paging", async () => {
    const { calls } = await runTool("store_customer_list_orders", { storeId: S, customerId: "c1", cursor: "c2", pageSize: 5 });
    expect(route(calls[0])).toBe("GET /api/store-customers/s1/c1/orders");
    expect(calls[0].params).toEqual({ cursor: "c2", pageSize: 5 });
  });
});
