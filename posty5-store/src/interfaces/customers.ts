import { IPaginationParams } from "./common";

export interface ICustomerSearchFilters extends IPaginationParams {
  /** One term matched across name, phone and email. */
  text?: string;
  /** `true` = only shoppers with a Posty5 account, `false` = only guests. */
  hasAccount?: boolean;
}

/** Figures for one customer in one store, computed from that store's orders. */
export interface IStoreCustomerStats {
  ordersCount: number;
  totalSpent: number;
  currency?: string;
  firstOrderAt?: string;
  lastOrderAt?: string;
}

export interface IStoreCustomer {
  _id: string;
  name?: string;
  phone?: string;
  email?: string;
  /** Whether the shopper has a Posty5 account. Provider ids and tokens are never exposed. */
  hasAccount?: boolean;
  stats?: IStoreCustomerStats;
  [key: string]: unknown;
}

/** An address this customer has actually used with this store. */
export interface IStoreCustomerAddress {
  _id: string;
  label?: string;
  name: string;
  phone: string;
  address: string;
  countryIso?: string;
  countryName?: string;
  governorateCode?: string;
  governorateName?: string;
  cityKey?: string;
  cityName?: string;
  /** LEGACY — still returned for addresses saved before the route model. */
  cityId?: string | null;
  notes?: string;
  isDefault?: boolean;
  [key: string]: unknown;
}
