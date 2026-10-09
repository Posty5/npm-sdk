import { StoreOrderCreatedFrom } from "../interfaces";

/**
 * The `createdFrom` values the API accepts on a manual order (it refuses any
 * other with a 400). `HttpClient.createdFrom` is used when it is one of these,
 * so an MCP integration records `"mcp"`; anything else falls back to the SDK's
 * own label.
 */
export const STORE_ORDER_CREATED_FROM_VALUES: StoreOrderCreatedFrom[] = ["cpanel", "api", "swagger", "dotnet", "npmPackage", "mcp"];

/** Used when the client's `createdFrom` is not one of the accepted values. */
export const STORE_ORDER_DEFAULT_CREATED_FROM: StoreOrderCreatedFrom = "npmPackage";
