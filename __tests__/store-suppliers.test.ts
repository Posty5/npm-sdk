import { HttpClient, ValidationError } from "@posty5/core";
import { StoreClient, StoreSuppliersClient, isQueuedImport } from "@posty5/store";
import { STORE_TEST_CONFIG, TEST_CONFIG } from "./setup";
import { stubHttp } from "./helpers/stub-http.helper";

/**
 * `@posty5/store` — dropshipping (`store.suppliers`).
 *
 * Two parts. The first runs offline: a stub stands in for `HttpClient` and
 * records each call, so every route, verb, body and encoding is pinned without
 * the network. The second runs LIVE against the API, like the rest of this
 * suite, and only when the store fixtures in `setup.ts` are set. There is no
 * transport injection in `HttpClient`, so there is no offline path for it.
 *
 * By default the live part reads, links, syncs and unlinks, and flips one
 * automation setting and restores it. It never connects, disconnects or writes
 * a credential. Each test missing its fixture shows as skipped:
 * - import (charges credits) needs `POSTY5_TEST_ALLOW_CHARGES=true`;
 * - submit / retry / pay need `POSTY5_TEST_ORDER_ID` + `POSTY5_TEST_GROUP_KEY`
 *   on the test-mode connection, and expect `testMode`;
 * - cancel and fulfil-manually also need `POSTY5_TEST_ALLOW_PART_TAKEOVER=true`,
 *   because they end the fixture part's supplier flow.
 */

describe("Store suppliers — routes (offline)", () => {
  const base = "/api/store-suppliers/s1";

  it("is reachable from the store facade", () => {
    const { http } = stubHttp();
    expect(new StoreClient(http).suppliers).toBeInstanceOf(StoreSuppliersClient);
  });

  it("reads the catalogue and unwraps the connection list", async () => {
    const { http, calls } = stubHttp({ items: [{ _id: "i1" }] });
    const client = new StoreSuppliersClient(http);
    await client.catalogue("s1");
    expect(await client.list("s1")).toEqual([{ _id: "i1" }]);
    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual([`GET ${base}/catalogue`, `GET ${base}`]);
  });

  it("sends credentials in the body, never the URL", async () => {
    const { http, calls } = stubHttp();
    await new StoreSuppliersClient(http).connect("s1", { supplierKey: "cjdropshipping", credentials: { apiKey: "secret" } });
    expect(calls[0]).toEqual({ method: "POST", url: base, body: { supplierKey: "cjdropshipping", credentials: { apiKey: "secret" } } });
    expect(calls[0].url).not.toContain("secret");
  });

  it("maps every connection route", async () => {
    const { http, calls } = stubHttp();
    const client = new StoreSuppliersClient(http);
    await client.replaceCredentials("s1", "i1", { credentials: { apiKey: "k" } });
    await client.updateSettings("s1", "i1", { settings: { fromCountryCode: "US" } });
    await client.updateAutomation("s1", "i1", { mode: "submit" });
    await client.setEnabled("s1", "i1", true);
    await client.test("s1", "i1");
    await client.getBalance("s1", "i1");
    await client.getDisconnectImpact("s1", "i1");
    await client.startOAuth("s1", { supplierKey: "aliexpress" });
    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual([
      `PUT ${base}/i1`,
      `PUT ${base}/i1/settings`,
      `PUT ${base}/i1/automation`,
      `PUT ${base}/i1/enabled`,
      `POST ${base}/i1/test`,
      `GET ${base}/i1/balance`,
      `GET ${base}/i1/impact`,
      `POST ${base}/oauth/start`,
    ]);
    expect(calls[3].body).toEqual({ enabled: true });
  });

  it("disconnects with force as a string query value", async () => {
    const { http, calls } = stubHttp();
    await new StoreSuppliersClient(http).disconnect("s1", "i1", { force: true });
    expect(calls[0]).toEqual({ method: "DELETE", url: `${base}/i1`, params: { force: "true" } });
  });

  it("maps browse, product, import and links", async () => {
    const { http, calls } = stubHttp({ items: [] });
    const client = new StoreSuppliersClient(http);
    await client.browseProducts("s1", "i1", { q: "mug", page: 2 });
    await client.getProduct("s1", "i1", "p/1");
    await client.resolveUrl("s1", "i1", "https://cjdropshipping.com/product/x");
    await client.previewImport("s1", "i1", { items: [{ supplierProductId: "p1" }] });
    await client.importProducts("s1", "i1", { items: [{ supplierProductId: "p1" }] });
    await client.getImportStatus("s1", "job1");
    await client.listLinks("s1", { productId: "prod1" });
    await client.createLink("s1", { productId: "prod1", integrationId: "i1", supplierProductId: "p1", variants: [{ supplierVariantId: "v1" }] });
    await client.updateLink("s1", "l1", { sync: { price: true } });
    await client.syncLink("s1", "l1");
    await client.deleteLink("s1", "l1");
    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual([
      `GET ${base}/i1/products`,
      `GET ${base}/i1/products/p%2F1`,
      `POST ${base}/i1/products/resolve-url`,
      `POST ${base}/i1/import/preview`,
      `POST ${base}/i1/import`,
      `GET ${base}/imports/job1`,
      `GET ${base}/links`,
      `POST ${base}/links`,
      `PUT ${base}/links/l1`,
      `POST ${base}/links/l1/sync`,
      `DELETE ${base}/links/l1`,
    ]);
    expect(calls[0].params).toEqual({ q: "mug", page: 2 });
    expect(calls[6].params).toEqual({ productId: "prod1" });
  });

  it("maps supplier orders and encodes the part key", async () => {
    const { http, calls } = stubHttp();
    const client = new StoreSuppliersClient(http);
    await client.listSupplierOrders("s1", { needsReview: true, pageSize: 25 });
    await client.getSupplierOrder("s1", "so1");
    await client.submitGroup("s1", "o1", "supplier:i1", { payNow: true });
    await client.retry("s1", "so1", { acceptCost: true });
    await client.pay("s1", "so1");
    await client.cancel("s1", "so1");
    await client.fulfilGroupManually("s1", "o1", "supplier:i1");
    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual([
      `GET ${base}/orders`,
      `GET ${base}/orders/so1`,
      `POST ${base}/orders/o1/groups/supplier%3Ai1/submit`,
      `POST ${base}/orders/so1/retry`,
      `POST ${base}/orders/so1/pay`,
      `POST ${base}/orders/so1/cancel`,
      `POST ${base}/orders/o1/groups/supplier%3Ai1/fulfil-manually`,
    ]);
    expect(calls[0].params).toEqual({ needsReview: "true", pageSize: 25 });
    expect(calls[2].body).toEqual({ payNow: true });
    expect(calls[3].body).toEqual({ acceptCost: true });
  });

  it("pages supplier orders by cursor and returns the list envelope", async () => {
    const envelope = {
      items: [{ _id: "so2" }],
      pagination: { nextCursor: "c3", previousCursor: "c1", hasMore: true, totalCount: 30, pageSize: 25 },
    };
    const { http, calls } = stubHttp(envelope);
    const page = await new StoreSuppliersClient(http).listSupplierOrders("s1", { cursor: "c2", pageSize: 25, status: "failed" });
    expect(calls[0]).toEqual({ method: "GET", url: `${base}/orders`, params: { cursor: "c2", pageSize: 25, status: "failed" } });
    expect(calls[0].params).not.toHaveProperty("page");
    expect(page).toEqual(envelope);
    expect(page.pagination.nextCursor).toBe("c3");
  });

  it("tells a queued import from an inline one", () => {
    expect(isQueuedImport({ jobId: "j1", rows: null })).toBe(true);
    expect(isQueuedImport({ jobId: null, rows: [] })).toBe(false);
  });
});

const { storeId, supplierIntegrationId, supplierProductId, productId, orderId, groupKey, allowCharges, allowPartTakeover } =
  STORE_TEST_CONFIG;
const describeLive = TEST_CONFIG.apiKey && storeId ? describe : describe.skip;
/** Runs only when every named fixture is set; otherwise it shows as skipped. */
const itWith = (...fixtures: unknown[]) => (fixtures.every(Boolean) ? it : it.skip);

/**
 * A paused outcome is thrown (HTTP 400) rather than returned, so a group action
 * against the test-mode connection is read from either side.
 */
async function outcomeOf(action: Promise<unknown>): Promise<string> {
  try {
    return JSON.stringify(await action);
  } catch (error) {
    expect(error).toBeInstanceOf(ValidationError);
    const failure = error as ValidationError;
    return `${failure.message} ${JSON.stringify(failure.details ?? {})}`;
  }
}

describeLive("Store suppliers — live (fixture store, test-mode connection)", () => {
  let store: StoreClient;

  beforeAll(() => {
    store = new StoreClient(new HttpClient({ apiKey: TEST_CONFIG.apiKey, baseUrl: TEST_CONFIG.baseUrl }));
  });

  it("reads the catalogue", async () => {
    const catalogue = await store.suppliers.catalogue(storeId);
    expect(Array.isArray(catalogue.items)).toBe(true);
    expect(catalogue.items.every((entry) => typeof entry.available === "boolean")).toBe(true);
  });

  it("lists connections without any credential", async () => {
    const connections = await store.suppliers.list(storeId);
    for (const connection of connections) {
      expect(connection).not.toHaveProperty("credentials");
      expect(typeof connection.hasCredentials).toBe("boolean");
    }
  });

  it("lists paused supplier orders, paged by cursor", async () => {
    const page = await store.suppliers.listSupplierOrders(storeId, { needsReview: true, pageSize: 5 });
    expect(Array.isArray(page.items)).toBe(true);
    expect(typeof page.pagination.hasMore).toBe("boolean");
    expect(typeof page.pagination.totalCount).toBe("number");
    if (page.pagination.hasMore) {
      const next = await store.suppliers.listSupplierOrders(storeId, { needsReview: true, pageSize: 5, cursor: page.pagination.nextCursor! });
      expect(Array.isArray(next.items)).toBe(true);
    }
  });

  it("filters store orders by parts that need attention", async () => {
    const page = await store.orders.search(storeId, { needsAttention: true, pageSize: 5 });
    expect(Array.isArray(page.items)).toBe(true);
  });

  it("lists product links", async () => {
    const links = await store.suppliers.listLinks(storeId, productId ? { productId } : {});
    expect(Array.isArray(links)).toBe(true);
  });

  it("reads a supplier order from the queue, when there is one", async () => {
    const page = await store.suppliers.listSupplierOrders(storeId, { pageSize: 1 });
    if (!page.items.length) return console.log("No supplier orders on the fixture store; getSupplierOrder not exercised.");
    const row = await store.suppliers.getSupplierOrder(storeId, page.items[0]._id);
    expect(row._id).toBe(page.items[0]._id);
    expect(typeof row.status).toBe("string");
    expect(typeof row.destinationRedacted).toBe("boolean");
  });

  it("reads an order with its parts typed", async () => {
    const id = orderId || (await store.orders.search(storeId, { pageSize: 1 })).items[0]?._id;
    if (!id) return console.log("No orders on the fixture store; orders.get not exercised.");
    const order = await store.orders.get(storeId, id);
    expect(order.fulfilmentGroups === undefined || Array.isArray(order.fulfilmentGroups)).toBe(true);
    for (const group of order.fulfilmentGroups ?? []) {
      expect(typeof group.key).toBe("string");
      expect(["merchant", "thirdParty"]).toContain(group.kind);
      expect(Array.isArray(group.lineKeys)).toBe(true);
    }
    expect(order.supplierOrders === undefined || Array.isArray(order.supplierOrders)).toBe(true);
  });

  // ─── Against the test-mode connection ────────────────────────────────────

  itWith(supplierIntegrationId)("reads the balance at the supplier", async () => {
    const balance = await store.suppliers.getBalance(storeId, supplierIntegrationId);
    expect(typeof balance.amount).toBe("number");
    expect(typeof balance.currency).toBe("string");
  });

  itWith(supplierIntegrationId)("tests the connection", async () => {
    const result = await store.suppliers.test(storeId, supplierIntegrationId);
    expect(typeof result.ok).toBe("boolean");
  });

  itWith(supplierIntegrationId)("browses the catalogue one small page at a time", async () => {
    const page = await store.suppliers.browseProducts(storeId, supplierIntegrationId, { page: 1, pageSize: 5 });
    expect(Array.isArray(page.items)).toBe(true);
    expect(page.items.length).toBeLessThanOrEqual(5);
    for (const item of page.items) expect(typeof item.supplierProductId).toBe("string");
  });

  itWith(supplierIntegrationId, supplierProductId)("previews an import without creating or charging", async () => {
    const preview = await store.suppliers.previewImport(storeId, supplierIntegrationId, { items: [{ supplierProductId }] });
    expect(preview.rows).toHaveLength(1);
    expect(preview.rows[0].supplierProductId).toBe(supplierProductId);
    expect(typeof preview.totals.credits).toBe("number");
  });

  itWith(supplierIntegrationId)("round-trips the automation settings and restores them", async () => {
    const before = (await store.suppliers.list(storeId)).find((row) => row._id === supplierIntegrationId);
    expect(before).toBeDefined();
    const original = before!.automation;
    try {
      const changed = await store.suppliers.updateAutomation(storeId, supplierIntegrationId, {
        allowUnpaidOrders: !original.allowUnpaidOrders,
      });
      expect(changed.automation.allowUnpaidOrders).toBe(!original.allowUnpaidOrders);
    } finally {
      const restored = await store.suppliers.updateAutomation(storeId, supplierIntegrationId, {
        mode: original.mode,
        allowUnpaidOrders: original.allowUnpaidOrders,
        maxCostPerOrder: original.maxCostPerOrder ?? null,
        maxCostRatio: original.maxCostRatio ?? null,
        allowedCountries: original.allowedCountries,
      });
      expect(restored.automation.allowUnpaidOrders).toBe(original.allowUnpaidOrders);
    }
  });

  itWith(supplierIntegrationId, supplierProductId, productId)(
    "links a product to a supplier product, syncs it, then unlinks it",
    async () => {
      const product = await store.suppliers.getProduct(storeId, supplierIntegrationId, supplierProductId);
      const link = await store.suppliers.createLink(storeId, {
        productId,
        integrationId: supplierIntegrationId,
        supplierProductId,
        variants: [{ combinationKey: null, supplierVariantId: product.variants[0].supplierVariantId }],
        syncNow: false,
      });
      try {
        expect(link.supplierProductId).toBe(supplierProductId);
        const updated = await store.suppliers.updateLink(storeId, link._id, { sync: { price: false } });
        expect(updated.sync.price).toBe(false);
        // Never synced (syncNow: false), so the once-a-minute limit does not apply yet.
        const synced = await store.suppliers.syncLink(storeId, link._id);
        expect(synced.link._id).toBe(link._id);
        expect(Array.isArray(synced.changed)).toBe(true);
      } finally {
        await store.suppliers.deleteLink(storeId, link._id);
      }
    },
  );

  // ─── Guarded: charges or acts on a supplier order ─────────────────────────

  itWith(allowCharges, supplierIntegrationId, supplierProductId)(
    "imports one product as a draft, then deletes it (POSTY5_TEST_ALLOW_CHARGES)",
    async () => {
      const created: string[] = [];
      try {
        const result = await store.suppliers.importProducts(storeId, supplierIntegrationId, {
          items: [{ supplierProductId }],
          defaults: { status: "draft" },
          allowDuplicate: true,
        });
        // One product is always under the inline limit, but a queued answer is still a valid answer.
        const rows = isQueuedImport(result) ? (await store.suppliers.getImportStatus(storeId, result.jobId)).rows ?? [] : result.rows;
        for (const row of rows) if (row.productId) created.push(row.productId);
        if (!isQueuedImport(result)) {
          expect(result.rows).toHaveLength(1);
          expect(result.rows[0].state).toBe("added");
        }
      } finally {
        for (const id of created) await store.products.delete(storeId, id);
      }
    },
  );

  itWith(orderId, groupKey)("submits the fixture part and is told it is a test connection", async () => {
    expect(await outcomeOf(store.suppliers.submitGroup(storeId, orderId, groupKey))).toContain("testMode");
  });

  itWith(orderId, groupKey)("retries and pays the fixture part's supplier order, still in test mode", async () => {
    const page = await store.suppliers.listSupplierOrders(storeId, { orderId });
    const row = page.items.find((item) => item.fulfilmentGroupKey === groupKey);
    expect(row).toBeDefined();
    expect(await outcomeOf(store.suppliers.retry(storeId, row!._id))).toContain("testMode");
    const paid = await outcomeOf(store.suppliers.pay(storeId, row!._id));
    // Nothing is ever paid through a test connection.
    expect(paid).not.toMatch(/"status":"confirmed"/);
  });

  itWith(orderId, groupKey, allowPartTakeover)(
    "cancels the fixture part's supplier order, then fulfils the part by hand (POSTY5_TEST_ALLOW_PART_TAKEOVER)",
    async () => {
      const page = await store.suppliers.listSupplierOrders(storeId, { orderId });
      const row = page.items.find((item) => item.fulfilmentGroupKey === groupKey);
      expect(row).toBeDefined();
      await outcomeOf(store.suppliers.cancel(storeId, row!._id));
      expect((await store.suppliers.getSupplierOrder(storeId, row!._id)).status).toBe("cancelled");
      const manual = await store.suppliers.fulfilGroupManually(storeId, orderId, groupKey);
      expect(manual.orderId).toBe(orderId);
    },
  );
});
