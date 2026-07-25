import { HttpClient } from "@posty5/core";
import {
  IBulkProductInput,
  IBulkProductsReport,
  ICreateOrderInput,
  IOrderSearchFilters,
  IPaginated,
  IStoreOrder,
  IStoreOrderSummary,
  StoreOrderStatus,
} from "./interfaces";

/**
 * Online Store management client for the Posty5 API.
 *
 * Authenticate with an API key via `@posty5/core`'s `HttpClient` (sent as the
 * `X-API-Key` header). All calls are scoped to a store id and require the key
 * owner to have the matching store permission (`products.manage`,
 * `orders.view` / `orders.create` / `orders.updateStatus`).
 *
 * @example
 * ```ts
 * import { HttpClient } from "@posty5/core";
 * import { StoreClient } from "@posty5/store";
 *
 * const http = new HttpClient({ apiKey: process.env.POSTY5_API_KEY });
 * const store = new StoreClient(http);
 *
 * await store.bulkCreateProducts(storeId, [{ name: "Tee", price: 20 }]);
 * const orders = await store.searchOrders(storeId, { status: "pending" });
 * const order = await store.createOrder(storeId, {
 *   items: [{ productId, qty: 1 }],
 *   customer: { name: "Sara", phone: "0100", address: "Cairo" },
 *   orderSource: "facebook",
 * });
 * await store.updateOrderStatus(storeId, order._id, "confirmed");
 * ```
 */
export class StoreClient {
  private http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  // ─── Products ─────────────────────────────────────────────────────────────

  /** Create many products in one call (charges `addProduct` per created row). */
  async bulkCreateProducts(storeId: string, products: IBulkProductInput[]): Promise<IBulkProductsReport> {
    const res = await this.http.post<IBulkProductsReport>(`/api/store-products/${storeId}/bulk`, { products });
    return res.result!;
  }

  // ─── Orders ───────────────────────────────────────────────────────────────

  /** Search a store's orders with optional filters (status / source / number /
   *  date range) and cursor pagination. */
  async searchOrders(
    storeId: string,
    filters: IOrderSearchFilters = {},
  ): Promise<IPaginated<IStoreOrderSummary>> {
    const res = await this.http.get<IPaginated<IStoreOrderSummary>>(`/api/store-orders/${storeId}`, {
      params: filters,
    });
    return res.result!;
  }

  /** Create an order manually (e.g. an order received off-store). Tagged with
   *  `createdFrom: "npmPackage"`. Charges the deferred `manualOrder` op. */
  async createOrder(storeId: string, order: ICreateOrderInput): Promise<IStoreOrder> {
    const res = await this.http.post<IStoreOrder>(`/api/store-orders/${storeId}`, {
      ...order,
      createdFrom: "npmPackage",
    });
    return res.result!;
  }

  /** Change an order's status (respects the BE-08 workflow; charges the deferred
   *  `orderStatusChange`). An optional note is attached to the status event. */
  async updateOrderStatus(
    storeId: string,
    orderId: string,
    status: StoreOrderStatus,
    note?: string,
  ): Promise<IStoreOrder> {
    const res = await this.http.post<IStoreOrder>(`/api/store-orders/${storeId}/${orderId}/status`, {
      status,
      note: note ?? "",
    });
    return res.result!;
  }
}
