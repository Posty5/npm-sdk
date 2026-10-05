/**
 * The price-list operations (`featurePath`) the paid store-catalog tools quote
 * before they are confirmed. The paths are the API's
 * (`api/packages/domain/src/models/subscriptions/plans/data.ts`, priced in
 * `credit-operation-setting/data.ts`); the price itself is always read live.
 */

/** Adding a product. A clone from a link is charged as several of these — see `CLONE_ADD_PRODUCT_MULTIPLIER`. */
export const ADD_PRODUCT_FEATURE_PATH = "onlineStore.addProduct";

/** Writing product landing content with AI, priced per 1,000 tokens and capped at the estimate. */
export const AI_PRODUCT_CONTENT_FEATURE_PATH = "onlineStore.aiProductContent";

/** How many product additions one clone is charged as (`CLONE_CREDIT_MULTIPLIER` in the API's products module). */
export const CLONE_ADD_PRODUCT_MULTIPLIER = 3;
