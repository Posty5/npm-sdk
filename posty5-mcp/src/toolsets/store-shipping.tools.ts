import { z } from "zod";
import { SHIPPING_PROFILE_TYPES, SHIPPING_ROUTE_LEVELS, SHIPPING_ROUTE_SORT_FIELDS, SHIPPING_SORT_TYPES } from "../config/store-shipping-enums.config";
import { SHIPPING_BULK_ROUTES_MAX_ITEMS, SHIPPING_PLACE_PRICES_MAX_ITEMS } from "../config/store-shipping-limits.config";
import { cursorFields, defineTool, idField, pageFields, requireAtLeastOne, versionField } from "../core/define-tool.helper";
import {
  checkPlace,
  checkRoutePlace,
  countryIsoField,
  nullableFeeField,
  placeFields,
  placePriceSchema,
  profileConditionSchema,
  routeFields,
  routeRowSchema,
} from "../core/store-shipping.helper";
import type { IToolDefinition } from "../interfaces/tool.interface";

const STORE_ID = "The store's _id, from store_list.";
const COUNTRY_ISO = "Two-letter ISO code of a country the store delivers to, from store_shipping_list_countries.";
const PROFILE_ID = "The package profile's _id, from store_shipping_list_profiles.";
const PRICE_ID = "The parcel price's priceId, from store_shipping_get_place_prices (items[].priceId) or store_shipping_list_parcel_prices.";
const PROFILE_MODEL =
  "A package profile is one parcel size (up to a weight, or up to length × width × height) with a price per place: the country's price is the base, and a governorate or city may set its own for that size. At checkout a parcel pays the price of the smallest size it fits that is priced on its path (city, then governorate, then country); when none is, the flat route fees apply.";

export const STORE_SHIPPING_TOOLS: IToolDefinition[] = [
  defineTool({
    name: "store_shipping_list_countries",
    toolset: "store-shipping",
    access: "read",
    title: "List shipping countries",
    description:
      "The countries a store delivers to: each one's own fee (null = the store default applies), whether it is open for orders, and how many governorate and city overrides it has. Filter by name or ISO code, or by open/paused. Pages with cursor.",
    input: z.object({
      storeId: idField(STORE_ID),
      text: z.string().optional().describe("Part of a country name or ISO code."),
      isEnabled: z.boolean().optional().describe("true: only countries open for orders; false: only paused ones."),
      ...cursorFields(),
    }),
    run: ({ storeId, ...filters }, { clients }) => clients.store.shipping.listCountries(storeId, filters),
  }),
  defineTool({
    name: "store_shipping_list_country_catalogue",
    toolset: "store-shipping",
    access: "read",
    title: "List countries to add",
    description:
      "The world's countries the store has not opened yet, with their ISO codes — where store_shipping_add_country's iso comes from. includeAdded: true lists every country. Also returns the store's currency.",
    input: z.object({
      storeId: idField(STORE_ID),
      text: z.string().optional().describe("Part of a country name or ISO code."),
      includeAdded: z.boolean().optional().describe("Also list the countries the store already delivers to."),
      ...pageFields(),
    }),
    run: ({ storeId, ...filters }, { clients }) => clients.store.shipping.listCountryCatalogue(storeId, filters),
  }),
  defineTool({
    name: "store_shipping_get_country",
    toolset: "store-shipping",
    access: "read",
    title: "Get a shipping country",
    description:
      "One delivery country: its own fee, whether it is open, its override counts, plus the store default fee below it, the store's fee calculation mode and currency.",
    input: z.object({
      storeId: idField(STORE_ID),
      iso: countryIsoField(COUNTRY_ISO),
    }),
    run: ({ storeId, iso }, { clients }) => clients.store.shipping.getCountry(storeId, iso),
  }),
  defineTool({
    name: "store_shipping_list_governorates",
    toolset: "store-shipping",
    access: "read",
    title: "List a country's governorates",
    description:
      "A country's governorates (states, provinces) from the reference catalogue, with the code every route and assignment uses. Reference data, not the store's settings — store_shipping_list_routes shows what each one charges. An empty list means the catalogue does not divide this country.",
    input: z.object({
      storeId: idField(STORE_ID),
      iso: countryIsoField(COUNTRY_ISO),
    }),
    run: ({ storeId, iso }, { clients }) => clients.store.shipping.listGovernorates(storeId, iso),
  }),
  defineTool({
    name: "store_shipping_list_routes",
    toolset: "store-shipping",
    access: "read",
    title: "List shipping routes",
    description:
      'Every governorate of a country (level "governorate", the default), or every city of one governorate (level "city" with governorateCode), each with what it charges today, whether that fee is its own or inherited (inheritedFrom), and whether delivery is allowed. A place with its own override carries a rateId (for store_shipping_clear_route); city rows carry the cityKey other tools take. Also returns the country fee and store default above them.',
    input: z.object({
      storeId: idField(STORE_ID),
      iso: countryIsoField(COUNTRY_ISO),
      level: z.enum(SHIPPING_ROUTE_LEVELS).optional().describe('Which tier to list. Default "governorate".'),
      governorateCode: z.string().optional().describe("With level city: the governorate whose cities to list, from store_shipping_list_governorates."),
      text: z.string().optional().describe("Part of a place name."),
      hasFee: z.boolean().optional().describe("true: only places with their own fee; false: only places that inherit."),
      isAllowed: z.boolean().optional().describe("true: only places delivered to; false: only blocked ones."),
      sortField: z.enum(SHIPPING_ROUTE_SORT_FIELDS).optional(),
      sortType: z.enum(SHIPPING_SORT_TYPES).optional(),
      ...pageFields(),
    }),
    run: ({ storeId, iso, ...filters }, { clients }) => clients.store.shipping.listRoutes(storeId, iso, filters),
  }),
  defineTool({
    name: "store_shipping_preview_fee",
    toolset: "store-shipping",
    access: "read",
    title: "Preview a shipping fee",
    description:
      "What a destination would be charged for delivery and whether the store delivers there, resolved the way checkout does: city, then governorate, then country, then the store default. Use it to tell a shopper the fee before store_order_create — a manual order never sends its own fee.",
    input: z.object({
      storeId: idField(STORE_ID),
      countryIso: countryIsoField("Two-letter ISO country code of the destination."),
      governorateCode: z.string().optional().describe("The destination governorate's code, from store_shipping_list_governorates; omit to price the country only."),
      cityKey: z.string().optional().describe('The destination city\'s key, from store_shipping_list_routes with level "city"; omit to price the governorate only.'),
    }),
    run: ({ storeId, ...params }, { clients }) => clients.store.shipping.previewFee(storeId, params),
  }),
  defineTool({
    name: "store_shipping_list_profiles",
    toolset: "store-shipping",
    access: "read",
    title: "List package profiles",
    description: `The store's package profiles, each with its size (condition) and where it is priced (pricing). ${PROFILE_MODEL} Pages with cursor.`,
    input: z.object({
      storeId: idField(STORE_ID),
      text: z.string().optional().describe("Part of a profile name."),
      type: z.enum(SHIPPING_PROFILE_TYPES).optional(),
      ...cursorFields(),
    }),
    run: ({ storeId, ...filters }, { clients }) => clients.store.shipping.listProfiles(storeId, filters),
  }),
  defineTool({
    name: "store_shipping_get_profile",
    toolset: "store-shipping",
    access: "read",
    title: "Get a package profile",
    description: "One package profile: its size (condition, with the key its prices point at), its base price per country and how many governorate or city prices it has.",
    input: z.object({
      storeId: idField(STORE_ID),
      profileId: idField(PROFILE_ID),
    }),
    run: ({ storeId, profileId }, { clients }) => clients.store.shipping.getProfile(storeId, profileId),
  }),
  defineTool({
    name: "store_shipping_get_place_prices",
    toolset: "store-shipping",
    access: "read",
    title: "Get a place's parcel prices",
    description:
      "The parcel-price table of one place (a country, a governorate or a city): every package profile, smallest first, with this place's own price (fee, null when it has none, and its priceId), the price it inherits from the place above (inherited), and what a parcel of that size is charged here in the end (effective). Also the store currency.",
    input: z.object({
      storeId: idField(STORE_ID),
      iso: countryIsoField(COUNTRY_ISO),
      ...placeFields(),
    }),
    run: async ({ storeId, iso, ...place }, { clients }) => {
      checkPlace(place);
      return clients.store.shipping.getPlacePrices(storeId, iso, place);
    },
  }),
  defineTool({
    name: "store_shipping_list_parcel_prices",
    toolset: "store-shipping",
    access: "read",
    title: "List parcel prices",
    description: "Every parcel price the store has set, across countries, governorates and cities, smallest size first: the profile, the place and the fee, with its priceId. Filter by country or profile. Pages with cursor.",
    input: z.object({
      storeId: idField(STORE_ID),
      countryIso: countryIsoField(COUNTRY_ISO).optional(),
      profileId: idField(PROFILE_ID).optional(),
      ...cursorFields(),
    }),
    run: ({ storeId, ...filters }, { clients }) => clients.store.shipping.listParcelPrices(storeId, filters),
  }),
  defineTool({
    name: "store_shipping_add_country",
    toolset: "store-shipping",
    access: "write",
    title: "Add a shipping country",
    description:
      "Opens a country for delivery at a fee. Every governorate and city inside it inherits that fee until one is priced separately (store_shipping_upsert_route). Get iso from store_shipping_list_country_catalogue; a country already added is refused. Checkout offers it at once.",
    input: z.object({
      storeId: idField(STORE_ID),
      iso: countryIsoField("Two-letter ISO country code, from store_shipping_list_country_catalogue."),
      defaultFee: z.number().min(0).describe("The country's delivery fee, in the store currency. 0 is free delivery."),
    }),
    run: ({ storeId, ...input }, { clients }) => clients.store.shipping.addCountry(storeId, input),
    entity: (result, args) => ({ entityType: "shippingCountry", entityId: result?.zone?.countryIso ?? args.iso }),
  }),
  defineTool({
    name: "store_shipping_update_country",
    toolset: "store-shipping",
    access: "write",
    title: "Update a shipping country",
    description:
      "Opens or pauses a delivery country, changes its fee, or moves it in the list. Fields left out keep their value. A paused country is not offered at checkout; its routes are kept.",
    input: z.object({
      storeId: idField(STORE_ID),
      iso: countryIsoField(COUNTRY_ISO),
      version: versionField("the shipping country"),
      isEnabled: z.boolean().optional().describe("false pauses delivery to the country; true opens it again."),
      defaultFee: nullableFeeField("The country's fee. null removes it, so the store default applies; 0 is free delivery.").optional(),
      order: z.number().int().min(0).optional().describe("Position in the store's country list."),
    }),
    annotations: { idempotent: true },
    run: async ({ storeId, iso, version, ...changes }, { clients }) => {
      requireAtLeastOne(changes, ["isEnabled", "defaultFee", "order"], "store_shipping_update_country");
      return clients.store.shipping.updateCountry(storeId, iso, changes, version);
    },
    entity: (_result, args) => ({ entityType: "shippingCountry", entityId: args.iso }),
  }),
  defineTool({
    name: "store_shipping_upsert_route",
    toolset: "store-shipping",
    access: "write",
    title: "Price or block a place",
    description:
      'Sets one governorate\'s or one city\'s own fee, or blocks or allows delivery there. Give fee, isAllowed or both. A place left with no fee and delivery allowed has nothing of its own, so its override is removed (rate: null, cleared: true) and it inherits again. A city needs its governorateCode and cityKey (from store_shipping_list_routes with level "city").',
    input: z.object({
      storeId: idField(STORE_ID),
      iso: countryIsoField(COUNTRY_ISO),
      ...routeFields(),
      version: z
        .number()
        .int()
        .min(0)
        .describe("The __v of the place's existing override, from store_shipping_list_routes; 0 when the place has no override of its own yet. If it changed since, nothing is saved and you are told to re-read it."),
    }),
    annotations: { idempotent: true },
    run: async ({ storeId, iso, version, ...input }, { clients }) => {
      checkRoutePlace(input, 'level "city"');
      requireAtLeastOne(input, ["fee", "isAllowed"], "store_shipping_upsert_route");
      return clients.store.shipping.upsertRoute(storeId, iso, input, version);
    },
    entity: (result) => ({ entityType: "shippingRoute", entityId: result?.rate?._id }),
  }),
  defineTool({
    name: "store_shipping_bulk_upsert_routes",
    toolset: "store-shipping",
    access: "write",
    title: "Price or block many places",
    description: `Sets the fee or delivery block of up to ${SHIPPING_BULK_ROUTES_MAX_ITEMS} governorates and cities of one country in one call, each row as store_shipping_upsert_route would. Rows are applied and reported one by one (saved / failed), so one bad row never discards the rest.`,
    input: z.object({
      storeId: idField(STORE_ID),
      iso: countryIsoField(COUNTRY_ISO),
      items: z.array(routeRowSchema()).min(1).max(SHIPPING_BULK_ROUTES_MAX_ITEMS).describe("The places to price or block."),
    }),
    annotations: { idempotent: true },
    run: async ({ storeId, iso, items }, { clients }) => {
      items.forEach((item, index) => checkRoutePlace(item, `items[${index}] (level "city")`));
      return clients.store.shipping.bulkUpsertRoutes(storeId, iso, items);
    },
    entity: (result) => ({ entityType: "shippingRoute", count: result?.saved?.length ?? 0 }),
  }),
  defineTool({
    name: "store_shipping_apply_fee",
    toolset: "store-shipping",
    access: "write",
    title: "Apply one fee to a scope",
    description:
      'Gives every governorate of a country (level "governorate"), or every city of one governorate (level "city" with governorateCode), the same fee — replacing each place\'s own fee in that scope. A fee equal to what the scope already inherits clears their overrides instead (reported as cleared), which is how "make it uniform" is stored.',
    input: z.object({
      storeId: idField(STORE_ID),
      iso: countryIsoField(COUNTRY_ISO),
      level: z.enum(SHIPPING_ROUTE_LEVELS).describe('"governorate" or "city".'),
      governorateCode: z.string().optional().describe("Narrows the scope to one governorate, from store_shipping_list_governorates; omit to re-price the whole country."),
      fee: nullableFeeField("The fee every place in the scope gets. null removes their own fees, so they inherit; 0 is free delivery."),
      isAllowed: z.boolean().optional().describe("Also block (false) or allow (true) delivery to every place in the scope."),
    }),
    annotations: { idempotent: true },
    run: ({ storeId, iso, ...input }, { clients }) => clients.store.shipping.applyFee(storeId, iso, input),
    entity: (result) => ({ entityType: "shippingRoute", count: (result?.written ?? 0) + (result?.cleared ?? 0) }),
  }),
  defineTool({
    name: "store_shipping_create_profile",
    toolset: "store-shipping",
    access: "write",
    title: "Create a package profile",
    description: `Creates a package profile — one parcel size. Several sizes are several profiles. type cannot change later. A profile charges nothing until it has a price: set prices with store_shipping_save_place_prices. ${PROFILE_MODEL}`,
    input: z.object({
      storeId: idField(STORE_ID),
      name: z.string().min(2).max(80).describe("Shown to the merchant, e.g. Small box."),
      type: z.enum(SHIPPING_PROFILE_TYPES).describe("weight: the size caps kg; dimension: the size caps length, width and height in cm. Cannot change later."),
      description: z.string().max(300).optional(),
      condition: profileConditionSchema().describe("The size: the limits a parcel must fit."),
    }),
    run: ({ storeId, condition, ...input }, { clients }) => clients.store.shipping.createProfile(storeId, { ...input, conditions: [condition] }),
    entity: (result) => ({ entityType: "shippingProfile", entityId: result?._id }),
  }),
  defineTool({
    name: "store_shipping_update_profile",
    toolset: "store-shipping",
    access: "write",
    title: "Update a package profile",
    description:
      "Renames or re-describes a package profile, or changes its size. Send the size back with its key (from store_shipping_get_profile) so the prices set for it stay attached. Changing a size changes what checkout matches against everywhere it is priced. type cannot change.",
    input: z.object({
      storeId: idField(STORE_ID),
      profileId: idField(PROFILE_ID),
      version: versionField("the package profile"),
      name: z.string().min(2).max(80).optional(),
      description: z.string().max(300).optional(),
      condition: profileConditionSchema().optional().describe("The new size, replacing the current one."),
    }),
    annotations: { idempotent: true },
    run: async ({ storeId, profileId, version, condition, ...changes }, { clients }) => {
      requireAtLeastOne({ ...changes, condition }, ["name", "description", "condition"], "store_shipping_update_profile");
      return clients.store.shipping.updateProfile(storeId, profileId, { ...changes, ...(condition ? { conditions: [condition] } : {}) }, version);
    },
    entity: (_result, args) => ({ entityType: "shippingProfile", entityId: args.profileId }),
  }),
  defineTool({
    name: "store_shipping_save_place_prices",
    toolset: "store-shipping",
    access: "write",
    title: "Set a place's parcel prices",
    description: `Sets the parcel prices of one place (a country, a governorate or a city) in one call: a fee per package profile. A null fee removes the place's own price for that size, so it falls back to the price above it. Profiles left out are untouched. Checkout uses the new prices at once. ${PROFILE_MODEL}`,
    input: z.object({
      storeId: idField(STORE_ID),
      iso: countryIsoField(COUNTRY_ISO),
      ...placeFields(),
      countryVersion: versionField("the shipping country (the prices are guarded by their country), from store_shipping_get_country"),
      prices: z.array(placePriceSchema()).min(1).max(SHIPPING_PLACE_PRICES_MAX_ITEMS).describe("One entry per profile to price or clear here."),
    }),
    annotations: { idempotent: true },
    run: async ({ storeId, iso, countryVersion, ...input }, { clients }) => {
      checkPlace(input);
      return clients.store.shipping.savePlacePrices(storeId, iso, input, countryVersion);
    },
    entity: (result) => ({ entityType: "shippingParcelPrice", count: (result?.saved ?? 0) + (result?.cleared ?? 0) }),
  }),
  defineTool({
    name: "store_shipping_update_parcel_price",
    toolset: "store-shipping",
    access: "write",
    title: "Change one parcel price",
    description: "Changes the fee of one parcel price the store already set. To remove a price use store_shipping_remove_parcel_price; to price a size at a place for the first time use store_shipping_save_place_prices.",
    input: z.object({
      storeId: idField(STORE_ID),
      priceId: idField(PRICE_ID),
      version: versionField("the parcel price"),
      fee: z.number().min(0).describe("The new fee; 0 is free delivery for this size here."),
    }),
    annotations: { idempotent: true },
    run: async ({ storeId, priceId, version, fee }, { clients }) => {
      const updated = await clients.store.shipping.updateParcelPrice(storeId, priceId, fee, version);
      return { updated: true, priceId, fee, __v: updated.__v };
    },
    entity: (_result, args) => ({ entityType: "shippingParcelPrice", entityId: args.priceId }),
  }),
  defineTool({
    name: "store_shipping_delete_country",
    toolset: "store-shipping",
    access: "full",
    title: "Delete a shipping country",
    description:
      "Stops delivering to a country and deletes every governorate and city override under it. Checkout no longer offers it. Adding it again starts over from a single country fee. To stop orders for a while without losing the overrides, use store_shipping_update_country with isEnabled false instead.",
    input: z.object({
      storeId: idField(STORE_ID),
      iso: countryIsoField(COUNTRY_ISO),
      version: versionField("the shipping country"),
    }),
    annotations: { destructive: true, idempotent: true },
    confirm: {
      describe: async ({ storeId, iso }, { clients }) => {
        const { country } = await clients.store.shipping.getCountry(storeId, iso);
        return `Stop delivering to ${country.name} (${country.iso.toUpperCase()}) and delete its ${country.routesCount} governorate and city override(s), ${country.blockedRoutesCount} of them blocks. Checkout stops offering it at once. This cannot be undone: adding the country again starts from a single fee, without these overrides.`;
      },
    },
    run: ({ storeId, iso, version }, { clients }) => clients.store.shipping.deleteCountry(storeId, iso, version),
    entity: (_result, args) => ({ entityType: "shippingCountry", entityId: args.iso }),
  }),
  defineTool({
    name: "store_shipping_clear_route",
    toolset: "store-shipping",
    access: "full",
    title: "Clear a route override",
    description:
      "Removes one place's own fee or delivery block, putting it back on whatever it inherits (its governorate, the country or the store default). Needs the rateId from store_shipping_list_routes.",
    input: z.object({
      storeId: idField(STORE_ID),
      rateId: idField("The override's rateId, from store_shipping_list_routes."),
      version: versionField("the route override"),
    }),
    annotations: { destructive: true, idempotent: true },
    confirm: {
      describe: ({ rateId }) =>
        `Remove the route override ${rateId}: that place drops its own fee and, if it was blocked, delivery there is allowed again — it charges whatever it inherits. The override itself cannot be restored, but the same fee or block can be set again with store_shipping_upsert_route.`,
    },
    run: ({ storeId, rateId, version }, { clients }) => clients.store.shipping.clearRoute(storeId, rateId, version),
    entity: (_result, args) => ({ entityType: "shippingRoute", entityId: args.rateId }),
  }),
  defineTool({
    name: "store_shipping_delete_profile",
    toolset: "store-shipping",
    access: "full",
    title: "Delete a package profile",
    description: "Deletes a package profile and every parcel price set for it, at every place. Parcels of that size are then priced as the next bigger size that has a price, or by the flat route fees.",
    input: z.object({
      storeId: idField(STORE_ID),
      profileId: idField(PROFILE_ID),
      version: versionField("the package profile"),
    }),
    annotations: { destructive: true, idempotent: true },
    confirm: {
      describe: async ({ storeId, profileId }, { clients }) => {
        const profile = await clients.store.shipping.getProfile(storeId, profileId);
        const countries = profile.pricing?.countries?.length ?? 0;
        const overrides = profile.pricing?.overridesCount ?? 0;
        return `Delete the ${profile.type} profile "${profile.name}" and its ${profile.assignmentsCount} parcel price(s): a base price in ${countries} country(ies) and ${overrides} governorate or city price(s). Parcels of that size fall to the next bigger priced size or the flat fees. This cannot be undone: the prices would have to be set again.`;
      },
    },
    run: ({ storeId, profileId, version }, { clients }) => clients.store.shipping.deleteProfile(storeId, profileId, version),
    entity: (_result, args) => ({ entityType: "shippingProfile", entityId: args.profileId }),
  }),
  defineTool({
    name: "store_shipping_remove_parcel_price",
    toolset: "store-shipping",
    access: "full",
    title: "Remove a parcel price",
    description:
      "Removes one parcel price. That size then pays the price above it at that place (the governorate's or the country's); a country price removed leaves the size to the next bigger priced size or the flat route fees.",
    input: z.object({
      storeId: idField(STORE_ID),
      priceId: idField(PRICE_ID),
      version: versionField("the parcel price"),
    }),
    annotations: { destructive: true, idempotent: true },
    confirm: {
      describe: ({ priceId }) =>
        `Remove the parcel price ${priceId}. That size falls back to the price above it at that place, or — for a country price — to the next bigger priced size or the flat route fees. The price itself cannot be restored, but the same fee can be set again with store_shipping_save_place_prices.`,
    },
    run: async ({ storeId, priceId, version }, { clients }) => {
      await clients.store.shipping.removeParcelPrice(storeId, priceId, version);
      return { removed: true, priceId };
    },
    entity: (_result, args) => ({ entityType: "shippingParcelPrice", entityId: args.priceId }),
  }),
];
