/**
 * The API's caps on the store-orders calls, declared on the tool schemas so an
 * out-of-range call is refused before it reaches Posty5.
 */

/** Most lines one manually entered order holds. */
export const ORDER_MAX_ITEMS = 100;

/** Longest statistics window, in days. */
export const ORDER_STATISTICS_MAX_DAYS = 365;
