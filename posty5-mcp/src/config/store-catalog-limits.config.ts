/**
 * The API's caps on the store-catalog writes, declared on the tool schemas so
 * an oversized call is refused before it reaches Posty5. The API enforces the
 * same numbers; these only answer earlier.
 */

/** Most images one product holds (gallery). */
export const PRODUCT_MAX_IMAGES = 10;

/** Most tags one product carries. */
export const PRODUCT_MAX_TAGS = 50;

/** Most products one store_product_reorder call moves. */
export const PRODUCT_REORDER_MAX_ITEMS = 500;

/** Most products one store_tag_assign_products call adds to a tag. */
export const TAG_ASSIGN_MAX_PRODUCTS = 200;

/** Most products store_tag_resolve_products returns. */
export const TAG_RESOLVE_MAX_LIMIT = 100;
