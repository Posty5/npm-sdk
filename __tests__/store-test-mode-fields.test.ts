/**
 * store-test-mode — the additive `isTest` / `isDemo` fields are optional and
 * typed, so an integration can skip test and demo records. Offline: no API.
 * Written 2026-10-17, not run (ask before running the npm-sdk suite).
 */
import { IStoreCustomer, IStoreOrder, IStoreOrderSummary, IStoreTag, IProductSummary } from "@posty5/store";

describe("@posty5/store — test-mode fields", () => {
  it("accepts a payload with the flags and one without them", () => {
    const withFlags: IStoreOrderSummary = {
      _id: "o1", __v: 0, orderNumber: "ORD-1", customerName: "A", customerPhone: "1", total: 10, currency: "USD",
      status: "pending" as IStoreOrderSummary["status"], orderSource: "storefront", createdFrom: "storefront", createdAt: "2026-10-17",
      isTest: true, isDemo: false,
    };
    const older: IStoreOrderSummary = { ...withFlags };
    delete older.isTest;
    delete older.isDemo;
    expect(withFlags.isTest).toBe(true);
    expect(older.isTest ?? false).toBe(false);
  });

  it("lets a sync skip test orders", () => {
    const orders = [{ isTest: true }, { isTest: false }, {}] as Partial<IStoreOrder>[];
    expect(orders.filter((order) => !order.isTest)).toHaveLength(2);
  });

  it("types isDemo on products, customers and tags", () => {
    const product = { isDemo: true } as Partial<IProductSummary>;
    const customer = { isDemo: true } as Partial<IStoreCustomer>;
    const tag = { isDemo: false } as Partial<IStoreTag>;
    expect([product.isDemo, customer.isDemo, tag.isDemo]).toEqual([true, true, false]);
  });
});
