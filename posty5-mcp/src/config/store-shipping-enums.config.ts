import type { ShippingAssignmentLevel, ShippingProfileType, ShippingRouteLevel } from "@posty5/store";

/** Closed value lists the store-shipping tools accept, mirrored from the `@posty5/store` shipping unions. */

/** The catalogue tier a route prices or blocks (`ShippingRouteLevel`). */
export const SHIPPING_ROUTE_LEVELS = ["governorate", "city"] as const satisfies readonly ShippingRouteLevel[];

/** The tier a package-profile assignment lives at (`ShippingAssignmentLevel`). */
export const SHIPPING_ASSIGNMENT_LEVELS = ["country", "governorate", "city"] as const satisfies readonly ShippingAssignmentLevel[];

/** What a package profile measures (`ShippingProfileType`). */
export const SHIPPING_PROFILE_TYPES = ["weight", "dimension"] as const satisfies readonly ShippingProfileType[];

/** The columns `listRoutes` sorts by (`IShippingRouteFilters.sortField`). */
export const SHIPPING_ROUTE_SORT_FIELDS = ["name", "fee"] as const;

/** Sort direction (`IShippingRouteFilters.sortType`). */
export const SHIPPING_SORT_TYPES = ["asc", "desc"] as const;
