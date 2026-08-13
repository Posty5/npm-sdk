import { HttpClient } from "@posty5/core";
import { StoreCustomersClient } from "./clients/customers.client";
import { StoreOrdersClient } from "./clients/orders.client";
import { StoreProductsClient } from "./clients/products.client";
import { StoreShippingClient } from "./clients/shipping.client";
import { StoreTagsClient } from "./clients/tags.client";
import {
  IBulkImportReport,
  IBulkProductInput,
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
 * `X-API-Key` header). Every call is scoped to a store id and authorized by the
 * key owner's store permission: `products.manage` for the catalogue and tags,
 * `orders.view` / `orders.create` / `orders.updateStatus` for orders and
 * customers, `settings.manage` for shipping. A store's owner holds all of them.
 *
 * An API key carries the full identity of the user who created it — it is not
 * scoped to one store. Treat it as you would a password.
 *
 * @example
 * ```ts
 * import { HttpClient } from "@posty5/core";
 * import { StoreClient } from "@posty5/store";
 *
 * const http = new HttpClient({ apiKey: process.env.POSTY5_API_KEY });
 * const store = new StoreClient(http);
 *
 * // Catalogue
 * await store.products.create(storeId, { name: "Tee", price: 20, stock: 100 });
 * await store.products.updateStock(storeId, productId, { stock: 42 });
 *
 * // Orders
 * const { items } = await store.orders.search(storeId, { status: "pending" });
 * await store.orders.updateStatus(storeId, items[0]._id, "confirmed");
 *
 * // Tags, customers, shipping
 * await store.tags.assignProducts(storeId, tagId, [productId]);
 * await store.customers.search(storeId, { text: "sara" });
 * await store.shipping.addCountry(storeId, { iso: "eg", defaultFee: 50 });
 * ```
 */
export class StoreClient {
  /** The catalogue: products, variants, landing pages, Excel import. */
  public readonly products: StoreProductsClient;
  /** Orders: search, statistics, manual entry, the status workflow, export. */
  public readonly orders: StoreOrdersClient;
  /** Catalogue tags and product assignments. */
  public readonly tags: StoreTagsClient;
  /** The people who have ordered from the store (read-only). */
  public readonly customers: StoreCustomersClient;
  /** Shipping countries, cities and fees. */
  public readonly shipping: StoreShippingClient;

  constructor(http: HttpClient) {
    this.products = new StoreProductsClient(http);
    this.orders = new StoreOrdersClient(http);
    this.tags = new StoreTagsClient(http);
    this.customers = new StoreCustomersClient(http);
    this.shipping = new StoreShippingClient(http);
  }

  // ─── Shorthands ───────────────────────────────────────────────────────────
  //
  // The four methods this client shipped with, before the sub-clients existed.
  // They stay because they are published API, and they delegate rather than
  // re-implement so there is one code path per endpoint.

  /** Shorthand for `products.bulkCreate`. */
  async bulkCreateProducts(storeId: string, products: IBulkProductInput[]): Promise<IBulkImportReport> {
    return this.products.bulkCreate(storeId, products);
  }

  /** Shorthand for `orders.search`. */
  async searchOrders(storeId: string, filters: IOrderSearchFilters = {}): Promise<IPaginated<IStoreOrderSummary>> {
    return this.orders.search(storeId, filters);
  }

  /** Shorthand for `orders.create`. */
  async createOrder(storeId: string, order: ICreateOrderInput): Promise<IStoreOrder> {
    return this.orders.create(storeId, order);
  }

  /** Shorthand for `orders.updateStatus`. */
  async updateOrderStatus(storeId: string, orderId: string, status: StoreOrderStatus, note?: string): Promise<IStoreOrder> {
    return this.orders.updateStatus(storeId, orderId, status, note);
  }
}
