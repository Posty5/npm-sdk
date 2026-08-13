import { BaseStoreClient } from "./base.client";
import {
  ICustomerSearchFilters,
  IPaginated,
  IPaginationParams,
  IStoreCustomer,
  IStoreCustomerAddress,
  IStoreOrderSummary,
} from "../interfaces";

/**
 * The merchant's view of the people who have ordered from their store —
 * `/api/store-customers`. Requires `orders.view`.
 *
 * Read-only by design: a customer record is derived from orders and, when the
 * shopper has a Posty5 account, owned by them.
 *
 * Every method is scoped to the store. A customer who has never ordered here
 * answers 404, so a guessed id cannot be told apart from a customer of another
 * store.
 */
export class StoreCustomersClient extends BaseStoreClient {
  private base = "/api/store-customers";

  /** Search the store's customers, with per-store order counts and spend. */
  async search(storeId: string, filters: ICustomerSearchFilters = {}): Promise<IPaginated<IStoreCustomer>> {
    const res = await this.http.get<IPaginated<IStoreCustomer>>(`${this.base}/${storeId}`, { params: this.toQuery(filters) });
    return res.result!;
  }

  /** One customer's profile and their figures for this store. */
  async get(storeId: string, customerId: string): Promise<IStoreCustomer> {
    const res = await this.http.get<IStoreCustomer>(`${this.base}/${storeId}/${customerId}`);
    return res.result!;
  }

  /** Only the addresses this customer has used with this store. */
  async addresses(storeId: string, customerId: string): Promise<IStoreCustomerAddress[]> {
    const res = await this.http.get<IStoreCustomerAddress[]>(`${this.base}/${storeId}/${customerId}/addresses`);
    return res.result!;
  }

  /** This store's orders for one customer — never orders placed elsewhere. */
  async orders(storeId: string, customerId: string, pagination: IPaginationParams = {}): Promise<IPaginated<IStoreOrderSummary>> {
    const res = await this.http.get<IPaginated<IStoreOrderSummary>>(`${this.base}/${storeId}/${customerId}/orders`, {
      params: this.toQuery(pagination),
    });
    return res.result!;
  }
}
