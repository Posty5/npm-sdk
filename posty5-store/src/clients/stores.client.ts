import { BaseStoreClient } from "./base.client";
import { IStoreLookupItem } from "../interfaces";

/**
 * The stores the key's owner can manage — owned or staffed — at
 * `/api/store/lookup`. Every other store method takes a `storeId`; this is where
 * one comes from. The rest of `/api/store` is not part of the SDK surface.
 */
export class StoreStoresClient extends BaseStoreClient {
  private base = "/api/store";

  /**
   * Stores you own or are staff on, optionally filtered by name or slug. One
   * page, no cursor: `pageSize` defaults to 10 on the API.
   */
  async lookup(term?: string, pageSize?: number): Promise<IStoreLookupItem[]> {
    const res = await this.http.get<IStoreLookupItem[]>(`${this.base}/lookup`, { params: this.toQuery({ term, pageSize }) });
    return res.result || [];
  }
}
