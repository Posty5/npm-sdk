import { ConflictError, HttpClient } from "@posty5/core";
import { StoreProductsClient, StoreClient, IProductStockInput, IStoreProduct } from "@posty5/store";
import { STORE_TEST_CONFIG, TEST_CONFIG } from "./setup";

/**
 * `@posty5/store` — product section PATCHes carry the product's version
 * (optimistic-concurrency, npm-sdk 5.0.0).
 *
 * The first part runs offline over a recording stub. The second runs LIVE,
 * only with the `POSTY5_TEST_STORE_ID` + `POSTY5_TEST_PRODUCT_ID` fixtures: it
 * re-saves the product's stock section with its current values, so the
 * product's content is left as it was (only `__v` moves).
 */

type RecordedPatch = { method: string; url: string; body: unknown; version?: number };

function recordingHttp(version: number) {
  const calls: RecordedPatch[] = [];
  const http = {
    createdFrom: "npmPackage",
    patch: async (url: string, body: unknown, config?: { version?: number }) => {
      calls.push({ method: "PATCH", url, body, version: config?.version });
      return { message: "", result: { _id: "p1" }, version };
    },
  };
  return { http: http as unknown as HttpClient, calls };
}

describe("Store products — versioned section PATCH (offline)", () => {
  it("sends the version with the section and returns __v from the envelope", async () => {
    const { http, calls } = recordingHttp(8);
    const updated = await new StoreProductsClient(http).updateStock("s1", "p1", { stock: 4 }, 7);
    expect(calls).toEqual([{ method: "PATCH", url: "/api/store-products/s1/p1/stock", body: { stock: 4 }, version: 7 }]);
    expect(updated.__v).toBe(8);
  });

  it("every named wrapper passes its version through patchSection", async () => {
    const { http, calls } = recordingHttp(1);
    const client = new StoreProductsClient(http);
    await client.updateSettings("s1", "p1", {} as any, 3);
    await client.updateSeo("s1", "p1", {} as any, 4);
    expect(calls.map((call) => `${call.url} v${call.version}`)).toEqual([
      "/api/store-products/s1/p1/settings v3",
      "/api/store-products/s1/p1/seo v4",
    ]);
  });

  it("refuses a missing or invalid version before sending anything", async () => {
    const { http, calls } = recordingHttp(1);
    const client = new StoreProductsClient(http);
    await expect(client.updateStock("s1", "p1", { stock: 1 }, undefined as unknown as number)).rejects.toThrow(TypeError);
    await expect(client.patchSection("s1", "p1", "stock", { stock: 1 }, -1)).rejects.toThrow(TypeError);
    expect(calls).toHaveLength(0);
  });
});

const { storeId, productId } = STORE_TEST_CONFIG;
const describeLive = TEST_CONFIG.apiKey && storeId && productId ? describe : describe.skip;

describeLive("Store products — versioned section PATCH (live, fixture product)", () => {
  let store: StoreClient;

  beforeAll(() => {
    store = new StoreClient(new HttpClient({ apiKey: TEST_CONFIG.apiKey, baseUrl: TEST_CONFIG.baseUrl }));
  });

  const sameStock = (product: IStoreProduct): IProductStockInput => ({
    stock: product.stock ?? null,
    saleBuffer: product.saleBuffer ?? null,
    outOfStockBehavior: product.outOfStockBehavior ?? "inherit",
  });

  it("current version → saved and __v goes up; the returned __v chains; a stale one is a ConflictError", async () => {
    const before = await store.products.get(storeId, productId);
    expect(typeof before.__v).toBe("number");

    const first = await store.products.updateStock(storeId, productId, sameStock(before), before.__v);
    expect(first.__v).toBeGreaterThan(before.__v);

    const second = await store.products.updateStock(storeId, productId, sameStock(before), first.__v);
    expect(second.__v).toBeGreaterThan(first.__v);

    const stale = store.products.updateStock(storeId, productId, sameStock(before), before.__v);
    await expect(stale).rejects.toBeInstanceOf(ConflictError);
    await stale.catch((error: ConflictError) => {
      expect(error.currentVersion).toBe(second.__v);
      expect(error.resourceId).toBe(productId);
    });
  });
});
