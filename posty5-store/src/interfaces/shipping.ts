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
  /** Document version: pass it to versioned writes (`update`, `delete`, ...). */
  __v: number;
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
  /** Document version: pass it to versioned writes (`update`, `delete`, ...). */
  __v: number;
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
  /** Document version: pass it to versioned writes (`update`, `delete`, ...). */
  __v: number;
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

/** ─── Package profiles and parcel prices ─────────────────────────────────────
 *
 * A profile is ONE parcel size — "up to 1 kg", "up to 30×20×10 cm" — and a
 * parcel price is what that size costs at one place. The country is the base;
 * a governorate or a city may set its own price for a size, and every size it
 * leaves alone keeps the price above it. The walk is per size: a city that
 * prices only the small box still charges the country's price for the large one.
 *
 * At checkout the parcel is priced as the SMALLEST size it fits that has a
 * price on its path (city → governorate → country). When none does — an
 * unmeasured cart, a parcel bigger than every size — the flat
 * country/governorate/city fee answers instead, never 0.
 */

/** What a profile measures. Immutable after creation. */
export type ShippingProfileType = "weight" | "dimension";

/** Where a parcel price lives. */
export type ShippingAssignmentLevel = "country" | "governorate" | "city";

/**
 * A profile's size. Every limit is nullable and `null` means "no cap on this
 * measurement" — the opposite of a `null` on the parcel, which means "not
 * measured" and fits nothing.
 */
export interface IShippingProfileCondition {
  /** Identity every price points at. Generated server-side when omitted; send it back unchanged on an update. */
  key?: string;
  /** Shown next to the price; generated from the limits when left empty. */
  label?: string;
  /** kg. */
  maxWeight?: number | null;
  /** cm. */
  maxLength?: number | null;
  maxWidth?: number | null;
  maxHeight?: number | null;
  order?: number;
}

export interface IShippingProfileFilters {
  /** Match on the profile name. */
  text?: string;
  type?: ShippingProfileType;
  cursor?: string;
  pageSize?: number;
  sortField?: string;
  sortType?: "asc" | "desc";
}

/** Where a profile is priced, as the profiles list shows it. */
export interface IShippingProfilePricing {
  /** Its base price in each country that has one. */
  countries: { countryIso: string; countryName: string; fee: number }[];
  /** Governorate and city prices of its own, across every country. */
  overridesCount: number;
}

export interface IShippingProfile {
  _id: string;
  /** Document version: pass it to versioned writes (`update`, `delete`, ...). */
  __v: number;
  name: string;
  type: ShippingProfileType;
  description?: string;
  /** The profile's one size; `null` only on a profile saved before profiles were one size each. */
  condition: IShippingProfileCondition | null;
  /** The same size as a one-item list, for clients that read the older shape. */
  conditions: IShippingProfileCondition[];
  pricing: IShippingProfilePricing;
  /** How many prices it has: one per country plus its governorate and city overrides. */
  assignmentsCount: number;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface ICreateShippingProfileInput {
  name: string;
  /**
   * Immutable afterwards: it decides which limits the size may carry, so
   * changing it would reinterpret the size and every price already set for it.
   */
  type: ShippingProfileType;
  description?: string;
  /** Exactly one size — the API refuses none or several. Several sizes are several profiles. */
  conditions: [IShippingProfileCondition];
}

/** Note the absence of `type`. See {@link ICreateShippingProfileInput.type}. */
export interface IUpdateShippingProfileInput {
  name?: string;
  description?: string;
  /** The new size, still exactly one. Keep its `key` so the prices set for it stay attached. */
  conditions?: [IShippingProfileCondition];
}

/** What `deleteProfile` removed with the profile. */
export interface IDeleteShippingProfileResult {
  /** The parcel prices set for it, at every place. */
  removedPrices: number;
}

/** One spreadsheet upload: a profile per accepted row, and why the others were refused. */
export interface IShippingProfileImportReport {
  totalRows: number;
  imported: number;
  failed: number;
  /** `row` is the spreadsheet row number. */
  errors: { row: number; message: string }[];
  /** The profiles the upload created, in sheet order. */
  created: { _id: string; name: string }[];
}

/** ─── Parcel prices ───────────────────────────────────────────────────────── */

/**
 * A place a parcel price is read or written at. `governorateCode` is required
 * at governorate and city level, and `cityKey` at city level: city names repeat
 * across governorates, so the pair is the identity everywhere in this module.
 */
export interface IShippingAssignmentPlace {
  level: ShippingAssignmentLevel;
  governorateCode?: string;
  cityKey?: string;
}

/** A profile's size, as every pricing table lists it. */
export interface IShippingPriceBracket {
  key: string;
  label: string;
  maxWeight: number | null;
  maxLength: number | null;
  maxWidth: number | null;
  maxHeight: number | null;
}

/** The place a price came from, named for display ("60 from Egypt"). */
export interface IShippingPriceSource {
  level: ShippingAssignmentLevel;
  placeName: string;
}

/** What a parcel of one size pays at a place once the fall-through is applied. */
export interface IShippingEffectivePrice {
  fee: number;
  source: IShippingPriceSource;
  /** Set when this size is priced nowhere on the path and a bigger profile answers for it. */
  via?: { profileId: string; profileName: string };
}

/** One row of a place's pricing table. */
export interface IShippingPlacePriceRow {
  profileId: string;
  profileName: string;
  type: ShippingProfileType;
  bracket: IShippingPriceBracket;
  /** This place's own price, or `null` when it has none. */
  fee: number | null;
  /** The id of that own price (for `updateParcelPrice` / `removeParcelPrice`), or `null`. */
  priceId: string | null;
  /** The price a `null` here falls through to, from the nearest place above. */
  inherited: (IShippingPriceSource & { fee: number }) | null;
  /** What a parcel of this size is charged here in the end. */
  effective: IShippingEffectivePrice | null;
}

/** A place's pricing table: every profile, smallest first. */
export interface IShippingPlacePrices {
  place: IShippingAssignmentPlace;
  items: IShippingPlacePriceRow[];
  countryName: string;
  governorateName: string;
  cityName: string;
  currency: string;
}

/** One profile's price at the place being saved; `fee: null` removes the place's own price. */
export interface IShippingPlacePriceInput {
  profileId: string;
  fee: number | null;
}

export interface ISaveShippingPlacePricesInput extends IShippingAssignmentPlace {
  /** At most 1000. Profiles left out keep whatever the place has. */
  prices: IShippingPlacePriceInput[];
}

export interface ISaveShippingPlacePricesResult {
  saved: number;
  cleared: number;
}

/** Filters for the store-wide list of parcel prices. */
export interface IShippingParcelPriceFilters {
  /** ISO 3166-1 alpha-2. */
  countryIso?: string;
  profileId?: string;
  cursor?: string;
  /** Default 50, at most 200. */
  pageSize?: number;
}

/** One price the merchant set, as the store-wide list shows it. */
export interface IShippingParcelPriceRow {
  priceId: string;
  /** The price row's version: pass it to `updateParcelPrice` / `removeParcelPrice`. */
  __v: number;
  profileId: string;
  profileName: string;
  type: ShippingProfileType;
  bracket: IShippingPriceBracket;
  countryIso: string;
  countryName: string;
  level: ShippingAssignmentLevel;
  governorateCode: string;
  governorateName: string;
  cityKey: string;
  cityName: string;
  fee: number;
}
