import { z } from "zod";
import { MCP_BULK_MAX_ROWS } from "../config/limits.config";
import { CREATE_SHORT_LINK_FEATURE_PATH } from "../config/link-costs.config";
import { LINK_CLOCK_PATTERN, LINK_RULE_ID_PATTERN, LINK_UTM_VALUE_PATTERN, SHORT_LINK_CONTROLS_LIMITS as L } from "../config/short-link-controls-limits.config";
import { LINK_CAMPAIGN_COLORS, LINK_DEVICE_TYPES, LINK_OS_FAMILIES, LINK_PIXEL_PROVIDERS, SHORT_LINK_STATUSES } from "../config/short-links-enums.config";
import { defineTool, idField, pageFields, pickPage, withoutPaging } from "../core/define-tool.helper";
import { batchIdempotencyKey, describeBatch, unwrapBulkError } from "../core/link-bulk.helper";
import { withoutLinkPassword } from "../core/short-link-rules.helper";
import type { IToolDefinition } from "../interfaces/tool.interface";

const SHORT_LINK_ID = "The short link's _id, from short_link_list.";

const pageInfoField = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
  })
  .optional()
  .describe("Title and description shown on the link's landing page.");

const CAMPAIGN_ID = "The campaign's _id, from short_link_campaign_list.";

const PLAN_GATED = 'Some controls are plan-gated (named in each field); an account without the feature gets "not allowed for this account or plan".';

const ruleUrl = z.string().url().max(2048);
const ruleId = z.string().regex(LINK_RULE_ID_PATTERN).optional().describe("The rule's id from short_link_get; keep it when resending an existing rule, omit it on a new one.");

const accessField = z
  .object({
    activeFrom: z.string().datetime({ offset: true }).nullable().optional().describe('ISO 8601 date-time; before it visitors see "not yet active". null clears.'),
    expiresAt: z.string().datetime({ offset: true }).nullable().optional().describe('ISO 8601 date-time, after activeFrom; after it visitors see "expired". null clears.'),
    maxVisits: z.number().int().min(1).max(L.MAX_VISITS).nullable().optional().describe("Stop after this many visits by people (bots never count). null clears."),
    fallbackUrl: ruleUrl.or(z.literal("")).nullable().optional().describe('Where a stopped visit goes instead of the unavailable page. "" or null clears.'),
    password: z
      .string()
      .min(L.PASSWORD_MIN_LENGTH)
      .max(L.PASSWORD_MAX_LENGTH)
      .nullable()
      .optional()
      .describe(`Visitors must enter it before being redirected. Write-only: never shown again (results carry only access.hasPassword), so do not repeat it back to the user; null removes it; omitted keeps it. ${L.PASSWORD_MIN_LENGTH}-${L.PASSWORD_MAX_LENGTH} characters. Password protection is plan-gated.`),
  })
  .nullable()
  .optional()
  .describe("Availability: start date, end date, visit limit, fallback URL and password. On update each key left out keeps its stored value; null (the whole object) clears every rule. Checked first: a link that is not available never reaches routing.");

const routingField = z
  .array(
    z.object({
      id: ruleId,
      name: z.string().max(L.MAX_RULE_NAME_LENGTH).nullable().optional(),
      conditions: z
        .object({
          countries: z.array(z.string().length(2)).max(L.MAX_RULE_COUNTRIES).optional().describe('ISO 3166-1 alpha-2 codes, e.g. "US".'),
          devices: z.array(z.enum(LINK_DEVICE_TYPES)).optional(),
          os: z.array(z.enum(LINK_OS_FAMILIES)).optional(),
          languages: z.array(z.string().regex(/^[a-z]{2,3}$/)).max(L.MAX_RULE_LANGUAGES).optional().describe('Lower-case 2-3 letter language codes, e.g. "en".'),
          timeWindow: z
            .object({
              days: z.array(z.number().int().min(0).max(6)).min(1).max(7).describe("0 = Sunday ... 6 = Saturday."),
              from: z.string().regex(LINK_CLOCK_PATTERN).describe("HH:mm"),
              to: z.string().regex(LINK_CLOCK_PATTERN).describe("HH:mm, different from `from`; earlier than `from` means overnight."),
              tz: z.string().min(1).describe("IANA time zone, e.g. Europe/Berlin."),
            })
            .nullable()
            .optional(),
        })
        .describe("All given kinds must match (AND); any value within one list matches (OR). At least one kind."),
      targetUrl: ruleUrl.describe("Where a matching visitor goes."),
    }),
  )
  .max(L.MAX_ROUTING_RULES)
  .nullable()
  .optional()
  .describe(`Smart routing: up to ${L.MAX_ROUTING_RULES} ordered rules; the first match wins and sends the visitor to its targetUrl. Sending the list replaces it; null or [] clears it.`);

const variantsField = z
  .array(
    z.object({
      id: ruleId,
      name: z.string().max(L.MAX_VARIANT_NAME_LENGTH).nullable().optional(),
      url: ruleUrl,
      weight: z.number().int().min(L.VARIANT_WEIGHT_MIN).max(L.VARIANT_WEIGHT_MAX).describe("Relative share of visitors."),
    }),
  )
  .max(L.MAX_VARIANTS)
  .refine((list) => list.length === 0 || list.length >= L.MIN_VARIANTS, `Give 0 or ${L.MIN_VARIANTS}-${L.MAX_VARIANTS} variants.`)
  .refine((list) => list.length < 2 || new Set(list.map((item) => item.url)).size > 1, "At least one variant URL must differ.")
  .nullable()
  .optional()
  .describe(`A/B split: 0 or ${L.MIN_VARIANTS}-${L.MAX_VARIANTS} weighted destinations, used when no routing rule matched. null or [] clears.`);

const utmValue = z.string().max(L.MAX_UTM_LENGTH).regex(LINK_UTM_VALUE_PATTERN).or(z.literal("")).nullable().optional();
const utmField = z
  .object({ source: utmValue, medium: utmValue, campaign: utmValue, term: utmValue, content: utmValue })
  .nullable()
  .optional()
  .describe("UTM parameters appended to the destination (no spaces, quotes or <>). A campaign's UTM fills the empty ones. null clears. The UTM builder is plan-gated.");

const pixelsField = z
  .array(z.object({ provider: z.enum(LINK_PIXEL_PROVIDERS), id: z.string().min(1).describe("The pixel / tag id from the provider.") }))
  .max(L.MAX_PIXELS)
  .nullable()
  .optional()
  .describe(`Retargeting pixels fired on a landing step, one per provider, at most ${L.MAX_PIXELS}. The first time pixels are set, pixelsConsentAcknowledged must be true. null or [] clears. Retargeting pixels are plan-gated.`);

const pixelsConsentField = z
  .boolean()
  .optional()
  .describe("Set true only after asking the user, and only when the user confirms they have a lawful basis to track visitors (e.g. a cookie consent). Required the first time pixels are set. Never set it on your own.");

const ruleSections = {
  access: accessField,
  routing: routingField,
  variants: variantsField,
  utm: utmField,
  pixels: pixelsField,
  pixelsConsentAcknowledged: pixelsConsentField,
};

const utmInput = z
  .object({ source: utmValue, medium: utmValue, campaign: utmValue, term: utmValue, content: utmValue })
  .nullable()
  .optional();

const campaignFields = {
  description: z.string().max(L.CAMPAIGN_DESCRIPTION_MAX_LENGTH).nullable().optional(),
  color: z.enum(LINK_CAMPAIGN_COLORS).nullable().optional(),
  utm: utmInput.describe("Default UTM, copied into a link's empty UTM fields when the link is saved with this campaign. null clears."),
  archived: z.boolean().optional().describe("true archives (hidden from pickers; its links keep working), false restores."),
};

const editableFields = {
  name: z.string().optional().describe("A label for finding the link later."),
  refId: z.string().optional().describe("Your own reference id."),
  tags: z
    .array(z.string().min(1).max(L.MAX_TAG_LENGTH))
    .max(L.MAX_TAGS)
    .nullable()
    .optional()
    .describe(`Up to ${L.MAX_TAGS} tags (unique ignoring case) for grouping links; the list replaces the stored one; null or [] removes them. Existing tags: short_link_list_tags. (The old single "tag" field is deprecated; use tags.)`),
  campaignId: z.string().nullable().optional().describe(`The campaign the link belongs to: ${CAMPAIGN_ID} "" or null detaches. Campaigns are plan-gated.`),
  health: z.object({ enabled: z.boolean() }).optional().describe("Destination health monitoring on or off; results appear in short_link_get under health. The health monitor is plan-gated."),
  ...ruleSections,
  templateId: z.string().optional().describe("QR code template id, from qr_code_list_templates."),
  isEnableMonetization: z.boolean().optional(),
  pageInfo: pageInfoField,
};

export const SHORT_LINK_TOOLS: IToolDefinition[] = [
  defineTool({
    name: "short_link_list",
    toolset: "short-links",
    access: "read",
    title: "List short links",
    description: "Short links, newest first, with their short URL, target and visit count. Filter by part of the target URL, name, tag, refId or status.",
    input: z.object({
      baseUrl: z.string().optional().describe("Part or all of the target URL."),
      name: z.string().optional(),
      tag: z.string().optional().describe("Links carrying this tag in any position."),
      tags: z.array(z.string()).optional().describe("Links carrying every one of these tags."),
      campaignId: z.string().optional().describe(CAMPAIGN_ID),
      refId: z.string().optional(),
      status: z.enum(SHORT_LINK_STATUSES).optional(),
      createdFrom: z.string().optional().describe('Where it was created, e.g. "mcp".'),
      ...pageFields(),
    }),
    run: (args, { clients }) => clients.shortLinks.list(withoutPaging(args), pickPage(args)),
  }),
  defineTool({
    name: "short_link_get",
    toolset: "short-links",
    access: "read",
    title: "Get a short link",
    description: "One short link with its full details: target, short URL, status, visits, landing page and QR code URLs, tags, campaignId, and its controls: access (hasPassword only, never the password), routing, variants, utm, pixels and health.",
    input: z.object({ id: idField(SHORT_LINK_ID) }),
    run: async ({ id }, { clients }) => withoutLinkPassword(await clients.shortLinks.get(id)),
  }),
  defineTool({
    name: "short_link_create",
    toolset: "short-links",
    access: "write",
    title: "Create a short link",
    description: `Creates a short link to baseUrl and returns its short URL and QR code URLs. It is live at once. Needs a templateId from qr_code_list_templates. Optional controls, applied per visit in this order: access (dates, visit limit, password), then routing (first matching rule), then variants (A/B split), else baseUrl; utm is appended to the destination. ${PLAN_GATED}`,
    input: z.object({
      baseUrl: z.string().url().describe("The URL the short link opens."),
      ...editableFields,
      templateId: idField("The QR code template the link uses: an _id from qr_code_list_templates. The API refuses a create without one."),
      customLandingId: z.string().optional().describe("A custom landing id (the short URL's last part), when the plan allows it."),
    }),
    run: async (args, { clients }) => withoutLinkPassword(await clients.shortLinks.create(args)),
    entity: (result) => ({ entityType: "shortLink", entityId: result?._id }),
  }),
  defineTool({
    name: "short_link_create_many",
    toolset: "short-links",
    access: "write",
    title: "Create short links in a batch",
    description: `Creates 1 to ${MCP_BULK_MAX_ROWS} short links in one call. Each row needs a templateId, or give one in defaults. A row the API refuses is reported with its errors and skipped; the rest are created and live at once. Returns created, failed and one item per row (row is 1-based) with its short URL. For bigger batches, upload a file in the Posty5 dashboard.`,
    input: z.object({
      rows: z
        .array(
          z.object({
            url: z.string().url().describe("The URL the short link opens."),
            name: z.string().optional().describe("A label for finding the link later."),
            customId: z.string().optional().describe("A custom landing id (the short URL's last part), when the plan allows it."),
            tag: z.string().optional(),
            refId: z.string().optional(),
            templateId: z.string().optional().describe("QR code template id, from qr_code_list_templates; overrides defaults.templateId."),
          }),
        )
        .min(1)
        .max(MCP_BULK_MAX_ROWS, `At most ${MCP_BULK_MAX_ROWS} rows per call; upload a file in the Posty5 dashboard for more.`)
        .describe(`The links to create, at most ${MCP_BULK_MAX_ROWS}.`),
      defaults: z
        .object({ templateId: z.string().optional(), tag: z.string().optional(), refId: z.string().optional() })
        .optional()
        .describe("Applied to every row that does not set the field."),
    }),
    annotations: { idempotent: true, openWorld: true },
    confirm: {
      describe: ({ rows }) => describeBatch(rows.length, "short link"),
      costFeaturePath: CREATE_SHORT_LINK_FEATURE_PATH,
    },
    run: ({ rows, defaults }, { clients, call }) =>
      unwrapBulkError(() => clients.shortLinks.createMany(rows, { defaults, idempotencyKey: batchIdempotencyKey(call) })),
    entity: (result) => ({ entityType: "shortLink", count: result?.created }),
  }),
  defineTool({
    name: "short_link_update",
    toolset: "short-links",
    access: "write",
    title: "Update a short link",
    description: `Changes a short link's target, details or controls. Fields left out keep their current value; access is merged key by key. To change only controls, short_link_set_rules is simpler. The short URL itself never changes. ${PLAN_GATED}`,
    input: z.object({
      id: idField(SHORT_LINK_ID),
      baseUrl: z.string().url().optional().describe("The new target URL."),
      ...editableFields,
    }),
    annotations: { idempotent: true },
    run: async ({ id, ...changes }, { clients }) => {
      const current = await clients.shortLinks.get(id);
      const updated = await clients.shortLinks.update(id, {
        name: current.name,
        baseUrl: current.baseUrl ?? "",
        refId: current.refId,
        templateId: current.templateId ?? "",
        isEnableMonetization: current.isEnableMonetization,
        pageInfo: current.pageInfo ? { title: current.pageInfo.title, description: current.pageInfo.description } : undefined,
        ...Object.fromEntries(Object.entries(changes).filter(([, value]) => value !== undefined)),
      });
      return withoutLinkPassword(updated);
    },
    entity: (_result, args) => ({ entityType: "shortLink", entityId: args.id }),
  }),
  defineTool({
    name: "short_link_delete",
    toolset: "short-links",
    access: "full",
    title: "Delete a short link",
    description: "Deletes a short link. Its short URL and QR code stop working. Cannot be undone.",
    input: z.object({ id: idField(SHORT_LINK_ID) }),
    annotations: { destructive: true, idempotent: true },
    confirm: {
      describe: async ({ id }, { clients }) => {
        const link = await clients.shortLinks.get(id);
        return `Delete the short link ${link.shorterLink}${link.name ? ` ("${link.name}")` : ""}, which opens ${link.baseUrl}. It has had ${link.numberOfVisitors} visits. The short URL and its QR code stop working, and this cannot be undone.`;
      },
    },
    run: async ({ id }, { clients }) => {
      await clients.shortLinks.delete(id);
      return { deleted: true, id };
    },
    entity: (_result, args) => ({ entityType: "shortLink", entityId: args.id }),
  }),
  defineTool({
    name: "short_link_set_rules",
    toolset: "short-links",
    access: "write",
    title: "Set a short link's controls",
    description: `Sets a short link's controls. Partial: only the sections given change; a section left out is untouched; null or [] clears it; access is merged key by key. Order per visit: access (dates, visit limit, password), then routing (first matching rule), then variants (A/B split), else the link's target; utm is appended to the destination. ${PLAN_GATED}`,
    input: z.object({ id: idField(SHORT_LINK_ID), ...ruleSections }),
    annotations: { idempotent: true },
    run: async ({ id, ...rules }, { clients }) => withoutLinkPassword(await clients.shortLinks.setRules(id, rules)),
    entity: (_result, args) => ({ entityType: "shortLink", entityId: args.id }),
  }),
  defineTool({
    name: "short_link_list_tags",
    toolset: "short-links",
    access: "read",
    title: "List short link tags",
    description: "The distinct tags on your short links, sorted, at most 200. Use them in short_link_create / short_link_update tags and in short_link_list.",
    input: z.object({ term: z.string().optional().describe("Only tags starting with this, ignoring case.") }),
    run: async ({ term }, { clients }) => ({ tags: await clients.shortLinks.listTags(term) }),
  }),
  defineTool({
    name: "short_link_check_health",
    toolset: "short-links",
    access: "write",
    title: "Check a short link's destination",
    description: "Queues one health check of the link's destinations. It runs in the background: read the result later with short_link_get (health.status, health.lastResult). At most one check per link every 10 minutes. The health monitor is plan-gated.",
    input: z.object({ id: idField(SHORT_LINK_ID) }),
    annotations: { idempotent: true },
    run: async ({ id }, { clients }) => {
      await clients.shortLinks.checkHealth(id);
      return { queued: true, id, next: "Read the result later with short_link_get." };
    },
    entity: (_result, args) => ({ entityType: "shortLink", entityId: args.id }),
  }),
  defineTool({
    name: "short_link_campaign_list",
    toolset: "short-links",
    access: "read",
    title: "List link campaigns",
    description: "Link campaigns: named groups of short links with optional default UTM. Their _id is the campaignId of short_link_create / short_link_update / short_link_list.",
    input: z.object({
      term: z.string().optional().describe("Part of the campaign name."),
      archived: z.boolean().optional().describe("true: archived only; false: active only."),
      ...pageFields(),
    }),
    run: (args, { clients }) => clients.linkCampaigns.list(withoutPaging(args), pickPage(args)),
  }),
  defineTool({
    name: "short_link_campaign_get",
    toolset: "short-links",
    access: "read",
    title: "Get a link campaign",
    description: "One link campaign with its default UTM, linkCount and totalVisits (the sum of its links' visits).",
    input: z.object({ id: idField(CAMPAIGN_ID) }),
    run: ({ id }, { clients }) => clients.linkCampaigns.get(id),
  }),
  defineTool({
    name: "short_link_campaign_create",
    toolset: "short-links",
    access: "write",
    title: "Create a link campaign",
    description: "Creates a link campaign. Attach links with short_link_create / short_link_update campaignId. Names are unique per account. Campaigns are plan-gated.",
    input: z.object({ name: z.string().trim().min(1).max(L.CAMPAIGN_NAME_MAX_LENGTH), ...campaignFields }),
    run: (args, { clients }) => clients.linkCampaigns.create(args),
    entity: (result) => ({ entityType: "linkCampaign", entityId: result?._id }),
  }),
  defineTool({
    name: "short_link_campaign_update",
    toolset: "short-links",
    access: "write",
    title: "Update a link campaign",
    description: "Changes a link campaign. Fields left out keep their value. Campaigns are plan-gated.",
    input: z.object({ id: idField(CAMPAIGN_ID), name: z.string().trim().min(1).max(L.CAMPAIGN_NAME_MAX_LENGTH).optional(), ...campaignFields }),
    annotations: { idempotent: true },
    run: ({ id, ...changes }, { clients }) => clients.linkCampaigns.update(id, changes),
    entity: (_result, args) => ({ entityType: "linkCampaign", entityId: args.id }),
  }),
  defineTool({
    name: "short_link_campaign_delete",
    toolset: "short-links",
    access: "full",
    title: "Delete a link campaign",
    description: "Deletes a link campaign. Refused while links use it unless detach is true, which first removes the campaign from its links (the links keep working). Cannot be undone.",
    input: z.object({
      id: idField(CAMPAIGN_ID),
      detach: z.boolean().optional().describe("true: detach the campaign's links first. Default false."),
    }),
    annotations: { destructive: true, idempotent: true },
    confirm: {
      describe: async ({ id, detach }, { clients }) => {
        const campaign = await clients.linkCampaigns.get(id);
        const links = campaign.linkCount
          ? detach
            ? ` Its ${campaign.linkCount} links are detached from it and keep working.`
            : ` It still has ${campaign.linkCount} links, so the delete is refused unless detach is true.`
          : "";
        return `Delete the link campaign "${campaign.name}".${links} This cannot be undone.`;
      },
    },
    run: async ({ id, detach }, { clients }) => {
      await clients.linkCampaigns.delete(id, { detach });
      return { deleted: true, id };
    },
    entity: (_result, args) => ({ entityType: "linkCampaign", entityId: args.id }),
  }),
];
