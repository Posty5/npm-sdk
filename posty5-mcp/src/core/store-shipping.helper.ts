/**
 * Argument schemas and checks the store-shipping tools share. Shipping is
 * country → governorate → city: a place is addressed by its level plus the
 * catalogue codes above it, because city names repeat across governorates.
 */
import { z } from "zod";
import { SHIPPING_ASSIGNMENT_LEVELS, SHIPPING_ROUTE_LEVELS } from "../config/store-shipping-enums.config";
import { requireFields } from "./define-tool.helper";

const GOVERNORATE_CODE = "The governorate's catalogue code, from store_shipping_list_governorates.";
const CITY_KEY = 'The city\'s key, from store_shipping_list_routes with level "city".';

/** A two-letter ISO country code argument, described with where it comes from. */
export function countryIsoField(description: string) {
  return z.string().length(2).describe(description);
}

/** A fee that may be `null` — "no fee at this level, inherit from the one above". `0` is a real fee: free delivery. */
export function nullableFeeField(description: string) {
  return z.number().min(0).nullable().describe(description);
}

/** The fields that address and price one route: a governorate, or a city inside one. */
export function routeFields() {
  return {
    level: z.enum(SHIPPING_ROUTE_LEVELS).describe('"governorate" or "city".'),
    governorateCode: z.string().min(1).describe(GOVERNORATE_CODE),
    cityKey: z.string().min(1).optional().describe(`Required when level is "city". ${CITY_KEY}`),
    fee: nullableFeeField("This place's own fee. null removes it, so the place inherits again; 0 is free delivery.").optional(),
    isAllowed: z.boolean().optional().describe("false blocks delivery to this place; true allows it again."),
  };
}

/** One route row, for `store_shipping_bulk_upsert_routes`. */
export function routeRowSchema() {
  return z.object(routeFields());
}

/** Throws unless a city route names its city. */
export function checkRoutePlace(route: { level: string; cityKey?: string }, context: string): void {
  if (route.level === "city") requireFields(route, ["cityKey"], context);
}

/** The fields that name the place a parcel price lives at. */
export function placeFields() {
  return {
    level: z.enum(SHIPPING_ASSIGNMENT_LEVELS).describe('"country", "governorate" or "city".'),
    governorateCode: z.string().min(1).optional().describe(`Required at governorate and city level. ${GOVERNORATE_CODE}`),
    cityKey: z.string().min(1).optional().describe(`Required at city level. ${CITY_KEY}`),
  };
}

/** Throws unless the place carries the codes its level needs: a governorate its code, a city both. */
export function checkPlace(place: { level: string; governorateCode?: string; cityKey?: string }): void {
  if (place.level === "governorate") requireFields(place, ["governorateCode"], 'level "governorate"');
  if (place.level === "city") requireFields(place, ["governorateCode", "cityKey"], 'level "city"');
}

/** A package profile's one size. Every limit is optional; `null` means "no cap on this measurement". */
export function profileConditionSchema() {
  return z.object({
    key: z.string().min(1).optional().describe("The size's key, from store_shipping_get_profile (condition.key). Send it back when changing a size so its prices stay attached; omit on create."),
    label: z.string().optional().describe("Shown next to the price; generated from the limits when empty."),
    maxWeight: z.number().positive().nullable().optional().describe("Weight profiles: the most a parcel may weigh, in kg. null = no cap."),
    maxLength: z.number().positive().nullable().optional().describe("Dimension profiles: longest side, in cm. null = no cap."),
    maxWidth: z.number().positive().nullable().optional().describe("Dimension profiles: width, in cm. null = no cap."),
    maxHeight: z.number().positive().nullable().optional().describe("Dimension profiles: height, in cm. null = no cap."),
  });
}

/** One profile's price at a place, for `store_shipping_save_place_prices`. */
export function placePriceSchema() {
  return z.object({
    profileId: z.string().min(1).describe("The package profile's _id, from store_shipping_list_profiles."),
    fee: nullableFeeField("What a parcel of this size costs here. null removes this place's own price, so the size falls back to the price above it; 0 is free."),
  });
}
