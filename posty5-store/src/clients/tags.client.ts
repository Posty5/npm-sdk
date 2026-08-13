import { IBinaryResponse } from "@posty5/core";
import { BaseStoreClient } from "./base.client";
import {
  IBulkImportReport,
  ICreateTagInput,
  IExcelUploadInput,
  IPaginated,
  IProductSummary,
  IResolveTagProductsParams,
  IStoreTag,
  ITagProductsFilters,
  ITagSearchFilters,
  IUpdateTagInput,
} from "../interfaces";

/**
 * Catalogue tags and product assignments — `/api/store-tags`. Requires
 * `products.manage`. Tag operations are free and unmetered.
 *
 * Assignments live in their own collection rather than as an array on the
 * product, which is what lets an assignment carry its own expiry and lets a tag
 * list its products without scanning the catalogue.
 */
export class StoreTagsClient extends BaseStoreClient {
  private base = "/api/store-tags";

  // ─── Tags ───────────────────────────────────────────────────────────────

  /** Search a store's tags. */
  async search(storeId: string, filters: ITagSearchFilters = {}): Promise<IPaginated<IStoreTag>> {
    const res = await this.http.get<IPaginated<IStoreTag>>(`${this.base}/${storeId}`, { params: this.toQuery(filters) });
    return res.result!;
  }

  async get(storeId: string, tagId: string): Promise<IStoreTag> {
    const res = await this.http.get<IStoreTag>(`${this.base}/${storeId}/${tagId}`);
    return res.result!;
  }

  async create(storeId: string, tag: ICreateTagInput): Promise<IStoreTag> {
    const res = await this.http.post<IStoreTag>(`${this.base}/${storeId}`, tag);
    return res.result!;
  }

  async update(storeId: string, tagId: string, changes: IUpdateTagInput): Promise<IStoreTag> {
    const res = await this.http.put<IStoreTag>(`${this.base}/${storeId}/${tagId}`, changes);
    return res.result!;
  }

  /** Soft-delete a tag and drop its assignments. The products are untouched. */
  async delete(storeId: string, tagId: string): Promise<unknown> {
    const res = await this.http.delete(`${this.base}/${storeId}/${tagId}`);
    return res.result;
  }

  // ─── Assignments ────────────────────────────────────────────────────────

  /**
   * The products carrying any of the given tags, de-duplicated — what a
   * tag-driven storefront section reads.
   */
  async resolveProducts(storeId: string, params: IResolveTagProductsParams): Promise<unknown> {
    const res = await this.http.get(`${this.base}/${storeId}/resolve`, { params: this.toQuery(params) });
    return res.result;
  }

  /** The products assigned to one tag. */
  async listProducts(storeId: string, tagId: string, filters: ITagProductsFilters = {}): Promise<IPaginated<IProductSummary>> {
    const res = await this.http.get<IPaginated<IProductSummary>>(`${this.base}/${storeId}/${tagId}/products`, { params: this.toQuery(filters) });
    return res.result!;
  }

  /** Add up to 200 products to a tag. Products already carrying it are left alone. */
  async assignProducts(storeId: string, tagId: string, productIds: string[]): Promise<unknown> {
    const res = await this.http.post(`${this.base}/${storeId}/${tagId}/products`, { productIds });
    return res.result;
  }

  async unassignProduct(storeId: string, tagId: string, productId: string): Promise<unknown> {
    const res = await this.http.delete(`${this.base}/${storeId}/${tagId}/products/${productId}`);
    return res.result;
  }

  /** The tags carried by one product. */
  async getProductTags(storeId: string, productId: string): Promise<IStoreTag[]> {
    const res = await this.http.get<IStoreTag[]>(`${this.base}/${storeId}/product/${productId}`);
    return res.result!;
  }

  /** Replace one product's whole tag list — tags left out are unassigned. */
  async setProductTags(storeId: string, productId: string, tagIds: string[]): Promise<unknown> {
    const res = await this.http.put(`${this.base}/${storeId}/product/${productId}`, { tagIds });
    return res.result;
  }

  // ─── Excel ──────────────────────────────────────────────────────────────

  /** Download the .xlsx import template. */
  async downloadImportTemplate(storeId: string): Promise<IBinaryResponse> {
    return this.http.getBinary(`${this.base}/${storeId}/import/template`);
  }

  /** Bulk-create tags from a filled-in template, base64-encoded in the body. */
  async importFromExcel(storeId: string, file: IExcelUploadInput): Promise<IBulkImportReport> {
    const res = await this.http.post<IBulkImportReport>(`${this.base}/${storeId}/import`, file);
    return res.result!;
  }

  /** Download the filtered tag set as .xlsx — the same filters as `search`. */
  async exportToExcel(storeId: string, filters: Omit<ITagSearchFilters, "cursor" | "pageSize"> = {}): Promise<IBinaryResponse> {
    return this.http.getBinary(`${this.base}/${storeId}/export`, { params: this.toQuery(filters) });
  }
}
