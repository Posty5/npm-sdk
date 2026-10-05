import { z } from "zod";
import { QR_CODE_MODES, QR_CODE_REQUIRED_FIELDS, QR_CODE_STATUSES, QR_CODE_TYPES, QR_TEMPLATE_SCOPES, WIFI_AUTHENTICATION_TYPES } from "../config/qr-codes-enums.config";
import { MCP_BULK_MAX_ROWS } from "../config/limits.config";
import { CREATE_QR_CODE_FEATURE_PATH } from "../config/link-costs.config";
import { batchIdempotencyKey, describeBatch, describeQrBulkJob, runQrZipJob, unwrapBulkError } from "../core/link-bulk.helper";
import { defineTool, idField, pageFields, pickPage, requireFields, withoutPaging } from "../core/define-tool.helper";
import { checkQrCodeAccess, createQrCode, resolveQrCodeMode, toQrBulkRow, updateQrCode } from "../core/qr-codes.helper";
import type { IToolDefinition } from "../interfaces/tool.interface";

const QR_CODE_ID = "The QR code's _id, from qr_code_list.";

/** The flat target fields; `type` says which apply (`QR_CODE_REQUIRED_FIELDS` lists the required ones). */
const targetFields = {
  type: z
    .enum(QR_CODE_TYPES)
    .describe(
      'What scanning the QR code does: "freeText" shows text, "email" opens a new email, "wifi" joins a network, "call" dials a number, "sms" opens a text message, "url" opens a website, "geolocation" opens a map point. Fill the fields for that type.',
    ),
  text: z.string().optional().describe('type "freeText" (required): the text to encode.'),
  email: z.string().optional().describe('type "email" (required): the recipient address.'),
  emailSubject: z.string().optional().describe('type "email": the subject line.'),
  emailBody: z.string().optional().describe('type "email": the message body.'),
  wifiName: z.string().optional().describe('type "wifi" (required): the network name (SSID).'),
  wifiAuthenticationType: z.enum(WIFI_AUTHENTICATION_TYPES).optional().describe('type "wifi" (required): WPA = WPA/WPA2, SAE = WPA3, nopass = open network.'),
  wifiPassword: z.string().optional().describe('type "wifi": the network password; omit for an open network.'),
  phoneNumber: z.string().optional().describe('types "call" and "sms" (required): the phone number, with country code.'),
  smsMessage: z.string().optional().describe('type "sms": the prefilled message.'),
  url: z.string().url().optional().describe('type "url" (required): the website the QR code opens.'),
  latitude: z.number().min(-90).max(90).optional().describe('type "geolocation" (required): latitude in degrees.'),
  longitude: z.number().min(-180).max(180).optional().describe('type "geolocation" (required): longitude in degrees.'),
};

const labelFields = {
  name: z.string().optional().describe("A label for finding the QR code later."),
  refId: z.string().optional().describe("Your own reference id."),
  tag: z.string().optional().describe("A tag for grouping QR codes."),
};

const accessField = z
  .object({
    activeFrom: z.string().datetime({ offset: true }).nullable().optional().describe("ISO date-time the code starts working; null for no start."),
    expiresAt: z.string().datetime({ offset: true }).nullable().optional().describe("ISO date-time the code stops working (after activeFrom); null for no end."),
    maxVisits: z.number().int().min(1).nullable().optional().describe("The code stops working after this many visits; null for no limit."),
    fallbackUrl: z.string().url().max(2048).or(z.literal("")).nullable().optional().describe('An http(s) URL a scan goes to while the code is not working; null or "" for none.'),
  })
  .nullable()
  .optional()
  .describe(
    "Scan rules, dynamic codes only (not Wi-Fi, not static). The object replaces any stored rules whole; null (or all fields empty) clears them; left out keeps them. May be refused by the user's plan.",
  );

export const QR_CODE_TOOLS: IToolDefinition[] = [
  defineTool({
    name: "qr_code_list",
    toolset: "qr-codes",
    access: "read",
    title: "List QR codes",
    description:
      "QR codes, newest first, with their type, mode (static or dynamic), dynamicSince, landing page URL, image URL and scan count. Filter by name, landing id, template, tag, refId, status or mode.",
    input: z.object({
      name: z.string().optional().describe("Part of the QR code's name."),
      qrCodeId: z.string().optional().describe("The QR code's landing id (the last part of its landing page URL)."),
      templateId: z.string().optional().describe("Only QR codes styled by this template (from qr_code_list_templates)."),
      tag: z.string().optional(),
      refId: z.string().optional(),
      status: z.enum(QR_CODE_STATUSES).optional(),
      createdFrom: z.string().optional().describe('Where it was created, e.g. "mcp".'),
      mode: z.enum(QR_CODE_MODES).optional().describe('Only "static" or only "dynamic" QR codes.'),
      ...pageFields(),
    }),
    run: (args, { clients }) => clients.qrCodes.list(withoutPaging(args), pickPage(args)),
  }),
  defineTool({
    name: "qr_code_get",
    toolset: "qr-codes",
    access: "read",
    title: "Get a QR code",
    description:
      "One QR code with its full details: type and target, mode (a dynamic code's image encodes qrCodeLandingPageURL), dynamicSince, template, status, scans, landing page and image URLs.",
    input: z.object({ id: idField(QR_CODE_ID) }),
    run: ({ id }, { clients }) => clients.qrCodes.get(id),
  }),
  defineTool({
    name: "qr_code_list_templates",
    toolset: "qr-codes",
    access: "read",
    title: "List QR code templates",
    description:
      'The templates that style a QR code — every QR code needs one: its _id is the templateId qr_code_create takes. scope "user" lists the account\'s own templates, "public" Posty5\'s ready-made ones. Designing a template stays in the Posty5 dashboard.',
    input: z.object({
      scope: z.enum(QR_TEMPLATE_SCOPES).default("user").describe('"user" (default): your own templates. "public": Posty5\'s templates.'),
      term: z.string().optional().describe("Part of the template's name."),
      ...pageFields(),
    }),
    run: ({ scope, term, ...paging }, { clients }) =>
      scope === "public" ? clients.qrTemplates.listPublicTemplates({ term }, pickPage(paging)) : clients.qrTemplates.listUserTemplates({ term }, pickPage(paging)),
  }),
  defineTool({
    name: "qr_code_create",
    toolset: "qr-codes",
    access: "write",
    title: "Create a QR code",
    description:
      "Creates a QR code of the given type and returns its mode, landing page URL and image URL. It works at once. Needs a templateId from qr_code_list_templates and the fields of its type. " +
      "Dynamic codes (the default) point to a Posty5 link, so their target can be changed later with qr_code_update. " +
      "Wi-Fi codes are always static. " +
      "Switching mode later changes the image. " +
      "Optional access sets scan rules (start, end, visit limit, fallback URL) on a dynamic code; it may be refused by the user's plan.",
    input: z.object({
      ...targetFields,
      templateId: idField("The template that styles the QR code: an _id from qr_code_list_templates."),
      ...labelFields,
      customLandingId: z.string().max(32).optional().describe("A custom landing id (the landing URL's last part, at most 32 characters), when the plan allows it."),
      mode: z
        .enum(QR_CODE_MODES)
        .optional()
        .describe('"dynamic" (default): the image encodes a Posty5 link, so the target can change later without reprinting. "static": the image encodes the content itself. type "wifi" is always static.'),
      access: accessField,
    }),
    run: (args, { clients }) => {
      requireFields(args, QR_CODE_REQUIRED_FIELDS[args.type], `type "${args.type}"`);
      const mode = resolveQrCodeMode(args, args.mode, true);
      checkQrCodeAccess(args, mode, args.access);
      const { name, templateId, refId, tag, customLandingId, access } = args;
      return createQrCode(clients.qrCodes, { name, templateId, refId, tag, customLandingId, mode, ...(access !== undefined ? { access } : {}) }, args);
    },
    entity: (result) => ({ entityType: "qrCode", entityId: result?._id }),
  }),
  defineTool({
    name: "qr_code_create_many",
    toolset: "qr-codes",
    access: "write",
    title: "Create QR codes in a batch",
    description:
      `Creates 1 to ${MCP_BULK_MAX_ROWS} QR codes in one call; each row takes the same type and fields as qr_code_create, and needs a templateId (or one in defaults). mode defaults to "dynamic" as in qr_code_create; Wi-Fi is always static. ` +
      "A row the API refuses is reported with its errors and skipped. Returns created, failed and one item per row (row is 1-based) with its qrCodeDownloadURL. " +
      'zip: true runs it as a bulk job instead and answers a signed link to a ZIP of all the images; the link expires within minutes, so give it to the user promptly. If the job is still running after a short wait, the answer holds a jobId for qr_code_get_bulk_job.',
    input: z.object({
      rows: z
        .array(
          z.object({
            ...targetFields,
            templateId: z.string().optional().describe("The template that styles the QR code, from qr_code_list_templates; overrides defaults.templateId."),
            ...labelFields,
            customId: z.string().max(32).optional().describe("A custom landing id, when the plan allows it."),
            fileName: z.string().optional().describe("zip: the image's file name inside the ZIP."),
            mode: z.enum(QR_CODE_MODES).optional().describe('"dynamic" (default) or "static". type "wifi" is always static.'),
          }),
        )
        .min(1)
        .max(MCP_BULK_MAX_ROWS, `At most ${MCP_BULK_MAX_ROWS} rows per call; upload a file in the Posty5 dashboard for more.`)
        .describe(`The QR codes to create, at most ${MCP_BULK_MAX_ROWS}.`),
      defaults: z
        .object({ templateId: z.string().optional(), tag: z.string().optional(), refId: z.string().optional() })
        .optional()
        .describe("Applied to every row that does not set the field."),
      zip: z.boolean().optional().describe("true: also build a ZIP of the images and answer a signed, expiring link to it."),
      image: z
        .object({
          format: z.enum(["png", "svg", "pdf"]).default("png"),
          sizePx: z.number().int().min(10).max(2000).optional().describe("Image width in pixels; default the template's."),
        })
        .optional()
        .describe("zip: the images' format and size."),
    }),
    annotations: { idempotent: true, openWorld: true },
    confirm: {
      describe: ({ rows, zip }) => describeBatch(rows.length, "QR code", zip ? " The images are also packed into a ZIP, behind a link that expires within minutes." : ""),
      costFeaturePath: CREATE_QR_CODE_FEATURE_PATH,
    },
    run: async ({ rows, defaults, zip, image }, { clients, call }) => {
      const items = rows.map((row, index) => {
        requireFields(row, QR_CODE_REQUIRED_FIELDS[row.type], `rows[${index}] type "${row.type}"`);
        return toQrBulkRow(row, resolveQrCodeMode(row, row.mode, true));
      });
      const idempotencyKey = batchIdempotencyKey(call);
      if (zip) return runQrZipJob(clients.qrCodes, items, { defaults, image, idempotencyKey });
      return unwrapBulkError(() => clients.qrCodes.createMany(items, { defaults, idempotencyKey }));
    },
    entity: (result) => ({ entityType: "qrCode", count: result?.created }),
  }),
  defineTool({
    name: "qr_code_get_bulk_job",
    toolset: "qr-codes",
    access: "read",
    title: "Get a QR bulk job",
    description:
      "The status and counters of a QR bulk job started by qr_code_create_many with zip: true. Once it has finished, the answer holds signed links to the image ZIP, the per-row result CSV and the refused rows' CSV; they expire within minutes, so give them to the user promptly.",
    input: z.object({ jobId: idField("The jobId from qr_code_create_many.") }),
    run: async ({ jobId }, { clients }) => describeQrBulkJob(clients.qrCodes, await clients.qrCodes.getBulkJob(jobId)),
  }),
  defineTool({
    name: "qr_code_update",
    toolset: "qr-codes",
    access: "write",
    title: "Update a QR code",
    description:
      "Replaces a QR code's target: give its type (the current one is qrCodeTarget.type in qr_code_get, and it may change) and every field of that type. name, templateId, refId and tag left out keep their current value. Its landing page and image URLs never change. " +
      "mode left out keeps the current mode; changing mode changes the printed image (the old printed code still works). " +
      "access left out keeps the scan rules; an object replaces them; null clears them. It may be refused by the user's plan.",
    input: z.object({
      id: idField(QR_CODE_ID),
      ...targetFields,
      templateId: z.string().optional().describe("A new template, from qr_code_list_templates."),
      ...labelFields,
      mode: z.enum(QR_CODE_MODES).optional().describe('Leave out to keep the current mode. "dynamic" or "static" switches it, which changes the image. type "wifi" cannot be dynamic.'),
      access: accessField,
    }),
    annotations: { idempotent: true },
    run: async (args, { clients }) => {
      requireFields(args, QR_CODE_REQUIRED_FIELDS[args.type], `type "${args.type}"`);
      const mode = resolveQrCodeMode(args, args.mode, false);
      checkQrCodeAccess(args, mode, args.access);
      const current = await clients.qrCodes.get(args.id);
      const base = { name: args.name ?? current.name, templateId: args.templateId ?? current.templateId ?? "", refId: args.refId, tag: args.tag, mode, ...(args.access !== undefined ? { access: args.access } : {}) };
      return updateQrCode(clients.qrCodes, args.id, base, args);
    },
    entity: (_result, args) => ({ entityType: "qrCode", entityId: args.id }),
  }),
  defineTool({
    name: "qr_code_delete",
    toolset: "qr-codes",
    access: "full",
    title: "Delete a QR code",
    description: "Deletes a QR code. Its landing page stops working, so printed copies stop working too. Cannot be undone.",
    input: z.object({ id: idField(QR_CODE_ID) }),
    annotations: { destructive: true, idempotent: true },
    confirm: {
      describe: async ({ id }, { clients }) => {
        const qrCode = await clients.qrCodes.get(id);
        return `Delete the QR code "${qrCode.name}" (${qrCode.qrCodeLandingPageURL}), scanned ${qrCode.numberOfVisitors ?? 0} times. Every printed or shared copy stops working, and this cannot be undone.`;
      },
      costFeaturePath: "qrCodeGenerator.deleteQrCode",
    },
    run: async ({ id }, { clients }) => {
      await clients.qrCodes.delete(id);
      return { deleted: true, id };
    },
    entity: (_result, args) => ({ entityType: "qrCode", entityId: args.id }),
  }),
];
