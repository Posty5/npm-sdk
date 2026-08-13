/**
 * Shipping is modelled as country → governorate → city, and a fee falls through
 * those in order before landing on the store default. `null` at any level means
 * "not set here — inherit"; an explicit `0` is a real fee (free delivery) and
 * stops the fallback. That is why every fee is nullable instead of defaulting
 * to zero.
 *
 * The world's countries, governorates and cities are REFERENCE data and are
 * never stored on a store. A store owns one document per open country, plus one
 * "route" row per place it prices or blocks differently. Everywhere it did not
 * say anything simply has no row — which is also why saving a route that says
 * nothing (no fee, delivery allowed) removes it instead of storing it.
 */

export type ShippingFee = number | null;

/** Which tier of the catalogue a route addresses. */
export type ShippingRouteLevel = "governorate" | "city";

/** Where a resolved fee actually came from. */
export type ShippingFeeSource = "city" | "governorate" | "country" | "storeDefault" | "none";

/** ─── Countries ────────────────────────────────────────────────────────── */

export interface IShippingCountryFilters {
  /** Match on country name or ISO code. */
  text?: string;
  /** Only countries currently open for orders (or, with `false`, only paused ones). */
  isEnabled?: boolean;
  cursor?: string;
  pageSize?: number;
  sortField?: string;
  sortType?: "asc" | "desc";
}

/** One row of the store's shipping-countries grid. */
export interface IShippingCountryRow {
  _id: string;
  iso: string;
  name: string;
  flag: string;
  isEnabled: boolean;
  /** `null` = no country fee set; the store default applies. `0` is a real fee. */
  defaultFee: ShippingFee;
  /** Catalogue size — how many governorates could be priced. */
  governoratesCount: number;
  /** Catalogue size — how many cities could be priced. */
  citiesCount: number;
  /** Rows this store actually owns for the country. */
  routesCount: number;
  /** Of those, how many refuse delivery. */
  blockedRoutesCount: number;
  order: number;
}

export interface IShippingCatalogueFilters {
  /** Match on country name or ISO code. */
  text?: string;
  /** Include countries this store has already opened. */
  includeAdded?: boolean;
  page?: number;
  pageSize?: number;
}

export interface IShippingCatalogueResult {
  items: { iso: string; name: string; flag?: string }[];
  currency: string;
  pagination: { totalCount: number; page: number; pageSize: number };
}

export interface IShippingZone {
  _id: string;
  countryIso: string;
  countryName: string;
  isEnabled: boolean;
  defaultFee: ShippingFee;
  order: number;
}

export interface IAddShippingCountryInput {
  /** Two-letter ISO country code. */
  iso: string;
  /**
   * Required here, unlike everywhere else a fee appears: a country never opens
   * without a price. Everything inside it inherits this until priced separately.
   */
  defaultFee: number;
}

export interface IUpdateShippingCountryInput {
  isEnabled?: boolean;
  defaultFee?: ShippingFee;
  order?: number;
}

/** One country's card, with the fees and settings it sits above. */
export interface IShippingCountryDetails {
  country: IShippingCountryRow;
  storeDefaultFee: number;
  calculation: string;
  currency: string;
}

/** ─── Governorates (catalogue reference data) ──────────────────────────── */

export interface IShippingGovernorate {
  code: string;
  name: string;
  [key: string]: unknown;
}

/** ─── Routes ───────────────────────────────────────────────────────────── */

export interface IShippingRouteFilters {
  /** Which tier to list. Defaults to `governorate`. */
  level?: ShippingRouteLevel;
  /** Narrow a city list to one governorate. */
  governorateCode?: string;
  /** Match on place name. */
  text?: string;
  /** `true` = only places with their own fee; `false` = only inherited ones. */
  hasFee?: boolean;
  /** `true` = only deliverable places; `false` = only blocked ones. */
  isAllowed?: boolean;
  sortField?: "name" | "fee";
  sortType?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

/** One place, with what it charges today and where that price came from. */
export interface IShippingRouteRow {
  level: ShippingRouteLevel;
  governorateCode: string;
  governorateName: string;
  /** Empty on a governorate row. */
  cityKey: string;
  /** Empty on a governorate row. */
  cityName: string;
  /** Present only when this store stored an override for the place. */
  rateId?: string;
  /** The stored override; `null` = the place inherits. */
  fee: ShippingFee;
  /** What the place charges today, once inheritance is applied. */
  effectiveFee: number;
  inheritedFrom: ShippingFeeSource;
  isAllowed: boolean;
  /** Governorate rows only — catalogue size. */
  citiesCount?: number;
}

export interface IShippingRoutesResult {
  items: IShippingRouteRow[];
  /** What the country charges — what an unpriced governorate inherits. */
  countryFee: ShippingFee;
  /** The store-wide fallback, below the country. */
  storeDefaultFee: number;
  currency: string;
  pagination: { totalCount: number; page: number; pageSize: number };
}

/** A saved override on one place. */
export interface IShippingRoute {
  _id: string;
  level: ShippingRouteLevel;
  governorateCode: string;
  governorateName: string;
  cityKey: string;
  cityName: string;
  fee: ShippingFee;
  isAllowed: boolean;
}

/**
 * One route's save. At least one of `fee` / `isAllowed` must be present — a
 * payload saying nothing has nothing to store.
 */
export interface IUpsertShippingRouteInput {
  level: ShippingRouteLevel;
  /** Catalogue state code, upper-case. */
  governorateCode: string;
  /** Required when `level` is `city`. */
  cityKey?: string;
  fee?: ShippingFee;
  isAllowed?: boolean;
}

/** `rate` is `null` when the save cleared the row instead of storing it. */
export interface IUpsertShippingRouteResult {
  cleared?: boolean;
  rate: IShippingRoute | null;
  [key: string]: unknown;
}

export interface IBulkShippingRouteResult {
  saved: {
    level: ShippingRouteLevel;
    governorateCode: string;
    cityKey: string;
    cleared: boolean;
    rate: IShippingRoute | null;
  }[];
  failed: {
    level: ShippingRouteLevel;
    governorateCode: string;
    cityKey?: string;
    message: string;
  }[];
}

/** "Apply one fee to everything in this scope." */
export interface IApplyShippingFeeInput {
  level: ShippingRouteLevel;
  /** Narrow the scope to one governorate; omit to re-price the whole country. */
  governorateCode?: string | null;
  fee: ShippingFee;
  isAllowed?: boolean;
}

/**
 * A fee equal to what the scope already inherits CLEARS its rows rather than
 * writing them — so `cleared` is the success case for "make it all uniform".
 */
export interface IApplyShippingFeeResult {
  written: number;
  cleared: number;
  [key: string]: unknown;
}

/** ─── Preview ──────────────────────────────────────────────────────────── */

export interface IShippingFeePreviewParams {
  countryIso: string;
  /** Catalogue state code — omit to price the country only. */
  governorateCode?: string;
  /** Normalized city key — omit to price the governorate only. */
  cityKey?: string;
}

export interface IShippingFeePreview {
  fee?: number;
  currency?: string;
  inheritedFrom?: ShippingFeeSource;
  isAllowed?: boolean;
  [key: string]: unknown;
}
