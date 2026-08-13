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
}
