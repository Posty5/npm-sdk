import type {
  ICreateProductInput,
  IExternalBuyLinkInput,
  IProductImageInput,
  IVariantGroupInput,
  ProductOutOfStockBehavior,
  ProductPurchaseMode,
  ProductStatus,
  StoreTagStatus,
} from "@posty5/store";

/**
 * Closed value lists the store-catalog tools accept, mirrored from the
 * `@posty5/store` unions — `satisfies` fails the build if a value leaves the
 * SDK's union.
 */

export const PRODUCT_STATUSES = ["draft", "active", "hidden"] as const satisfies readonly ProductStatus[];

/** What a create may set; a draft comes from store_product_create_draft instead. */
export const PRODUCT_CREATE_STATUSES = ["active", "hidden"] as const satisfies readonly NonNullable<ICreateProductInput["status"]>[];

export const PRODUCT_IMAGE_SOURCES = ["url", "upload"] as const satisfies readonly NonNullable<IProductImageInput["source"]>[];

export const PRODUCT_OUT_OF_STOCK_BEHAVIORS = ["inherit", "showUnavailable", "hide"] as const satisfies readonly ProductOutOfStockBehavior[];

export const PRODUCT_PURCHASE_MODES = ["store", "external", "both"] as const satisfies readonly ProductPurchaseMode[];

export const EXTERNAL_LINK_PLATFORMS = ["amazon", "aliexpress", "noon", "ebay", "etsy", "custom"] as const satisfies readonly NonNullable<
  IExternalBuyLinkInput["platform"]
>[];

export const VARIANT_GROUP_TYPES = ["color", "size", "material", "storage", "custom"] as const satisfies readonly NonNullable<IVariantGroupInput["type"]>[];

export const TAG_STATUSES = ["active", "hidden"] as const satisfies readonly StoreTagStatus[];

/** The sections store_product_update_section writes — one per SDK `update<Section>` method. */
export const PRODUCT_SECTIONS = [
  "basicInformation",
  "media",
  "price",
  "stock",
  "variants",
  "tags",
  "seo",
  "settings",
  "landing",
  "shipping",
  "purchase",
] as const;
