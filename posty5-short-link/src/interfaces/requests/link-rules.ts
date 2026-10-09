/**
 * Short link controls (access, routing, A/B variants, UTM, pixels) as the API's
 * Joi schemas accept them (`@posty5/shared/shared-area/link-rules/joi.ts`,
 * `short-link/core/services/campaign-tools/schema.ts`).
 */

/** Device types a routing rule matches (tablet → mobile → desktop → other). */
export type LinkDeviceType = 'tablet' | 'mobile' | 'desktop' | 'other';

/** OS families a routing rule matches. */
export type LinkOsFamily = 'android' | 'ios' | 'windows' | 'macos' | 'linux';

/** Retargeting pixel providers. */
export type LinkPixelProvider = 'meta' | 'googleAds' | 'tiktok' | 'linkedin' | 'x' | 'pinterest';

/**
 * Start / stop / limit / password of a link. On update the API merges `access`
 * field by field: an omitted key keeps the stored value. `null` (the whole
 * object) clears every rule.
 */
export interface ILinkAccessInput {
    /** ISO date; the link answers "not yet active" before it. `null` clears. */
    activeFrom?: string | Date | null;
    /** ISO date, after `activeFrom`; the link answers "expired" after it. `null` clears. */
    expiresAt?: string | Date | null;
    /** 1 – 10,000,000 visits (people, never bots). `null` clears. */
    maxVisits?: number | null;
    /** http(s) URL a stopped visit goes to instead of the unavailable page. `""` / `null` clears. */
    fallbackUrl?: string | null;
    /**
     * Write-only, 4 – 128 characters. `null` removes the password; omitted keeps
     * it. Never returned: responses carry `access.hasPassword`.
     * Feature key `urlShortener.passwordProtection` (plan-gated).
     */
    password?: string | null;
}

/** A weekly window in an IANA time zone; `to < from` is overnight; `days` 0 = Sunday. */
export interface ILinkTimeWindow {
    /** 1 – 7 unique days, 0 (Sunday) – 6. */
    days: number[];
    /** `HH:mm` */
    from: string;
    /** `HH:mm`, different from `from` */
    to: string;
    /** IANA time zone, e.g. `Europe/Berlin` */
    tz: string;
}

/** AND across kinds, OR within a list; at least one kind is required. */
export interface ILinkRoutingConditions {
    /** ISO 3166-1 alpha-2 codes (≤ 250). */
    countries?: string[];
    devices?: LinkDeviceType[];
    os?: LinkOsFamily[];
    /** 2–3 letter lower-case language codes (≤ 50). */
    languages?: string[];
    timeWindow?: ILinkTimeWindow | null;
}

/** One ordered routing rule; the first match wins. */
export interface ILinkRoutingRule {
    /** 8 lower-case letters/digits; omit on create (the API assigns one), keep it on update. */
    id?: string;
    /** ≤ 60 characters */
    name?: string | null;
    conditions: ILinkRoutingConditions;
    /** http(s) URL */
    targetUrl: string;
}

/** One A/B variant; weights are relative (1 – 100). */
export interface ILinkVariant {
    /** 8 lower-case letters/digits; omit on create, keep it on update. */
    id?: string;
    /** ≤ 40 characters */
    name?: string | null;
    /** http(s) URL */
    url: string;
    weight: number;
}

/** UTM parameters appended to the destination; each ≤ 100 chars, no spaces, quotes or `<>`. */
export interface ILinkUtm {
    source?: string | null;
    medium?: string | null;
    campaign?: string | null;
    term?: string | null;
    content?: string | null;
}

/** One retargeting pixel; one per provider, ≤ 5. The id is checked against the provider's pattern. */
export interface ILinkPixel {
    provider: LinkPixelProvider;
    id: string;
}

/** Destination health monitoring switch (the rest of `health` is system-written). */
export interface ILinkHealthInput {
    enabled: boolean;
}

/**
 * The rule sections `ShortLinkClient.setRules()` sends. Partial: an omitted
 * section is left untouched; `null` / `[]` clears it.
 */
export interface IShortLinkRulesInput {
    access?: ILinkAccessInput | null;
    /** ≤ 20 rules */
    routing?: ILinkRoutingRule[] | null;
    /** 0 or 2 – 5 variants, at least one URL different */
    variants?: ILinkVariant[] | null;
    utm?: ILinkUtm | null;
    pixels?: ILinkPixel[] | null;
    /** Required `true` the first time pixels are set (lawful-basis attestation). */
    pixelsConsentAcknowledged?: boolean;
    /** The link's destination; read from the link when omitted (update requires it). */
    baseUrl?: string;
    /** The link's QR template; read from the link when omitted (update requires it with an API key). */
    templateId?: string;
}
