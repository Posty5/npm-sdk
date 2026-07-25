/** ─── Products ─────────────────────────────────────────────────────────── */

export interface IProductImageInput {
  url: string;
  source?: "url" | "upload";
}

export interface IProductOptionInput {
  name: string;
  values: string[];
}

/** One product payload for bulk create (mirrors the single-create schema). */
export interface IBulkProductInput {
  name: string;
  price: number;
  slug?: string;
  description?: string;
  compareAtPrice?: number;
  images?: IProductImageInput[];
  options?: IProductOptionInput[];
  stock?: number | null;
  sku?: string;
  status?: "active" | "hidden";
  sortOrder?: number;
}

export interface IBulkRowResult {
  row: number;
  name?: string;
  status: "imported" | "failed";
  errors: string[];
}

/** Report returned by bulk product create. */
export interface IBulkProductsReport {
  totalRows: number;
  imported: number;
  failed: number;
  creditsCharged: number;
  rows: IBulkRowResult[];
}

/** ─── Orders ───────────────────────────────────────────────────────────── */

export type StoreOrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refused";

export type StoreOrderSource = "facebook" | "instagram" | "whatsapp" | "phone" | "other";

export interface IOrderSearchFilters {
  status?: StoreOrderStatus;
  orderSource?: StoreOrderSource | "storefront";
  orderNumber?: string;
  fromDate?: string;
  toDate?: string;
  cursor?: string;
  pageSize?: number;
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

export interface IPaginated<T> {
  items: T[];
  pagination: {
    nextCursor?: string | null;
    previousCursor?: string | null;
    hasMore?: boolean;
    totalCount?: number;
    pageSize?: number;
  };
}

export interface IOrderItemInput {
  productId: string;
  qty: number;
  options?: Record<string, string>;
}

export interface ICreateOrderInput {
  items: IOrderItemInput[];
  customer: {
    name: string;
    phone: string;
    address: string;
    email?: string;
    notes?: string;
  };
  orderSource?: StoreOrderSource;
  orderSourceNote?: string;
}

/** Full order details (loosely typed — the API returns the full order). */
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
