import { IDateRangeParams, IPaginationParams } from "./common";

/** ─── Shared product pieces ────────────────────────────────────────────── */

export type ProductStatus = "draft" | "active" | "hidden";

export interface IProductImageInput {
  /** Kept when editing an existing image, so variant values referencing it stay valid. */
  _id?: string;
  url: string;
  source?: "url" | "upload";
  bucketFilePath?: string;
}

export interface IProductOptionInput {
  name: string;
  values: string[];
}

/** ─── Stock policy ─────────────────────────────────────────────────────────
 *
 * A sold-out product is a merchant decision, not a fixed rule: some stores want
 * it on the shelf marked unavailable, others want it gone. The store sets the
 * default and a product may overrule it.
 */

/** What the STORE does with a sold-out product. */
export type StoreOutOfStockBehavior = "showUnavailable" | "hide";

/**
 * What THIS product does. `inherit` — the default — defers to the store, which
 * is why the product type has a third member the store type does not.
 */
export type ProductOutOfStockBehavior = "inherit" | StoreOutOfStockBehavior;

/** ─── Create / update ──────────────────────────────────────────────────── */

export interface ICreateProductInput {
  name: string;
  price: number;
  slug?: string;
  description?: string;
  compareAtPrice?: number;
  images?: IProductImageInput[];
  options?: IProductOptionInput[];
  /** `null` = stock not tracked. */
  stock?: number | null;
  sku?: string;
  status?: "active" | "hidden";
  sortOrder?: number;
}

/** One product payload for bulk create (mirrors the single-create schema). */
export type IBulkProductInput = ICreateProductInput;

export interface IUpdateProductInput extends Partial<Omit<ICreateProductInput, "status" | "compareAtPrice">> {
  status?: ProductStatus;
  compareAtPrice?: number | null;
}

export interface ICreateProductDraftInput {
  sku: string;
  name: string;
}

/** ─── Search ───────────────────────────────────────────────────────────── */

export interface IProductSearchFilters extends IPaginationParams {
  /** Partial, case-insensitive match on the product name. */
  name?: string;
  slug?: string;
  sku?: string;
  status?: ProductStatus;
  /** Only products carrying one of these tags. */
  tagIds?: string[];
  /** Drop products carrying one of these tags. */
  excludeTagIds?: string[];
}

export interface IProductSummary {
  _id: string;
  numbering?: number;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  stock?: number | null;
  /** See {@link IProductStockInput.saleBuffer}. `null` = inherit the store's. */
  saleBuffer?: number | null;
  /** See {@link IProductStockInput.outOfStockBehavior}. */
  outOfStockBehavior?: ProductOutOfStockBehavior;
  sku?: string;
  status: ProductStatus;
  sortOrder?: number;
  images?: unknown[];
  createdAt: string;
  updatedAt?: string;
}

/** Full product document — loosely typed, the API returns every section. */
export interface IStoreProduct extends IProductSummary {
  [key: string]: unknown;
}

/** ─── Sections (BE-13 per-tab saves) ───────────────────────────────────── */

export interface IProductBasicInformationInput {
  name: string;
  sku: string;
  description?: string;
}

export interface IProductMediaInput {
  /** The full ordered list — index 0 is the primary image. */
  images: IProductImageInput[];
}

export interface IProductPriceInput {
  price: number | null;
  compareAtPrice?: number | null;
}

export interface IProductStockInput {
  /** `null` = stock not tracked. */
  stock: number | null;
  /**
   * Units held back from sale on this product.
   *
   * `null` (the default) means "use the store's reserve"; `0` means "sell down
   * to the last unit" *regardless* of it. That is the whole reason the field is
   * nullable rather than defaulting to `0` — the two are different answers, and
   * a `0` that meant "unset" would silently re-apply the store's buffer.
   *
   * A product counts as out of stock at `stock - buffer <= 0`, so a buffer of 3
   * on a stock of 3 is sold out with three units still on the shelf.
   */
  saleBuffer?: number | null;
  /** `inherit` (the default) defers to the store's out-of-stock policy. */
  outOfStockBehavior?: ProductOutOfStockBehavior;
}

export interface IVariantValueInput {
  _id?: string;
  /** Client-owned identity that stock combinations reference. */
  key?: string;
  name: string;
  /** Required on a `color` group. */
  colorHex?: string;
  images?: string[];
  extraPrice?: number;
  stock?: number | null;
  order?: number;
  isActive?: boolean;
}

export interface IVariantGroupInput {
  _id?: string;
  key?: string;
  name: string;
  type?: "color" | "size" | "material" | "storage" | "custom";
  isRequired?: boolean;
  order?: number;
  values: IVariantValueInput[];
}

/** One buyable combination — "3XL in Black". */
export interface IVariantStockGroupInput {
  _id?: string;
  key?: string;
  /** Value keys, at most one per group. */
  valueKeys: string[];
  sku?: string;
  stock?: number | null;
  isAvailable?: boolean;
  order?: number;
}

export interface IProductVariantsInput {
  variantGroups: IVariantGroupInput[];
  /**
   * Optional and without a default: omit it to leave the saved combinations
   * alone rather than wipe them with an implicit empty array.
   */
  variantStockGroups?: IVariantStockGroupInput[];
}

export interface IProductTagsInput {
  tagIds: string[];
}

export interface IProductSeoInput {
  seo: {
    title?: string;
    metaDescription?: string;
    ogImage?: string;
    noIndex?: boolean;
  };
  /** The product's slug lives on the SEO section. */
  slug?: string;
}

export interface IProductSettingsInput {
  status?: ProductStatus;
  isFeatured?: boolean;
  minPerOrder?: number | null;
  maxPerOrder?: number | null;
  sortOrder?: number;
}

export interface IProductLandingSection {
  isEnabled?: boolean;
  data?: Record<string, unknown>;
}

export interface IProductLandingInput {
  sectionOrder?: string[];
  /** Keyed by section key — see `getLandingSectionsConfig()`. */
  sections?: Record<string, IProductLandingSection>;
}

/**
 * A surcharge this one product adds to delivery. Always charged **per unit** —
 * five of a product with a `5` fee add `25` — regardless of the store's own
 * `shipping.calculation` mode, because the reason is physical: a bulky item
 * costs more to ship for every copy of it. `null` clears the surcharge.
 */
export interface IProductShippingInput {
  extraFeePerUnit?: number | null;
  /** Merchant-facing reason; snapshotted onto the order, never shown to buyers. */
  note?: string;

  /* ─── The parcel (task12) ────────────────────────────────────────────────
   *
   * What a package profile prices against. `null` is "not measured" — and it
   * matters, because an unmeasured parcel fits NO bracket and the cart falls
   * back to the store's flat rate rather than being quoted the cheapest one.
   * `0` is rejected by the server: a parcel of no size is not a measurement.
   */

  /** Weight in kg. */
  weight?: number | null;
  /** Length in cm. */
  length?: number | null;
  /** Width in cm. */
  width?: number | null;
  /** Height in cm. */
  height?: number | null;

  /**
   * Which profile the four measurements above were filled from, when the
   * merchant used a bracket as a quick-fill. Provenance only — the profile is
   * not consulted again at checkout, the measurements are.
   */
  packageProfileId?: string | null;
  /** Which bracket of that profile. Provenance only, as above. */
  packageConditionKey?: string;
}

export type ProductPurchaseMode = "store" | "external" | "both";

export interface IExternalBuyLinkInput {
  _id?: string;
  storeName?: string;
  url: string;
  price?: number | null;
  currency?: string;
  logoUrl?: string;
  platform?: "amazon" | "aliexpress" | "noon" | "ebay" | "etsy" | "custom";
  order?: number;
  isActive?: boolean;
}

export interface IProductPurchaseInput {
  /** `external` and `both` require at least one link; `external` disables the cart. */
  mode?: ProductPurchaseMode;
  externalLinks?: IExternalBuyLinkInput[];
}

/** ─── Reorder / images / AI ────────────────────────────────────────────── */

export interface IProductSortOrderInput {
  _id: string;
  sortOrder: number;
}

export interface IProductImageUploadUrlInput {
  /** MIME type of the file being uploaded. */
  fileType: string;
  /** Gallery slot index (0–9). */
  index?: number;
  /**
   * Which slot family the file belongs to. The gallery is addressed by `index`;
   * the other purposes have keys of their own so they can never overwrite it.
   */
  purpose?: "gallery" | "seo" | "variant" | "landing";
}

export interface IProductImageUploadUrl {
  uploadUrl: string;
  publicUrl: string;
  bucketFilePath?: string;
  [key: string]: unknown;
}

export interface IProductAiContentInput {
  /** What the product is, in the merchant's own words. */
  brief: string;
  /** Landing sections to write — keys come from `getLandingSectionsConfig()`. */
  sectionKeys: string[];
  generateVariants?: boolean;
  tone?: string;
  language?: string;
}

/** What a generation would cost, before running it. */
export interface IProductAiContentEstimate {
  cost?: number;
  [key: string]: unknown;
}

/** An unsaved draft — apply it with `updateLanding` / `updateVariants`. */
export interface IProductAiContentResult {
  [key: string]: unknown;
}

export interface IDateFilteredProductSearch extends IProductSearchFilters, IDateRangeParams {}
