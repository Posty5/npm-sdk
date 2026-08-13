import { IDateRangeParams, IPaginationParams } from "./common";

export type StoreOrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refused";

/** Business channel an order came from. `storefront` is reserved for real checkouts. */
export type StoreOrderSource = "facebook" | "instagram" | "whatsapp" | "phone" | "other";

/** Technical origin of the record. */
export type StoreOrderCreatedFrom = "storefront" | "cpanel" | "api" | "swagger" | "dotnet" | "npmPackage";

/**
 * The filters every order list shares — search, statistics, export and print
 * all read the same set, so an export can never disagree with the list.
 */
export interface IOrderSearchFilters extends IPaginationParams, IDateRangeParams {
  status?: StoreOrderStatus;
  orderSource?: StoreOrderSource | "storefront";
  createdFrom?: StoreOrderCreatedFrom;
  orderNumber?: string;
  publicTrackingId?: string;
  /** One term matched across customer name, phone and email. */
  customer?: string;
  /** Matches the item name snapshotted on the order, so it survives a rename. */
  productName?: string;
  productId?: string;
  /** Orders containing any product carrying one of these tags. */
  tagIds?: string[];
}

export interface IStoreOrderSummary {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  total: number;
  currency: string;
  status: StoreOrderStatus;
  orderSource: string;
  createdFrom: string;
  createdAt: string;
}

/** Full order details — loosely typed, the API returns the whole document. */
export interface IStoreOrder {
  _id: string;
  orderNumber: string;
  publicTrackingId: string;
  status: StoreOrderStatus;
  orderSource: string;
  createdFrom: string;
  totals: { subtotal: number; shipping: number; total: number; currency: string };
  [key: string]: unknown;
}

export interface IOrderItemInput {
  productId: string;
  qty: number;
  /** Chosen variant values, keyed by group name. */
  options?: Record<string, string>;
}

export interface IOrderCustomerInput {
  name: string;
  phone: string;
  address: string;
  email?: string;
  notes?: string;
  /**
   * Shipping destination. Whether it is required depends on the store's open
   * countries — the fee itself is always resolved server-side.
   */
  countryIso?: string | null;
  /** Catalogue state code, upper-case. */
  governorateCode?: string | null;
  /**
   * Normalized city key. City names repeat across governorates, so it is the
   * pair that identifies a destination — send the governorate too.
   */
  cityKey?: string | null;
}

export interface ICreateOrderInput {
  items: IOrderItemInput[];
  customer: IOrderCustomerInput;
  orderSource?: StoreOrderSource;
  orderSourceNote?: string;
}

export interface IOrderStatistics {
  total: number;
  byStatus: Record<StoreOrderStatus, number>;
  revenue: { delivered: number; currency?: string };
  perDay: { date: string; count: number }[];
}

export interface IOrderStatisticsFilters extends Omit<IOrderSearchFilters, "cursor" | "pageSize"> {
  /** Window length in days (1–365, default 30). */
  days?: number;
}
