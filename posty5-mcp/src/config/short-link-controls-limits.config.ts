/** Short link controls limits, mirrored from the API's Joi (`link-rules/joi.ts`, `link-campaign.config.ts`) so the model is refused before the call. */
export const SHORT_LINK_CONTROLS_LIMITS = {
  PASSWORD_MIN_LENGTH: 4,
  PASSWORD_MAX_LENGTH: 128,
  MAX_VISITS: 10_000_000,
  MAX_ROUTING_RULES: 20,
  MAX_RULE_NAME_LENGTH: 60,
  MAX_RULE_COUNTRIES: 250,
  MAX_RULE_LANGUAGES: 50,
  MIN_VARIANTS: 2,
  MAX_VARIANTS: 5,
  MAX_VARIANT_NAME_LENGTH: 40,
  VARIANT_WEIGHT_MIN: 1,
  VARIANT_WEIGHT_MAX: 100,
  MAX_UTM_LENGTH: 100,
  MAX_PIXELS: 5,
  MAX_TAGS: 10,
  MAX_TAG_LENGTH: 40,
  CAMPAIGN_NAME_MAX_LENGTH: 60,
  CAMPAIGN_DESCRIPTION_MAX_LENGTH: 300,
} as const;

/** `HH:mm`, 24-hour. */
export const LINK_CLOCK_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** UTM values: no spaces, quotes or angle brackets. */
export const LINK_UTM_VALUE_PATTERN = /^[^\s<>"']+$/;

/** Routing rule / variant ids the API assigns. */
export const LINK_RULE_ID_PATTERN = /^[a-z0-9]{8}$/;
