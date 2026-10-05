import type { StoreOrderCreatedFrom, StoreOrderSource, StoreOrderStatus } from "@posty5/store";

/**
 * Closed value lists the store-orders tools accept, mirrored from the
 * `@posty5/store` unions — `satisfies` fails the build if a value leaves the
 * SDK's union.
 */

export const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refused"] as const satisfies readonly StoreOrderStatus[];

/** Channels a manually entered order may name; `storefront` is reserved for real checkouts. */
export const ORDER_SOURCES = ["facebook", "instagram", "whatsapp", "phone", "other"] as const satisfies readonly StoreOrderSource[];

/** Channels an order search may filter by: the manual ones plus `storefront`. */
export const ORDER_SOURCE_FILTERS = [...ORDER_SOURCES, "storefront"] as const;

export const ORDER_CREATED_FROM = ["storefront", "cpanel", "api", "swagger", "dotnet", "npmPackage", "mcp"] as const satisfies readonly StoreOrderCreatedFrom[];
