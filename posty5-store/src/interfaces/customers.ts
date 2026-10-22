import { IPaginationParams } from "./common";

/**
 * How a customer signs in at the store that asks (storefront customer
 * accounts): `store` = an email + password account at THIS store, `posty5` =
 * signs in with Posty5, `guest` = has only ever ordered.
 */
export type StoreCustomerAccountKind = "store" | "posty5" | "guest";

export interface ICustomerSearchFilters extends IPaginationParams {
  /** One term matched across name, phone and email. */
  text?: string;
  /**
   * `true` = only shoppers linked to a Posty5 account; `false` = everyone else:
   * guests and shoppers with only a store (email + password) account. Use
   * `accountKind` on the rows to tell those two apart.
   */
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
  /** Document version: pass it to versioned writes (`update`, `delete`, ...). */
  __v: number;
  name?: string;
  phone?: string;
  email?: string;
  /**
   * Whether the shopper is linked to a Posty5 account. A store (email +
   * password) account alone is `false` — see `accountKind`. Provider ids and
   * tokens are never exposed.
   */
  hasAccount?: boolean;
  /**
   * How the customer signs in at this store: `store`, `posty5` or `guest`.
   * Absent on API responses from before storefront customer accounts.
   */
  accountKind?: StoreCustomerAccountKind;
  /**
   * Whether this store's account for the customer has a verified email (an
   * unverified store account cannot sign in with its password yet). Absent for
   * guests and on older API responses.
   */
  emailVerified?: boolean;
  stats?: IStoreCustomerStats;
  /**
   * Added by the store's demo data. Demo records are removed when the store is
   * published (test mode → live), unless the merchant edited them. Absent on
   * older API responses — treat as `false`.
   */
  isDemo?: boolean;
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
