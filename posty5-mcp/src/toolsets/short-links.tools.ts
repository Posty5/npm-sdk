import { z } from "zod";
import { SHORT_LINK_STATUSES } from "../config/short-links-enums.config";
import { defineTool, idField, pageFields, pickPage, withoutPaging } from "../core/define-tool.helper";
import type { IToolDefinition } from "../interfaces/tool.interface";

const SHORT_LINK_ID = "The short link's _id, from short_link_list.";

const pageInfoField = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
  })
  .optional()
  .describe("Title and description shown on the link's landing page.");

const editableFields = {
  name: z.string().optional().describe("A label for finding the link later."),
  refId: z.string().optional().describe("Your own reference id."),
  tag: z.string().optional().describe("A tag for grouping links."),
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
      tag: z.string().optional(),
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
    description: "One short link with its full details: target, short URL, status, visits, landing page and QR code URLs.",
    input: z.object({ id: idField(SHORT_LINK_ID) }),
    run: ({ id }, { clients }) => clients.shortLinks.get(id),
  }),
  defineTool({
    name: "short_link_create",
    toolset: "short-links",
    access: "write",
    title: "Create a short link",
    description: "Creates a short link to baseUrl and returns its short URL and QR code URLs. It is live at once.",
    input: z.object({
      baseUrl: z.string().url().describe("The URL the short link opens."),
      ...editableFields,
      customLandingId: z.string().optional().describe("A custom landing id (the short URL's last part), when the plan allows it."),
    }),
    run: (args, { clients }) => clients.shortLinks.create(args),
    entity: (result) => ({ entityType: "shortLink", entityId: result?._id }),
  }),
  defineTool({
    name: "short_link_update",
    toolset: "short-links",
    access: "write",
    title: "Update a short link",
    description: "Changes a short link's target or details. Fields left out keep their current value. The short URL itself never changes.",
    input: z.object({
      id: idField(SHORT_LINK_ID),
      baseUrl: z.string().url().optional().describe("The new target URL."),
      ...editableFields,
    }),
    annotations: { idempotent: true },
    run: async ({ id, ...changes }, { clients }) => {
      const current = await clients.shortLinks.get(id);
      return clients.shortLinks.update(id, {
        name: current.name,
        baseUrl: current.baseUrl ?? "",
        refId: current.refId,
        tag: current.tag,
        templateId: current.templateId,
        isEnableMonetization: current.isEnableMonetization,
        pageInfo: current.pageInfo ? { title: current.pageInfo.title, description: current.pageInfo.description } : undefined,
        ...Object.fromEntries(Object.entries(changes).filter(([, value]) => value !== undefined)),
      });
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
];
