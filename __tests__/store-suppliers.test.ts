import { HttpClient } from "@posty5/core";
import { StoreClient, StoreSuppliersClient, isQueuedImport } from "@posty5/store";
import { STORE_TEST_CONFIG, TEST_CONFIG } from "./setup";

/**
 * `@posty5/store` — dropshipping (`store.suppliers`).
 *
 * Two parts. The first runs offline: a stub stands in for `HttpClient` and
 * records each call, so every route, verb, body and encoding is pinned without
 * the network. The second runs LIVE against the API, like the rest of this
 * suite, and only when the store fixtures in `setup.ts` are set — it reads,
 * links and unlinks, but never connects, imports, sends or pays.
 */

type Call = { method: string; url: string; body?: unknown; params?: Record<string, unknown> };

function stubHttp(result: unknown = {}) {
  const calls: Call[] = [];
  const answer = async () => ({ result, message: "" });
  const http = {
    get: async (url: string, config?: { params?: Record<string, unknown> }) => (calls.push({ method: "GET", url, params: config?.params }), answer()),
    post: async (url: string, body?: unknown) => (calls.push({ method: "POST", url, body }), answer()),
    put: async (url: string, body?: unknown) => (calls.push({ method: "PUT", url, body }), answer()),
    delete: async (url: string, config?: { params?: Record<string, unknown> }) => (calls.push({ method: "DELETE", url, params: config?.params }), answer()),
  };
  return { http: http as unknown as HttpClient, calls };
}

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
    await client.listSupplierOrders("s1", { needsReview: true, page: 1 });
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
    expect(calls[0].params).toEqual({ needsReview: "true", page: 1 });
    expect(calls[2].body).toEqual({ payNow: true });
    expect(calls[3].body).toEqual({ acceptCost: true });
  });

  it("tells a queued import from an inline one", () => {
    expect(isQueuedImport({ jobId: "j1", rows: null })).toBe(true);
    expect(isQueuedImport({ jobId: null, rows: [] })).toBe(false);
  });
});

const { storeId, supplierIntegrationId, supplierProductId, productId } = STORE_TEST_CONFIG;
const describeLive = TEST_CONFIG.apiKey && storeId ? describe : describe.skip;

describeLive("Store suppliers — live (read, link, unlink)", () => {
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

  it("lists paused supplier orders, paged by number", async () => {
    const page = await store.suppliers.listSupplierOrders(storeId, { needsReview: true, pageSize: 5 });
    expect(Array.isArray(page.items)).toBe(true);
    expect(typeof page.total).toBe("number");
  });

  it("filters store orders by parts that need attention", async () => {
    const page = await store.orders.search(storeId, { needsAttention: true, pageSize: 5 });
    expect(Array.isArray(page.items)).toBe(true);
  });

  (supplierIntegrationId && supplierProductId && productId ? it : it.skip)(
    "links a product to a supplier product, then unlinks it",
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
      } finally {
        await store.suppliers.deleteLink(storeId, link._id);
      }
    },
  );
});
