import { IDateRangeParams, IPaginationParams } from "./common";

export type StoreTagStatus = "active" | "hidden";

export interface ICreateTagInput {
  name: string;
  slug?: string;
  description?: string;
  status?: StoreTagStatus;
  /**
   * Days before an assignment is removed automatically. `null` = never —
   * a zero-day period would be indistinguishable from "no expiry".
   */
  autoRemoveAfterDays?: number | null;
}

export type IUpdateTagInput = Partial<ICreateTagInput>;

export interface ITagSearchFilters extends IPaginationParams, IDateRangeParams {
  name?: string;
  slug?: string;
  status?: StoreTagStatus;
  /** Presence filter on the automatic-removal period, not a value one. */
  hasAutoRemoval?: boolean;
}

export interface IStoreTag {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  status: StoreTagStatus;
  autoRemoveAfterDays?: number | null;
  productsCount?: number;
  createdAt: string;
  [key: string]: unknown;
}

export interface ITagProductsFilters extends IPaginationParams {
  /** Match on product name within the tag's products. */
  search?: string;
}

export interface IResolveTagProductsParams {
  tagIds: string[];
  /** Maximum products to return (default 12, cap 100). */
  limit?: number;
}
