import { IBinaryResponse } from "@posty5/core";
import { BaseStoreClient } from "./base.client";
import {
  IAddShippingCountryInput,
  IApplyShippingFeeInput,
  IApplyShippingFeeResult,
  IBulkShippingRouteResult,
  IPaginated,
  IShippingCatalogueFilters,
  IShippingCatalogueResult,
  IShippingCountryDetails,
  IShippingCountryFilters,
  IShippingCountryRow,
  IShippingFeePreview,
  IShippingFeePreviewParams,
  IShippingGovernorate,
  IShippingRouteFilters,
  IShippingRoutesResult,
  IShippingZone,
  IUpdateShippingCountryInput,
  IUpsertShippingRouteInput,
  IUpsertShippingRouteResult,
  IAssignShippingProfileInput,
  IBulkImportReport,
  ICreateShippingProfileInput,
  IExcelUploadInput,
  IShippingAssignment,
  IShippingAssignmentPlace,
  IShippingAssignmentsView,
  IShippingProfile,
  IShippingProfileCondition,
  IShippingProfileFilters,
  IUpdateShippingProfileInput,
  ShippingProfileType,
} from "../interfaces";

/**
 * Where a store delivers and what it charges — `/api/store-shipping`. Requires
 * `settings.manage`.
 *
 * The model is country → governorate → city, and a fee falls through those in
 * order before landing on the store default. A store stores one document per
 * open country plus one route row per place it prices or blocks differently;
 * everywhere it said nothing simply has no row. That is why `upsertRoute` with
 * nothing to say removes the row, and why `applyFee` with the inherited fee
 * clears rows rather than writing them.
 */
export class StoreShippingClient extends BaseStoreClient {
  private base = "/api/store-shipping";

  // ─── Countries ──────────────────────────────────────────────────────────

  /** The countries this store has opened for delivery. */
  async listCountries(storeId: string, filters: IShippingCountryFilters = {}): Promise<IPaginated<IShippingCountryRow>> {
    const res = await this.http.get<IPaginated<IShippingCountryRow>>(`${this.base}/${storeId}/countries`, {
      params: this.toQuery(filters),
    });
    return res.result!;
  }

  /**
   * The world catalogue minus what this store already opened — what an "add a
   * country" picker reads. Pass `includeAdded` for the full list.
   */
  async listCountryCatalogue(storeId: string, filters: IShippingCatalogueFilters = {}): Promise<IShippingCatalogueResult> {
    const res = await this.http.get<IShippingCatalogueResult>(`${this.base}/${storeId}/countries/catalogue`, {
      params: this.toQuery(filters),
    });
    return res.result!;
  }

  /** One country's card, plus the store default fee, calculation mode and currency. */
  async getCountry(storeId: string, iso: string): Promise<IShippingCountryDetails> {
    const res = await this.http.get<IShippingCountryDetails>(`${this.base}/${storeId}/countries/${iso}`);
    return res.result!;
  }

  /**
   * Open a country for delivery. `defaultFee` is required — a country never
   * opens without a price. Every governorate and city inside it inherits that
   * fee; no rows are written for them until one is priced differently. Refuses
   * a country that has already been added.
   */
  async addCountry(storeId: string, input: IAddShippingCountryInput): Promise<{ zone: IShippingZone }> {
    const res = await this.http.post<{ zone: IShippingZone }>(`${this.base}/${storeId}/countries`, input);
    return res.result!;
  }

  /** Open or pause a country and set its fee. */
  async updateCountry(storeId: string, iso: string, changes: IUpdateShippingCountryInput): Promise<{ zone: IShippingZone }> {
    const res = await this.http.put<{ zone: IShippingZone }>(`${this.base}/${storeId}/countries/${iso}`, changes);
    return res.result!;
  }

  /** Soft-delete a country and every route under it. */
  async deleteCountry(storeId: string, iso: string): Promise<{ countryIso: string }> {
    const res = await this.http.delete<{ countryIso: string }>(`${this.base}/${storeId}/countries/${iso}`);
    return res.result!;
  }

  // ─── Routes ─────────────────────────────────────────────────────────────

  /**
   * A country's governorates — catalogue reference data, not this store's rows.
   * An empty list means the catalogue does not divide this country.
   */
  async listGovernorates(storeId: string, iso: string): Promise<{ items: IShippingGovernorate[] }> {
    const res = await this.http.get<{ items: IShippingGovernorate[] }>(`${this.base}/${storeId}/countries/${iso}/governorates`);
    return res.result!;
  }

  /**
   * Every governorate of a country, or every city of one governorate, each with
   * what it charges today and whether that price is its own (`fee`) or
   * inherited (`inheritedFrom`).
   */
  async listRoutes(storeId: string, iso: string, filters: IShippingRouteFilters = {}): Promise<IShippingRoutesResult> {
    const res = await this.http.get<IShippingRoutesResult>(`${this.base}/${storeId}/countries/${iso}/routes`, {
      params: this.toQuery(filters),
    });
    return res.result!;
  }

  /**
   * Price or block one governorate or city. A route that ends up saying nothing
   * — no fee AND delivery allowed — is removed rather than stored, so `rate`
   * comes back `null` with `cleared: true`.
   */
  async upsertRoute(storeId: string, iso: string, input: IUpsertShippingRouteInput): Promise<IUpsertShippingRouteResult> {
    const res = await this.http.post<IUpsertShippingRouteResult>(`${this.base}/${storeId}/countries/${iso}/routes`, input);
    return res.result!;
  }

  /**
   * Price or block up to 200 places in one call. Each row is applied and
   * reported independently, so one bad row never discards the rest.
   */
  async bulkUpsertRoutes(storeId: string, iso: string, items: IUpsertShippingRouteInput[]): Promise<IBulkShippingRouteResult> {
    const res = await this.http.post<IBulkShippingRouteResult>(`${this.base}/${storeId}/countries/${iso}/routes/bulk`, { items });
    return res.result!;
  }

  /**
   * Give every governorate of a country — or every city of one governorate —
   * the same fee. A fee equal to what those places already inherit clears their
   * rows instead of writing them: uniformity is what was asked for, and the
   * model expresses it by having no rows.
   */
  async applyFee(storeId: string, iso: string, input: IApplyShippingFeeInput): Promise<IApplyShippingFeeResult> {
    const res = await this.http.post<IApplyShippingFeeResult>(`${this.base}/${storeId}/countries/${iso}/routes/apply-fee`, input);
    return res.result!;
  }

  /** Remove one override, putting the place back on whatever it inherits. */
  async clearRoute(storeId: string, rateId: string): Promise<{ _id: string }> {
    const res = await this.http.delete<{ _id: string }>(`${this.base}/${storeId}/routes/${rateId}`);
    return res.result!;
  }

  // ─── Preview ────────────────────────────────────────────────────────────

  /**
   * What a destination would be charged, resolved through the same city →
   * governorate → country → store-default fallback checkout uses. Use it to
   * show a fee before creating an order — a manual order never sends its own.
   */
  async previewFee(storeId: string, params: IShippingFeePreviewParams): Promise<IShippingFeePreview> {
    const res = await this.http.get<IShippingFeePreview>(`${this.base}/${storeId}/preview-fee`, { params: this.toQuery(params) });
    return res.result!;
  }

  // ─── Package profiles (task12) ──────────────────────────────────────────
  //
  // A profile prices by the size of the parcel rather than by where it is
  // going, and answers BEFORE the flat chain above. Where no bracket matches,
  // the flat chain still answers — so profiles add to a store's setup rather
  // than replacing it.

  /** The store's package profiles. */
  async listProfiles(storeId: string, filters: IShippingProfileFilters = {}): Promise<IPaginated<IShippingProfile>> {
    const res = await this.http.get<IPaginated<IShippingProfile>>(`${this.base}/${storeId}/profiles`, {
      params: this.toQuery(filters),
    });
    return res.result!;
  }

  /** One profile with its brackets. */
  async getProfile(storeId: string, profileId: string): Promise<IShippingProfile> {
    const res = await this.http.get<IShippingProfile>(`${this.base}/${storeId}/profiles/${profileId}`);
    return res.result!;
  }

  /**
   * Create a profile. A profile with no brackets is a legal first state — the
   * name and type are saved before the brackets are known.
   */
  async createProfile(storeId: string, input: ICreateShippingProfileInput): Promise<IShippingProfile> {
    const res = await this.http.post<IShippingProfile>(`${this.base}/${storeId}/profiles`, input);
    return res.result!;
  }

  /** Rename, re-describe, or replace the bracket list. `type` cannot change. */
  async updateProfile(storeId: string, profileId: string, changes: IUpdateShippingProfileInput): Promise<IShippingProfile> {
    const res = await this.http.put<IShippingProfile>(`${this.base}/${storeId}/profiles/${profileId}`, changes);
    return res.result!;
  }

  /**
   * Delete a profile. Refused while any place still assigns it — the fees a
   * merchant typed against its brackets would go with it.
   */
  async deleteProfile(storeId: string, profileId: string): Promise<{ _id: string }> {
    const res = await this.http.delete<{ _id: string }>(`${this.base}/${storeId}/profiles/${profileId}`);
    return res.result!;
  }

  /**
   * Append brackets, leaving the existing ones alone.
   *
   * A bracket added here shows up on every assignment immediately, unpriced —
   * the profile owns the bracket list, an assignment only prices it.
   */
  async addProfileConditions(storeId: string, profileId: string, conditions: IShippingProfileCondition[]): Promise<IShippingProfile> {
    const res = await this.http.post<IShippingProfile>(`${this.base}/${storeId}/profiles/${profileId}/conditions`, { conditions });
    return res.result!;
  }

  /** Remove one bracket, and with it the fees pointing at it. */
  async removeProfileCondition(storeId: string, profileId: string, conditionKey: string): Promise<IShippingProfile> {
    const res = await this.http.delete<IShippingProfile>(
      `${this.base}/${storeId}/profiles/${profileId}/conditions/${encodeURIComponent(conditionKey)}`,
    );
    return res.result!;
  }

  /**
   * The spreadsheet a merchant fills brackets into.
   *
   * The columns differ by type — a weight profile gets two, a dimension profile
   * five — so pass the type you are importing into. A weight store handed three
   * columns it must leave empty cannot tell "no limit" from "I forgot".
   */
  async downloadProfileTemplate(storeId: string, type: ShippingProfileType = "weight"): Promise<IBinaryResponse> {
    return this.http.getBinary(`${this.base}/${storeId}/profiles/template`, { params: { type } });
  }

  /** Bulk brackets from a filled-in template, base64-encoded in the body. */
  async importProfileConditions(storeId: string, profileId: string, file: IExcelUploadInput): Promise<IBulkImportReport> {
    const res = await this.http.post<IBulkImportReport>(`${this.base}/${storeId}/profiles/${profileId}/conditions/import`, {
      file: file.fileBase64,
    });
    return res.result!;
  }

  // ─── Profile assignments ────────────────────────────────────────────────

  /**
   * The profiles that apply at one place, and which tier they came from.
   *
   * Walks upward, so an unpriced city reports what it is currently inheriting
   * rather than an empty list. Read `isInherited` before showing the rows as
   * the place's own.
   */
  async listAssignments(storeId: string, iso: string, place: IShippingAssignmentPlace): Promise<IShippingAssignmentsView> {
    const res = await this.http.get<IShippingAssignmentsView>(`${this.base}/${storeId}/countries/${iso}/assignments`, {
      params: this.toQuery(place),
    });
    return res.result!;
  }

  /**
   * Assign a profile to a place, or re-price one already there.
   *
   * The moment a place has one of these, it stops inheriting from above
   * entirely — including for parcels none of its own brackets fit. That is the
   * rule the whole feature turns on: a merchant who prices a city separately
   * means "this is what this city costs", not "add these to what the country
   * already said".
   */
  async assignProfile(storeId: string, iso: string, input: IAssignShippingProfileInput): Promise<IShippingAssignment> {
    const res = await this.http.post<IShippingAssignment>(`${this.base}/${storeId}/countries/${iso}/assignments`, input);
    return res.result!;
  }

  /**
   * Make one assignment the place's default.
   *
   * Where a place offers alternatives ("by weight" or "by size"), the default
   * is quoted even when the other is cheaper — the merchant named it, which is
   * a decision rather than a tie-break. Without one, the cheaper match wins.
   */
  async setDefaultAssignment(storeId: string, assignmentId: string): Promise<IShippingAssignment> {
    const res = await this.http.put<IShippingAssignment>(`${this.base}/${storeId}/assignments/${assignmentId}/default`, {});
    return res.result!;
  }

  /** Remove an assignment, putting the place back on whatever it inherits. */
  async removeAssignment(storeId: string, assignmentId: string): Promise<{ _id: string }> {
    const res = await this.http.delete<{ _id: string }>(`${this.base}/${storeId}/assignments/${assignmentId}`);
    return res.result!;
  }
}
