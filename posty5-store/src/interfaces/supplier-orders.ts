import { StoreDropshippingContractModel } from "./suppliers";

/** ─── Dropshipping: supplier orders and order parts ────────────────────────
 *
 * Its own file because `orders.ts` imports from it: a supplier order is joined
 * into the store order, and keeping these here avoids a cycle with
 * `suppliers.ts`.
 */

export type StoreFulfilmentGroupStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

export type StoreSupplierOrderStatus =
  | "queued"
  | "needsReview"
  | "submitted"
  /** Accepted AND paid at the supplier. */
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "failed";

/** Why a supplier order is paused. `needsReview` never clears without a person or a changed input. */
export type StoreSupplierOrderReviewReason =
  | "insufficientBalance"
  | "variantUnavailable"
  | "destinationUnsupported"
  | "costAboveLimit"
  | "costChanged"
  | "customerPaymentPending"
  | "customerPaymentNotSettled"
  | "connectionUnhealthy"
  | "supplierRefused"
  | "connectionMissing"
  | "supplierAlreadyShipped"
  | "testMode"
  | "customerCaptureFailed";

export type StoreSupplierPaymentStatus = "notRequired" | "unpaid" | "paid" | "refunded";

export interface IStoreSupplierOrderLine {
  lineKey: string;
  productId?: string;
  name?: string;
  supplierVariantId: string;
  qty: number;
  unitCost?: number;
  snapshotCost?: number;
}

export interface IStoreSupplierOrderCosts {
  products: number;
  freight: number;
  total: number;
  currency: string;
}

/** The merchant's payment to the supplier — never the shopper's. */
export interface IStoreSupplierOrderPayment {
  status: StoreSupplierPaymentStatus;
  amount?: number;
  currency?: string;
  paidAt?: string;
  reference?: string;
  /** Where to finish payment on the supplier's site, when it cannot be paid through the api. */
  paymentUrl?: string;
}

export interface IStoreSupplierOrderShipping {
  method?: string;
  carrierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
}

export interface IStoreSupplierOrderEvent {
  status: StoreSupplierOrderStatus;
  reason?: StoreSupplierOrderReviewReason;
  message?: string;
  byUserId?: string;
  byRole: string;
  at: string;
}

/** One attempt at sending one order part to its supplier. */
export interface IStoreSupplierOrder {
  _id: string;
  storeId: string;
  orderId: string;
  orderNumber?: string;
  /** The order part this belongs to (`supplier:<integrationId>`). */
  fulfilmentGroupKey: string;
  integrationId: string;
  supplierKey: string;
  attempt: number;
  status: StoreSupplierOrderStatus;
  reviewReason?: StoreSupplierOrderReviewReason | null;
  /** The supplier's words, redacted. */
  reviewMessage?: string | null;
  /** Whether trying again with nothing changed may succeed. */
  retryable: boolean;
  supplierOrderId?: string | null;
  /** Our number, sent to the supplier as its order number. */
  supplierOrderNumber: string;
  /** The supplier's own status, verbatim. */
  supplierStatus?: string | null;
  contractModel?: StoreDropshippingContractModel;
  lines: IStoreSupplierOrderLine[];
  costs?: IStoreSupplierOrderCosts | null;
  payment: IStoreSupplierOrderPayment;
  shipping?: IStoreSupplierOrderShipping | null;
  shipmentId?: string | null;
  /** Present only for a caller holding `orders.customerData.view`. */
  destination?: Record<string, unknown>;
  destinationRedacted: boolean;
  events: IStoreSupplierOrderEvent[];
  submittedAt?: string | null;
  acceptedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

/** Page-number paging (the supplier routes do not use cursors). */
export interface IPageNumberParams {
  page?: number;
  pageSize?: number;
}

export interface IPagedItems<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface ISupplierOrderSearchFilters extends IPageNumberParams {
  status?: StoreSupplierOrderStatus;
  /** Only paused supplier orders. */
  needsReview?: boolean;
  integrationId?: string;
  orderId?: string;
  contractModel?: StoreDropshippingContractModel;
}

/** What sending, retrying or paying concluded. A pause is thrown as an error instead (see the client). */
export interface ISupplierOrderActionResult {
  status: StoreSupplierOrderStatus;
  retryable: boolean;
  reason?: StoreSupplierOrderReviewReason | string;
  message?: string;
  supplierOrderRowId?: string;
  supplierOrderId?: string | null;
  [key: string]: unknown;
}

// ─── On a store order ───────────────────────────────────────────────────────

export interface IOrderFulfilmentGroupShipment {
  carrierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  status?: string;
  [key: string]: unknown;
}

/** One part of an order: the store's own items, or one supplier connection's. */
export interface IOrderFulfilmentGroup {
  key: string;
  kind: "merchant" | "thirdParty";
  /** Human wording, e.g. "Shipped by the store". */
  label: string;
  integrationId?: string;
  supplierKey?: string;
  supplierName?: string;
  lineKeys: string[];
  status: StoreFulfilmentGroupStatus;
  statusAt?: string;
  needsAttention: boolean;
  supplierOrderId?: string;
  shipment?: IOrderFulfilmentGroupShipment;
  deliveryEstimate?: { minDays: number; maxDays: number; countryIso?: string };
  warnings: string[];
  fulfilledManually?: boolean;
}

/** On each row of the order list. */
export interface IOrderFulfilmentSummary {
  parts: number;
  shipped: number;
  delivered: number;
  needsAttention: boolean;
}
