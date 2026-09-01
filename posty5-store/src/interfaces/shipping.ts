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

/** ─── Package profiles (task12) ─────────────────────────────────────────────
 *
 * A profile is a set of BRACKETS — "up to 1 kg", "up to 5 kg" — and an
 * assignment attaches one to a place with a fee per bracket. At checkout the
 * cart's parcel is measured, the most specific tier holding profiles answers,
 * and the first bracket the parcel fits sets the fee.
 *
 * Two things about this are easy to get backwards, and both cost money:
 *
 *   - A profile answers BEFORE the flat country/governorate/city chain. Where
 *     no profile matches, the flat chain still answers, so profiles are additive
 *     to a store's existing setup rather than a replacement for it.
 *   - The most specific tier with any profiles owns the answer OUTRIGHT — it is
 *     never merged with the tiers above. A city with its own profiles ignores
 *     the governorate's completely, even for a parcel none of its brackets fit.
 */

/** What a profile measures. Immutable after creation. */
export type ShippingProfileType = "weight" | "dimension";

/** Which tier an assignment lives at. */
export type ShippingAssignmentLevel = "country" | "governorate" | "city";

/**
 * One bracket. Every limit is nullable and `null` means "no cap on this
 * measurement" — the opposite of a `null` on the parcel, which means "not
 * measured" and fits nothing.
 */
export interface IShippingProfileCondition {
  /** Client-owned identity a fee points at. Generated server-side when omitted. */
  key?: string;
  /** Shown next to the fee input; generated from the limits when left empty. */
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

export interface IShippingProfile {
  _id: string;
  name: string;
  type: ShippingProfileType;
  description?: string;
  conditions: IShippingProfileCondition[];
  conditionsCount: number;
  /** How many places use it. A profile in use cannot be deleted. */
  assignmentsCount: number;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface ICreateShippingProfileInput {
  name: string;
  /**
   * Immutable afterwards: it decides which limits a bracket may carry, so
   * changing it would reinterpret every bracket already written and every fee
   * already priced against them.
   */
  type: ShippingProfileType;
  description?: string;
  /** Optional — the wizard saves name and type first and fills brackets after. */
  conditions?: IShippingProfileCondition[];
}

/** Note the absence of `type`. See {@link ICreateShippingProfileInput.type}. */
export interface IUpdateShippingProfileInput {
  name?: string;
  description?: string;
  /** Replaces the bracket list wholesale. To append, use `addProfileConditions`. */
  conditions?: IShippingProfileCondition[];
}

/** ─── Profile assignments ─────────────────────────────────────────────────── */

/**
 * Where an assignment lives. `governorateCode` is required at governorate and
 * city level, and `cityKey` at city level: city names repeat across
 * governorates, so the pair is the identity everywhere in this module.
 */
export interface IShippingAssignmentPlace {
  level: ShippingAssignmentLevel;
  governorateCode?: string;
  cityKey?: string;
}

/** One bracket's price at one place. */
export interface IShippingAssignmentFee {
  conditionKey: string;
  /** `null` = not priced here yet; a parcel landing in it falls through. */
  fee: number | null;
}

/** One priced bracket, as the dialog lists it. */
export interface IShippingAssignmentFeeRow extends IShippingAssignmentFee {
  label: string;
  maxWeight: number | null;
  maxLength: number | null;
  maxWidth: number | null;
  maxHeight: number | null;
  order: number;
}

/** One profile assigned to one place. */
export interface IShippingAssignment {
  _id: string;
  profileId: string;
  profileName: string;
  type: ShippingProfileType;
  level: ShippingAssignmentLevel;
  governorateCode: string;
  governorateName: string;
  cityKey: string;
  cityName: string;
  /** Wins over a cheaper alternative at the same place. */
  isDefault: boolean;
  fees: IShippingAssignmentFeeRow[];
  /** Brackets still waiting for a price. */
  unpricedCount: number;
  order: number;
  [key: string]: unknown;
}

/**
 * What a place's profiles look like once inheritance is applied.
 *
 * `inheritedFrom` is what lets a UI say "these are the country's, and they stop
 * applying the moment you add one here" instead of showing an empty list that
 * reads like "nothing ships here".
 */
export interface IShippingAssignmentsView {
  items: IShippingAssignment[];
  /** Which tier the listed rows actually come from. */
  inheritedFrom: ShippingAssignmentLevel | "none";
  /** True when the rows belong to a level ABOVE the one being read. */
  isInherited: boolean;
  [key: string]: unknown;
}

export interface IAssignShippingProfileInput extends IShippingAssignmentPlace {
  profileId: string;
  /**
   * One entry per bracket. A missing or `null` fee is a bracket the merchant
   * has not priced — safe to save, and the parcel falls through to the flat
   * chain rather than shipping free.
   */
  fees?: IShippingAssignmentFee[];
  isDefault?: boolean;
}
