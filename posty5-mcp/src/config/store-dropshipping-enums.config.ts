import type {
  StoreDropshippingContractModel,
  StoreSupplierLinkSyncField,
  StoreSupplierOrderStatus,
  StoreSupplierPriceRounding,
  StoreSupplierPriceRuleType,
} from "@posty5/store";

/** Closed value lists the store-dropshipping tools accept, mirrored from the `@posty5/store` supplier unions. */

/** How a supplier cost becomes a store price (`StoreSupplierPriceRuleType`). */
export const SUPPLIER_PRICE_RULE_TYPES = ["markupPercent", "markupFixed", "targetMargin"] as const satisfies readonly StoreSupplierPriceRuleType[];

/** How a computed price is rounded (`StoreSupplierPriceRounding`). */
export const SUPPLIER_PRICE_ROUNDINGS = ["none", "nearest", "endsIn99", "endsIn95"] as const satisfies readonly StoreSupplierPriceRounding[];

/** What a product link's sync may overwrite (`StoreSupplierLinkSyncField`). */
export const SUPPLIER_LINK_SYNC_FIELDS = ["stock", "cost", "price", "images", "description"] as const satisfies readonly StoreSupplierLinkSyncField[];

/** The status an imported product starts in (`IImportSupplierProductsInput.defaults.status`). */
export const SUPPLIER_IMPORT_PRODUCT_STATUSES = ["draft", "active", "hidden"] as const;

/** A supplier order's state (`StoreSupplierOrderStatus`). */
export const SUPPLIER_ORDER_STATUSES = [
  "queued",
  "needsReview",
  "submitted",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "failed",
] as const satisfies readonly StoreSupplierOrderStatus[];

/** The contract an order was sold under (`StoreDropshippingContractModel`). */
export const DROPSHIPPING_CONTRACT_MODELS = ["standard", "promiseToSell"] as const satisfies readonly StoreDropshippingContractModel[];
