import { ToolInputError } from "../../posty5-mcp/src/core/tool-input.error";
import { STORE_SHIPPING_TOOLS } from "../../posty5-mcp/src/toolsets/store-shipping.tools";
import { findTool, previewTool, route, runTool } from "./mcp-test.helper";

/**
 * `@posty5/mcp` — the `store-shipping` toolset. Offline: each tool runs over a
 * stub HttpClient and the request it makes is pinned (route, query, body).
 * Confirm tools are also previewed, which may only read.
 */

const base = "/api/store-shipping/s1";

const COUNTRY = { iso: "eg", name: "Egypt", isEnabled: true, defaultFee: 50, routesCount: 4, blockedRoutesCount: 1 };
// The API's shape since 2026-09-25: one size per profile, priced per place.
const PROFILE = {
  _id: "p1",
  name: "Small parcels",
  type: "weight",
  condition: { key: "up to 1kg", label: "Up to 1 kg", maxWeight: 1 },
  conditions: [{ key: "up to 1kg", label: "Up to 1 kg", maxWeight: 1 }],
  pricing: { countries: [{ countryIso: "eg", countryName: "Egypt", fee: 40 }], overridesCount: 2 },
  assignmentsCount: 3,
};

const onlyReads = (calls: { method: string }[]) => calls.every((call) => call.method === "GET");

describe("mcp — store-shipping toolset", () => {
  it("has the catalogue's 23 tools, in order, with their access and confirm rule", () => {
    expect(STORE_SHIPPING_TOOLS.map((tool) => [tool.name, tool.access, !!tool.confirm])).toEqual([
      ["store_shipping_list_countries", "read", false],
      ["store_shipping_list_country_catalogue", "read", false],
      ["store_shipping_get_country", "read", false],
      ["store_shipping_list_governorates", "read", false],
      ["store_shipping_list_routes", "read", false],
      ["store_shipping_preview_fee", "read", false],
      ["store_shipping_list_profiles", "read", false],
      ["store_shipping_get_profile", "read", false],
      ["store_shipping_get_place_prices", "read", false],
      ["store_shipping_list_parcel_prices", "read", false],
      ["store_shipping_add_country", "write", false],
      ["store_shipping_update_country", "write", false],
      ["store_shipping_upsert_route", "write", false],
      ["store_shipping_bulk_upsert_routes", "write", false],
      ["store_shipping_apply_fee", "write", false],
      ["store_shipping_create_profile", "write", false],
      ["store_shipping_update_profile", "write", false],
      ["store_shipping_save_place_prices", "write", false],
      ["store_shipping_update_parcel_price", "write", false],
      ["store_shipping_delete_country", "full", true],
      ["store_shipping_clear_route", "full", true],
      ["store_shipping_delete_profile", "full", true],
      ["store_shipping_remove_parcel_price", "full", true],
    ]);
    expect(STORE_SHIPPING_TOOLS.every((tool) => tool.toolset === "store-shipping")).toBe(true);
    expect(STORE_SHIPPING_TOOLS.every((tool) => Object.keys(tool.input.shape)[0] === "storeId")).toBe(true);
  });

  it("store_shipping_list_countries", async () => {
    const { calls } = await runTool("store_shipping_list_countries", { storeId: "s1", text: "eg", isEnabled: true, cursor: "c1", pageSize: 5 });
    expect(route(calls[0])).toBe(`GET ${base}/countries`);
    expect(calls[0].params).toEqual({ text: "eg", isEnabled: "true", cursor: "c1", pageSize: 5 });
  });

  it("store_shipping_list_country_catalogue", async () => {
    const { calls } = await runTool("store_shipping_list_country_catalogue", { storeId: "s1", text: "fr", includeAdded: false, page: 2, pageSize: 10 });
    expect(route(calls[0])).toBe(`GET ${base}/countries/catalogue`);
    expect(calls[0].params).toEqual({ text: "fr", includeAdded: "false", page: 2, pageSize: 10 });
  });

  it("store_shipping_get_country", async () => {
    const { calls } = await runTool("store_shipping_get_country", { storeId: "s1", iso: "eg" });
    expect(route(calls[0])).toBe(`GET ${base}/countries/eg`);
  });

  it("store_shipping_list_governorates", async () => {
    const { calls } = await runTool("store_shipping_list_governorates", { storeId: "s1", iso: "eg" });
    expect(route(calls[0])).toBe(`GET ${base}/countries/eg/governorates`);
  });

  it("store_shipping_list_routes", async () => {
    const { calls } = await runTool("store_shipping_list_routes", {
      storeId: "s1",
      iso: "eg",
      level: "city",
      governorateCode: "C",
      hasFee: true,
      sortField: "fee",
      sortType: "desc",
      page: 1,
    });
    expect(route(calls[0])).toBe(`GET ${base}/countries/eg/routes`);
    expect(calls[0].params).toEqual({ level: "city", governorateCode: "C", hasFee: "true", sortField: "fee", sortType: "desc", page: 1 });
  });

  it("store_shipping_preview_fee", async () => {
    const { calls } = await runTool("store_shipping_preview_fee", { storeId: "s1", countryIso: "eg", governorateCode: "C", cityKey: "nasr city" });
    expect(route(calls[0])).toBe(`GET ${base}/preview-fee`);
    expect(calls[0].params).toEqual({ countryIso: "eg", governorateCode: "C", cityKey: "nasr city" });
  });

  it("store_shipping_list_profiles", async () => {
    const { calls } = await runTool("store_shipping_list_profiles", { storeId: "s1", type: "weight", pageSize: 20 });
    expect(route(calls[0])).toBe(`GET ${base}/profiles`);
    expect(calls[0].params).toEqual({ type: "weight", pageSize: 20 });
  });

  it("store_shipping_get_profile", async () => {
    const { calls } = await runTool("store_shipping_get_profile", { storeId: "s1", profileId: "p1" });
    expect(route(calls[0])).toBe(`GET ${base}/profiles/p1`);
  });

  it("store_shipping_get_place_prices — and refuses a city without its codes", async () => {
    const { calls } = await runTool("store_shipping_get_place_prices", { storeId: "s1", iso: "eg", level: "city", governorateCode: "C", cityKey: "k" });
    expect(route(calls[0])).toBe(`GET ${base}/countries/eg/parcel-prices`);
    expect(calls[0].params).toEqual({ level: "city", governorateCode: "C", cityKey: "k" });
    await expect(runTool("store_shipping_get_place_prices", { storeId: "s1", iso: "eg", level: "city", governorateCode: "C" })).rejects.toThrow(ToolInputError);
    await expect(runTool("store_shipping_get_place_prices", { storeId: "s1", iso: "eg", level: "governorate" })).rejects.toThrow(ToolInputError);
  });

  it("store_shipping_list_parcel_prices", async () => {
    const { calls } = await runTool("store_shipping_list_parcel_prices", { storeId: "s1", countryIso: "eg", profileId: "p1", pageSize: 20 });
    expect(route(calls[0])).toBe(`GET ${base}/parcel-prices`);
    expect(calls[0].params).toEqual({ countryIso: "eg", profileId: "p1", pageSize: 20 });
  });

  it("store_shipping_add_country", async () => {
    const { calls } = await runTool("store_shipping_add_country", { storeId: "s1", iso: "eg", defaultFee: 50 });
    expect(route(calls[0])).toBe(`POST ${base}/countries`);
    expect(calls[0].body).toEqual({ iso: "eg", defaultFee: 50 });
    expect(findTool("store_shipping_add_country").entity!({ zone: { countryIso: "eg" } }, { storeId: "s1", iso: "eg", defaultFee: 50 })).toEqual({
      entityType: "shippingCountry",
      entityId: "eg",
    });
  });

  it("store_shipping_update_country — and refuses a call that changes nothing", async () => {
    const { calls } = await runTool("store_shipping_update_country", { version: 1, storeId: "s1", iso: "eg", isEnabled: false, defaultFee: null });
    expect(route(calls[0])).toBe(`PUT ${base}/countries/eg`);
    expect(calls[0].body).toEqual({ isEnabled: false, defaultFee: null });
    await expect(runTool("store_shipping_update_country", { version: 1, storeId: "s1", iso: "eg" })).rejects.toThrow(ToolInputError);
  });

  it("store_shipping_upsert_route — and refuses a city without cityKey or a route saying nothing", async () => {
    const { calls } = await runTool("store_shipping_upsert_route", { version: 1, storeId: "s1", iso: "eg", level: "city", governorateCode: "C", cityKey: "k", fee: 30 });
    expect(route(calls[0])).toBe(`POST ${base}/countries/eg/routes`);
    expect(calls[0].body).toEqual({ level: "city", governorateCode: "C", cityKey: "k", fee: 30 });
    await expect(runTool("store_shipping_upsert_route", { version: 1, storeId: "s1", iso: "eg", level: "city", governorateCode: "C", fee: 30 })).rejects.toThrow(ToolInputError);
    await expect(runTool("store_shipping_upsert_route", { version: 1, storeId: "s1", iso: "eg", level: "governorate", governorateCode: "C" })).rejects.toThrow(ToolInputError);
  });

  it("store_shipping_bulk_upsert_routes", async () => {
    const items = [
      { level: "governorate", governorateCode: "C", fee: 20 },
      { level: "city", governorateCode: "C", cityKey: "k", isAllowed: false },
    ];
    const { calls } = await runTool("store_shipping_bulk_upsert_routes", { storeId: "s1", iso: "eg", items });
    expect(route(calls[0])).toBe(`POST ${base}/countries/eg/routes/bulk`);
    expect(calls[0].body).toEqual({ items });
  });

  it("store_shipping_apply_fee", async () => {
    const { calls } = await runTool("store_shipping_apply_fee", { storeId: "s1", iso: "eg", level: "governorate", fee: null });
    expect(route(calls[0])).toBe(`POST ${base}/countries/eg/routes/apply-fee`);
    expect(calls[0].body).toEqual({ level: "governorate", fee: null });
  });

  // The API takes exactly one size per profile (`conditions: Joi.array().length(1)`).
  it("store_shipping_create_profile — sends the one size as a one-item conditions list", async () => {
    const args = { storeId: "s1", name: "Small parcels", type: "weight", condition: { maxWeight: 1 } };
    const { calls } = await runTool("store_shipping_create_profile", args);
    expect(route(calls[0])).toBe(`POST ${base}/profiles`);
    expect(calls[0].body).toEqual({ name: "Small parcels", type: "weight", conditions: [{ maxWeight: 1 }] });
    expect(findTool("store_shipping_create_profile").entity!({ _id: "p1" }, args)).toEqual({ entityType: "shippingProfile", entityId: "p1" });
  });

  it("store_shipping_update_profile — and refuses a call that changes nothing", async () => {
    const { calls } = await runTool("store_shipping_update_profile", { version: 1, storeId: "s1", profileId: "p1", name: "Big parcels" });
    expect(route(calls[0])).toBe(`PUT ${base}/profiles/p1`);
    expect(calls[0].body).toEqual({ name: "Big parcels" });

    const resized = await runTool("store_shipping_update_profile", { version: 1, storeId: "s1", profileId: "p1", condition: { key: "up to 1kg", maxWeight: 2 } });
    expect(resized.calls[0].body).toEqual({ conditions: [{ key: "up to 1kg", maxWeight: 2 }] });
    await expect(runTool("store_shipping_update_profile", { version: 1, storeId: "s1", profileId: "p1" })).rejects.toThrow(ToolInputError);
  });

  it("store_shipping_save_place_prices — and refuses a governorate without its code", async () => {
    const input = { level: "governorate", governorateCode: "C", prices: [{ profileId: "p1", fee: 20 }, { profileId: "p2", fee: null }] };
    const { calls } = await runTool("store_shipping_save_place_prices", { countryVersion: 1, storeId: "s1", iso: "eg", ...input });
    expect(route(calls[0])).toBe(`PUT ${base}/countries/eg/parcel-prices`);
    expect(calls[0].body).toEqual(input);
    expect(findTool("store_shipping_save_place_prices").entity!({ saved: 1, cleared: 1 }, {})).toEqual({ entityType: "shippingParcelPrice", count: 2 });
    await expect(runTool("store_shipping_save_place_prices", { countryVersion: 1, storeId: "s1", iso: "eg", level: "governorate", prices: [{ profileId: "p1", fee: 5 }] })).rejects.toThrow(ToolInputError);
  });

  it("store_shipping_update_parcel_price", async () => {
    const { calls, value } = await runTool("store_shipping_update_parcel_price", { version: 1, storeId: "s1", priceId: "pr1", fee: 35 });
    expect(route(calls[0])).toBe(`PUT ${base}/parcel-prices/pr1`);
    expect(calls[0].body).toEqual({ fee: 35 });
    expect(value).toEqual({ updated: true, priceId: "pr1", fee: 35 });
  });

  it("store_shipping_delete_country — preview reads the country", async () => {
    const { calls } = await runTool("store_shipping_delete_country", { version: 1, storeId: "s1", iso: "eg" });
    expect(route(calls[0])).toBe(`DELETE ${base}/countries/eg`);

    const preview = await previewTool("store_shipping_delete_country", { version: 1, storeId: "s1", iso: "eg" }, { country: COUNTRY });
    expect(preview.calls.map(route)).toEqual([`GET ${base}/countries/eg`]);
    expect(onlyReads(preview.calls)).toBe(true);
    expect(preview.text).toContain("Egypt");
  });

  it("store_shipping_clear_route — preview makes no request", async () => {
    const { calls } = await runTool("store_shipping_clear_route", { version: 1, storeId: "s1", rateId: "r1" });
    expect(route(calls[0])).toBe(`DELETE ${base}/routes/r1`);

    const preview = await previewTool("store_shipping_clear_route", { version: 1, storeId: "s1", rateId: "r1" });
    expect(preview.calls).toEqual([]);
    expect(preview.text).toContain("r1");
  });

  it("store_shipping_delete_profile — preview reads the profile", async () => {
    const { calls } = await runTool("store_shipping_delete_profile", { version: 1, storeId: "s1", profileId: "p1" });
    expect(route(calls[0])).toBe(`DELETE ${base}/profiles/p1`);

    const preview = await previewTool("store_shipping_delete_profile", { version: 1, storeId: "s1", profileId: "p1" }, PROFILE);
    expect(preview.calls.map(route)).toEqual([`GET ${base}/profiles/p1`]);
    expect(onlyReads(preview.calls)).toBe(true);
    expect(preview.text).toContain("Small parcels");
    expect(preview.text).toContain("3 parcel price(s)");
  });

  it("store_shipping_remove_parcel_price — preview makes no request", async () => {
    const { calls, value } = await runTool("store_shipping_remove_parcel_price", { version: 1, storeId: "s1", priceId: "pr1" });
    expect(route(calls[0])).toBe(`DELETE ${base}/parcel-prices/pr1`);
    expect(value).toEqual({ removed: true, priceId: "pr1" });

    const preview = await previewTool("store_shipping_remove_parcel_price", { version: 1, storeId: "s1", priceId: "pr1" });
    expect(preview.calls).toEqual([]);
    expect(preview.text).toContain("pr1");
  });
});
