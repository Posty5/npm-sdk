import { IBinaryResponse } from "@posty5/core";
import { BaseStoreClient } from "./base.client";
import {
  IBulkImportReport,
  IBulkProductInput,
  ICreateProductDraftInput,
  ICreateProductInput,
  IExcelUploadInput,
  IPaginated,
  IProductAiContentEstimate,
  IProductAiContentInput,
  IProductAiContentResult,
  IProductBasicInformationInput,
  IProductImageUploadUrl,
  IProductImageUploadUrlInput,
  IProductLandingInput,
  IProductMediaInput,
  IProductPriceInput,
  IProductPurchaseInput,
  IProductSearchFilters,
  IProductSeoInput,
  IProductSettingsInput,
  IProductShippingInput,
  IProductSortOrderInput,
  IProductStockInput,
  IProductSummary,
  IProductTagsInput,
  IProductVariantsInput,
  IStoreProduct,
  IUpdateProductInput,
} from "../interfaces";

/**
 * The store catalogue — `/api/store-products`. Requires the `products.manage`
 * store permission.
 *
 * Two ways to write a product, on purpose. `create`/`update` take the whole
 * document and suit an integration that owns the product outright. The
 * `update*` section methods write only the part they name, so a sync job that
 * owns stock and a merchant editing the description in the control panel never
 * overwrite each other.
 */
export class StoreProductsClient extends BaseStoreClient {
  private base = "/api/store-products";

  // ─── Read ───────────────────────────────────────────────────────────────

  /** Search a store's products. */
  async search(storeId: string, filters: IProductSearchFilters = {}): Promise<IPaginated<IProductSummary>> {
    const res = await this.http.get<IPaginated<IProductSummary>>(`${this.base}/${storeId}`, { params: this.toQuery(filters) });
    return res.result!;
  }

  /** Get one product in full — variants, landing sections and purchase config included. */
  async get(storeId: string, productId: string): Promise<IStoreProduct> {
    const res = await this.http.get<IStoreProduct>(`${this.base}/${storeId}/${productId}`);
    return res.result!;
  }

  /**
   * The landing-section vocabulary: every section key, its fields and their
   * rules. Read this before calling `updateLanding` or the AI methods — the
   * section keys they accept come from here. Not store-scoped.
   */
  async getLandingSectionsConfig(): Promise<unknown> {
    const res = await this.http.get(`${this.base}/config/landing-sections`);
    return res.result;
  }

  // ─── Create ─────────────────────────────────────────────────────────────

  /** Create one product from a complete payload. Charges `addProduct`. */
  async create(storeId: string, product: ICreateProductInput): Promise<IStoreProduct> {
    const res = await this.http.post<IStoreProduct>(`${this.base}/${storeId}`, product);
    return res.result!;
  }

  /**
   * Create up to 200 products in one call. Charges `addProduct` per created
   * row — the whole batch is checked for affordability first, so an
   * unaffordable batch is refused before anything is written. A row that fails
   * validation is reported and skipped; it does not abort the batch.
   */
  async bulkCreate(storeId: string, products: IBulkProductInput[]): Promise<IBulkImportReport> {
    const res = await this.http.post<IBulkImportReport>(`${this.base}/${storeId}/bulk`, { products });
    return res.result!;
  }

  /**
   * Create a draft from just a SKU and a name, then fill it in through the
   * section methods — so a client never has to hold one large unsaved form.
   */
  async createDraft(storeId: string, draft: ICreateProductDraftInput): Promise<IStoreProduct> {
    const res = await this.http.post<IStoreProduct>(`${this.base}/${storeId}/draft`, draft);
    return res.result!;
  }

  /**
   * Clone a product from a link on any storefront. The page is scraped and a
   * draft is created with `purchase.mode: "external"` and one buy link back to
   * the source. No SKU is accepted — that is the merchant's own article number.
   */
  async cloneFromUrl(storeId: string, url: string): Promise<IStoreProduct> {
    const res = await this.http.post<IStoreProduct>(`${this.base}/${storeId}/clone`, { url });
    return res.result!;
  }

  // ─── Excel ──────────────────────────────────────────────────────────────

  /** Download the .xlsx import template (header row plus one sample row). */
  async downloadImportTemplate(storeId: string): Promise<IBinaryResponse> {
    return this.http.getBinary(`${this.base}/${storeId}/import/template`);
  }

  /** Bulk-create products from a filled-in template, base64-encoded in the body. */
  async importFromExcel(storeId: string, file: IExcelUploadInput): Promise<IBulkImportReport> {
    const res = await this.http.post<IBulkImportReport>(`${this.base}/${storeId}/import`, file);
    return res.result!;
  }

  // ─── Update / delete ────────────────────────────────────────────────────

  /** Replace any subset of the product's top-level fields. */
  async update(storeId: string, productId: string, changes: IUpdateProductInput): Promise<IStoreProduct> {
    const res = await this.http.put<IStoreProduct>(`${this.base}/${storeId}/${productId}`, changes);
    return res.result!;
  }

  /**
   * Soft-delete a product. It leaves the catalogue and the storefront; orders
   * that reference it keep their snapshotted item rows.
   */
  async delete(storeId: string, productId: string): Promise<unknown> {
    const res = await this.http.delete(`${this.base}/${storeId}/${productId}`);
    return res.result;
  }

  /** Set `sortOrder` on up to 500 products — the storefront display order. */
  async reorder(storeId: string, items: IProductSortOrderInput[]): Promise<unknown> {
    const res = await this.http.put(`${this.base}/${storeId}/reorder`, { items });
    return res.result;
  }

  // ─── Sections ───────────────────────────────────────────────────────────

  /** Name, SKU and description. The slug is on the SEO section, not here. */
  async updateBasicInformation(storeId: string, productId: string, input: IProductBasicInformationInput): Promise<IStoreProduct> {
    return this.patchSection(storeId, productId, "basic-information", input);
  }

  /** The full ordered image list — index 0 is the primary image. */
  async updateMedia(storeId: string, productId: string, input: IProductMediaInput): Promise<IStoreProduct> {
    return this.patchSection(storeId, productId, "media", input);
  }

  /** Selling price and the optional compare-at price. */
  async updatePrice(storeId: string, productId: string, input: IProductPriceInput): Promise<IStoreProduct> {
    return this.patchSection(storeId, productId, "price", input);
  }

  /** Product-level stock. `null` means stock is not tracked. */
  async updateStock(storeId: string, productId: string, input: IProductStockInput): Promise<IStoreProduct> {
    return this.patchSection(storeId, productId, "stock", input);
  }

  /** Variant groups and, optionally, the buyable stock combinations. */
  async updateVariants(storeId: string, productId: string, input: IProductVariantsInput): Promise<IStoreProduct> {
    return this.patchSection(storeId, productId, "variants", input);
  }

  /** Replace the product's whole tag list. */
  async updateTags(storeId: string, productId: string, input: IProductTagsInput): Promise<IStoreProduct> {
    return this.patchSection(storeId, productId, "tags", input);
  }

  /** Meta title, description, social image, index policy — and the slug. */
  async updateSeo(storeId: string, productId: string, input: IProductSeoInput): Promise<IStoreProduct> {
    return this.patchSection(storeId, productId, "seo", input);
  }

  /** Publication status, featured flag, per-order limits and sort position. */
  async updateSettings(storeId: string, productId: string, input: IProductSettingsInput): Promise<IStoreProduct> {
    return this.patchSection(storeId, productId, "settings", input);
  }

  /** The landing sections: which are enabled, their order and each one's data. */
  async updateLanding(storeId: string, productId: string, input: IProductLandingInput): Promise<IStoreProduct> {
    return this.patchSection(storeId, productId, "landing", input);
  }

  /**
   * A delivery surcharge for this one product, always charged per unit —
   * regardless of the store's `shipping.calculation` mode, because a bulky item
   * costs more to ship for every copy of it.
   */
  async updateShipping(storeId: string, productId: string, input: IProductShippingInput): Promise<IStoreProduct> {
    return this.patchSection(storeId, productId, "shipping", input);
  }

  /**
   * How the product is bought: `store` through the cart, `external` on another
   * shop, or `both`. `external` and `both` need at least one link.
   */
  async updatePurchase(storeId: string, productId: string, input: IProductPurchaseInput): Promise<IStoreProduct> {
    return this.patchSection(storeId, productId, "purchase", input);
  }

  // ─── Images ─────────────────────────────────────────────────────────────

  /**
   * A short-lived signed URL to PUT an image straight to storage, plus the
   * public URL to save on the product. `purpose` keeps the slot families
   * apart — a `seo` or `variant` image can never overwrite a gallery slot.
   */
  async createImageUploadUrl(storeId: string, productId: string, input: IProductImageUploadUrlInput): Promise<IProductImageUploadUrl> {
    const res = await this.http.post<IProductImageUploadUrl>(`${this.base}/${storeId}/${productId}/image-upload-url`, input);
    return res.result!;
  }

  // ─── AI content ─────────────────────────────────────────────────────────

  /** Price a landing-page generation before running it. Charges nothing. */
  async estimateAiContent(storeId: string, productId: string, input: IProductAiContentInput): Promise<IProductAiContentEstimate> {
    const res = await this.http.post<IProductAiContentEstimate>(`${this.base}/${storeId}/${productId}/ai/estimate`, input);
    return res.result!;
  }

  /**
   * Write the requested landing sections from a brief. Credits are withdrawn on
   * real token usage, capped at the estimate. The result is an **unsaved**
   * draft — apply it with `updateLanding` / `updateVariants`.
   */
  async generateAiContent(storeId: string, productId: string, input: IProductAiContentInput): Promise<IProductAiContentResult> {
    const res = await this.http.post<IProductAiContentResult>(`${this.base}/${storeId}/${productId}/ai/generate`, input);
    return res.result!;
  }

  private async patchSection(storeId: string, productId: string, section: string, body: unknown): Promise<IStoreProduct> {
    const res = await this.http.patch<IStoreProduct>(`${this.base}/${storeId}/${productId}/${section}`, body);
    return res.result!;
  }
}
