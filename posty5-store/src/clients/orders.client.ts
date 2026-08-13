import { IBinaryResponse } from "@posty5/core";
import { BaseStoreClient } from "./base.client";
import {
  ICreateOrderInput,
  IOrderSearchFilters,
  IOrderStatistics,
  IOrderStatisticsFilters,
  IPaginated,
  IStoreOrder,
  IStoreOrderSummary,
  StoreOrderStatus,
} from "../interfaces";

/**
 * Merchant order management — `/api/store-orders`.
 *
 * Reads need `orders.view`, `create` needs `orders.create` and `updateStatus`
 * needs `orders.updateStatus`; the store owner holds all three.
 */
export class StoreOrdersClient extends BaseStoreClient {
  private base = "/api/store-orders";

  // ─── Read ───────────────────────────────────────────────────────────────

  /** Search a store's orders. */
  async search(storeId: string, filters: IOrderSearchFilters = {}): Promise<IPaginated<IStoreOrderSummary>> {
    const res = await this.http.get<IPaginated<IStoreOrderSummary>>(`${this.base}/${storeId}`, { params: this.toQuery(filters) });
    return res.result!;
  }

  /** One order in full: items, customer, totals, status history and notes. */
  async get(storeId: string, orderId: string): Promise<IStoreOrder> {
    const res = await this.http.get<IStoreOrder>(`${this.base}/${storeId}/${orderId}`);
    return res.result!;
  }

  /** Totals, per-status breakdown, delivered revenue and a per-day series. */
  async statistics(storeId: string, filters: IOrderStatisticsFilters = {}): Promise<IOrderStatistics> {
    const res = await this.http.get<IOrderStatistics>(`${this.base}/${storeId}/statistics`, { params: this.toQuery(filters) });
    return res.result!;
  }

  /**
   * Full details of every order matching the filters, in one payload — what a
   * packing-slip or invoice run reads. Charges nothing.
   */
  async printData(storeId: string, filters: IOrderSearchFilters = {}): Promise<unknown> {
    const res = await this.http.get(`${this.base}/${storeId}/print`, { params: this.toQuery(filters) });
    return res.result;
  }

  /**
   * Download the filtered order set as .xlsx. Unlike the deferred order
   * operations this charges `exportOrders` **before** the file is built, so an
   * unaffordable export is refused rather than delivered free.
   */
  async exportToExcel(storeId: string, filters: IOrderSearchFilters = {}): Promise<IBinaryResponse> {
    return this.http.getBinary(`${this.base}/${storeId}/export`, { params: this.toQuery(filters) });
  }

  // ─── Write ──────────────────────────────────────────────────────────────

  /**
   * Record an order received off-store. Runs the same pricing, stock, numbering
   * and tracking machinery as a real checkout, tagged `createdFrom:
   * "npmPackage"`. Charges the deferred `manualOrder` op. Shipping is resolved
   * server-side from the destination — never send a fee.
   */
  async create(storeId: string, order: ICreateOrderInput): Promise<IStoreOrder> {
    const res = await this.http.post<IStoreOrder>(`${this.base}/${storeId}`, { ...order, createdFrom: "npmPackage" });
    return res.result!;
  }

  /**
   * Move an order to a new status. The workflow is enforced: `pending →
   * confirmed → processing → shipped → delivered`, with `cancelled`/`refused`
   * reachable from any non-terminal state and the terminal states accepting
   * nothing further. Charges the deferred `orderStatusChange`. The note is
   * customer-facing — it reaches the status event and the notification email.
   */
  async updateStatus(storeId: string, orderId: string, status: StoreOrderStatus, note?: string): Promise<IStoreOrder> {
    const res = await this.http.post<IStoreOrder>(`${this.base}/${storeId}/${orderId}/status`, { status, note: note ?? "" });
    return res.result!;
  }

  /** Attach a staff-only note. Charges nothing and sends no email. */
  async addInternalNote(storeId: string, orderId: string, note: string): Promise<IStoreOrder> {
    const res = await this.http.post<IStoreOrder>(`${this.base}/${storeId}/${orderId}/notes`, { note });
    return res.result!;
  }
}
