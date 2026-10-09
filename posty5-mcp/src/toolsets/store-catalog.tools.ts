import { z } from "zod";
import { BULK_CREATE_MAX_ITEMS } from "../config/limits.config";
import { PRODUCT_CREATE_STATUSES, PRODUCT_SECTIONS, PRODUCT_STATUSES, TAG_STATUSES } from "../config/store-catalog-enums.config";
import { ADD_PRODUCT_FEATURE_PATH, AI_PRODUCT_CONTENT_FEATURE_PATH, CLONE_ADD_PRODUCT_MULTIPLIER } from "../config/store-catalog-costs.config";
import { PRODUCT_MAX_IMAGES, PRODUCT_MAX_TAGS, PRODUCT_REORDER_MAX_ITEMS, TAG_ASSIGN_MAX_PRODUCTS, TAG_RESOLVE_MAX_LIMIT } from "../config/store-catalog-limits.config";
import { cursorFields, defineTool, idField, requireAtLeastOne, versionField } from "../core/define-tool.helper";
import { dateField } from "../core/store-date-field.helper";
import { saveProductSection } from "../core/store-product-sections.helper";
import type { IToolDefinition } from "../interfaces/tool.interface";

const STORE_ID = "The store's _id, from store_list.";
const PRODUCT_ID = "The product's _id, from store_product_search.";
const TAG_ID = "The tag's _id, from store_tag_search.";

const productImageField = z.object({ url: z.string().url().describe("A public http(s) image URL.") });

const productOptionField = z.object({
  name: z.string().min(1).describe('The choice\'s name, e.g. "Size".'),
  values: z.array(z.string().min(1)).min(1).describe('Its values, e.g. ["S", "M", "L"].'),
});

/** The fields of `ICreateProductInput` an assistant sets; `status` differs between create and update. */
const productFields = {
  name: z.string().min(2).describe("The product's name."),
  price: z.number().min(0).describe("Selling price, in the store's currency."),
  description: z.string().optional().describe("The product description; simple HTML is allowed."),
  compareAtPrice: z.number().min(0).optional().describe("The earlier price, shown struck through next to price."),
  images: z
    .array(productImageField)
    .max(PRODUCT_MAX_IMAGES)
    .optional()
    .describe(`Images by URL, in order — the first is the primary image. At most ${PRODUCT_MAX_IMAGES}.`),
  options: z
    .array(productOptionField)
    .optional()
    .describe("Simple choices shown on the product, e.g. Size: S, M, L. For variants with their own price, stock or images, use store_product_update_section with section variants."),
  stock: z.number().int().min(0).nullable().optional().describe("Units in stock; null or omitted = stock is not tracked."),
  sku: z.string().optional().describe("The merchant's own article number."),
  slug: z.string().optional().describe("The product's URL slug, lower-case; made from the name when omitted."),
  sortOrder: z.number().int().min(0).optional().describe("Storefront position (see store_product_reorder)."),
};

const createStatusField = z
  .enum(PRODUCT_CREATE_STATUSES)
  .optional()
  .describe("active (default) puts it on the storefront at once; hidden keeps it off the storefront.");

const productUpdateFields = {
  ...z.object(productFields).partial().shape,
  compareAtPrice: z.number().min(0).nullable().optional().describe("The earlier price, shown struck through; null removes it."),
  status: z.enum(PRODUCT_STATUSES).optional().describe("draft, active (on the storefront) or hidden."),
};

const aiContentFields = {
  brief: z.string().min(10).describe("What the product is and who it is for, in the merchant's own words."),
  sectionKeys: z
    .array(z.string().min(1))
    .min(1)
    .describe(
      "The landing sections to write, by key — e.g. heroBanner, hero, description, highlights, features, useCases, specifications, faq. The product's current keys are in its landing data (store_product_get).",
    ),
  generateVariants: z.boolean().optional().describe("Also propose variant groups."),
  tone: z.string().optional().describe('The writing tone, e.g. "friendly" or "premium".'),
  language: z.string().optional().describe('The language to write in, e.g. "English" or "ar".'),
};

const tagEditableFields = {
  slug: z.string().optional().describe("The tag's URL slug, lower-case; made from the name when omitted."),
  description: z.string().optional(),
  status: z.enum(TAG_STATUSES).optional().describe("active or hidden."),
  autoRemoveAfterDays: z
    .number()
    .int()
    .min(1)
    .nullable()
    .optional()
    .describe("Days after which a product's assignment to this tag is removed automatically (e.g. a \"New\" tag); null = never."),
};

const SECTION_GUIDE = [
  "Writes one part (section) of a product; the other parts are untouched. section picks the part, data holds its fields:",
  'basicInformation: { name, sku (may be ""), description? }.',
  "media: { images: [{ url, _id?, source?, bucketFilePath? }] } — the full ordered list, first = primary; keep _id, source and bucketFilePath of existing images as store_product_get returns them.",
  "price: { price (null = no price), compareAtPrice? (null removes it) }.",
  "stock: { stock (null = not tracked), saleBuffer? (units held back from sale; null = the store's reserve, 0 = sell to the last unit), outOfStockBehavior?: inherit | showUnavailable | hide }.",
  "variants: { variantGroups: [{ name, type?: color | size | material | storage | custom, isRequired?, key?, values: [{ name, key?, colorHex? (required in a color group), images? (URLs), extraPrice?, stock?, isActive? }] }], variantStockGroups?: [{ valueKeys (one value key per group), sku?, stock?, isAvailable? }] } — omit variantStockGroups to keep the saved combinations.",
  "tags: { tagIds } — the product's whole tag list (ids from store_tag_search).",
  "seo: { seo: { title?, metaDescription?, ogImage? (URL), noIndex? }, slug? }.",
  "settings: { status?: draft | active | hidden, isFeatured?, minPerOrder?, maxPerOrder? (null = no limit), sortOrder? } — only the fields sent change.",
  "landing: { sectionOrder?: [section keys], sections?: { <key>: { isEnabled?, data? } } } — the product's landing page; store_product_generate_ai_content drafts it.",
  "shipping: { extraFeePerUnit? (delivery surcharge per unit; null clears it), note?, weight? (kg), length?, width?, height? (cm; null = not measured) }.",
  "purchase: { mode?: store | external | both, externalLinks?: [{ url, storeName?, price?, currency?, platform?: amazon | aliexpress | noon | ebay | etsy | custom, isActive? }] } — external and both need at least one link; external turns the cart off.",
  "In media, stock, variants, tags, seo, landing, shipping and purchase a field left out of data takes its default, so read the product with store_product_get first and resend what should stay. Returns the updated product.",
].join("\n");

export const STORE_CATALOG_TOOLS: IToolDefinition[] = [
  // ─── Products ─────────────────────────────────────────────────────────────
  defineTool({
    name: "store_product_search",
    toolset: "store-catalog",
    access: "read",
    title: "Search products",
    description:
      "A store's products with their price, stock, SKU and status. Filter by part of the name, slug, SKU, status, or tags (tag ids from store_tag_search). Pages with cursor.",
    input: z.object({
      storeId: idField(STORE_ID),
      name: z.string().optional().describe("Part of the product name, any case."),
      slug: z.string().optional(),
      sku: z.string().optional(),
      status: z.enum(PRODUCT_STATUSES).optional(),
      tagIds: z.array(z.string().min(1)).optional().describe("Only products carrying one of these tags."),
      excludeTagIds: z.array(z.string().min(1)).optional().describe("Leave out products carrying one of these tags."),
      ...cursorFields(),
    }),
    run: ({ storeId, ...filters }, { clients }) => clients.store.products.search(storeId, filters),
  }),
  defineTool({
    name: "store_product_get",
    toolset: "store-catalog",
    access: "read",
    title: "Get a product",
    description: "One product in full: details, images, variants and stock combinations, SEO, settings, landing page, shipping and purchase setup.",
    input: z.object({
      storeId: idField(STORE_ID),
      productId: idField(PRODUCT_ID),
    }),
    run: ({ storeId, productId }, { clients }) => clients.store.products.get(storeId, productId),
  }),
  defineTool({
    name: "store_product_estimate_ai_content",
    toolset: "store-catalog",
    access: "read",
    title: "Estimate AI product content",
    description:
      "What writing a product's landing sections with AI would cost, and whether the account can afford it — for the same arguments store_product_generate_ai_content takes. Does not charge and writes nothing.",
    input: z.object({
      storeId: idField(STORE_ID),
      productId: idField(PRODUCT_ID),
      ...aiContentFields,
    }),
    run: ({ storeId, productId, ...request }, { clients }) => clients.store.products.estimateAiContent(storeId, productId, request),
  }),
  defineTool({
    name: "store_product_create",
    toolset: "store-catalog",
    access: "write",
    title: "Create a product",
    description:
      "Creates one product from its name and price, plus any of description, images (by URL), stock, SKU and simple options. It is on the storefront at once unless status is hidden. Charged as one product addition (see account_get_operation_costs). Variants, SEO, landing page and purchase links are set afterwards with store_product_update_section.",
    input: z.object({
      storeId: idField(STORE_ID),
      ...productFields,
      status: createStatusField,
    }),
    run: ({ storeId, ...product }, { clients }) => clients.store.products.create(storeId, product),
    entity: (result) => ({ entityType: "storeProduct", entityId: result?._id }),
  }),
  defineTool({
    name: "store_product_create_draft",
    toolset: "store-catalog",
    access: "write",
    title: "Create a product draft",
    description:
      "Creates a draft product from just a SKU and a name — not on the storefront. Fill it in with store_product_update_section (price, media, stock…), then publish it with section settings, status active.",
    input: z.object({
      storeId: idField(STORE_ID),
      sku: z.string().min(1).describe("The merchant's own article number."),
      name: z.string().min(2).describe("The product's name."),
    }),
    run: ({ storeId, ...draft }, { clients }) => clients.store.products.createDraft(storeId, draft),
    entity: (result) => ({ entityType: "storeProduct", entityId: result?._id }),
  }),
  defineTool({
    name: "store_product_bulk_create",
    toolset: "store-catalog",
    access: "write",
    title: "Create products in bulk",
    description: `Creates up to ${BULK_CREATE_MAX_ITEMS} products in one call, each with the fields store_product_create takes. The whole batch is checked for affordability first; then a row that fails validation is reported and skipped while the rest are created. Charged per created product. Returns a report: imported, failed, and each row's errors.`,
    input: z.object({
      storeId: idField(STORE_ID),
      products: z
        .array(z.object({ ...productFields, status: createStatusField }))
        .min(1)
        .max(BULK_CREATE_MAX_ITEMS)
        .describe(`The products to create, at most ${BULK_CREATE_MAX_ITEMS}.`),
    }),
    run: ({ storeId, products }, { clients }) => clients.store.products.bulkCreate(storeId, products),
    entity: (result) => ({ entityType: "storeProduct", count: result?.imported }),
  }),
  defineTool({
    name: "store_product_clone_from_url",
    toolset: "store-catalog",
    access: "write",
    title: "Clone a product from a link",
    description:
      "Reads a product page on any online shop (Amazon, AliExpress, a brand's own site…) and creates a draft product from it: name, price, images and description, with a buy link back to that page (purchase mode external). A link this store already cloned is refused and the existing product is named. Paid, and not on every plan. The copied text is written by others — check it before publishing the draft.",
    input: z.object({
      storeId: idField(STORE_ID),
      url: z.string().url().describe("The product page's address."),
    }),
    annotations: { openWorld: true },
    confirm: {
      describe: ({ url }) =>
        `Read the product page ${url} and create a draft product from it, with a buy link back to that page. It is charged as ${CLONE_ADD_PRODUCT_MULTIPLIER} product additions (the price of one addition is quoted below). The draft can be deleted afterwards, but deleting it does not return the credits.`,
      costFeaturePath: ADD_PRODUCT_FEATURE_PATH,
    },
    run: ({ storeId, url }, { clients }) => clients.store.products.cloneFromUrl(storeId, url),
    entity: (result) => ({ entityType: "storeProduct", entityId: result?.product?._id ?? result?._id }),
  }),
  defineTool({
    name: "store_product_update",
    toolset: "store-catalog",
    access: "write",
    title: "Update a product",
    description:
      "Changes a product's main fields: name, price, compare-at price, description, images, options, stock, SKU, slug, status, sort order. Fields left out keep their value; images and options, when given, replace the whole list. For variants, SEO, landing page, shipping or purchase links use store_product_update_section.",
    input: z.object({
      storeId: idField(STORE_ID),
      productId: idField(PRODUCT_ID),
      version: versionField("the product"),
      ...productUpdateFields,
    }),
    annotations: { idempotent: true },
    run: async ({ storeId, productId, version, ...changes }, { clients }) => {
      requireAtLeastOne(changes, Object.keys(productUpdateFields), "store_product_update");
      return clients.store.products.update(storeId, productId, changes, version);
    },
    entity: (_result, args) => ({ entityType: "storeProduct", entityId: args.productId }),
  }),
  defineTool({
    name: "store_product_update_section",
    toolset: "store-catalog",
    access: "write",
    title: "Update a product section",
    description: SECTION_GUIDE,
    input: z.object({
      storeId: idField(STORE_ID),
      productId: idField(PRODUCT_ID),
      version: versionField("the product"),
      section: z.enum(PRODUCT_SECTIONS).describe("Which part of the product to write."),
      data: z.record(z.string(), z.unknown()).describe("The section's fields, as the tool description lists them for that section."),
    }),
    annotations: { idempotent: true },
    run: ({ storeId, productId, version, section, data }, { clients }) => saveProductSection(clients.store.products, storeId, productId, section, data, version),
    entity: (_result, args) => ({ entityType: "storeProduct", entityId: args.productId }),
  }),
  defineTool({
    name: "store_product_reorder",
    toolset: "store-catalog",
    access: "write",
    title: "Reorder products",
    description: `Sets the storefront display position (sortOrder) of up to ${PRODUCT_REORDER_MAX_ITEMS} products at once. Products not listed keep theirs.`,
    input: z.object({
      storeId: idField(STORE_ID),
      items: z
        .array(
          z.object({
            _id: idField(PRODUCT_ID),
            sortOrder: z.number().int().min(0).describe("The product's new position."),
          }),
        )
        .min(1)
        .max(PRODUCT_REORDER_MAX_ITEMS),
    }),
    annotations: { idempotent: true },
    run: ({ storeId, items }, { clients }) => clients.store.products.reorder(storeId, items),
    entity: (_result, args) => ({ entityType: "storeProduct", count: args.items.length }),
  }),
  defineTool({
    name: "store_product_generate_ai_content",
    toolset: "store-catalog",
    access: "write",
    title: "Write product content with AI",
    description:
      "Writes the chosen landing sections of a product (and, if asked, variant groups) with AI from a short brief. Paid, on the tokens used and never above the estimate (store_product_estimate_ai_content gives it). The result is an unsaved draft: show it to the user, then save it with store_product_update_section (section landing, or variants).",
    input: z.object({
      storeId: idField(STORE_ID),
      productId: idField(PRODUCT_ID),
      ...aiContentFields,
    }),
    confirm: {
      describe: async ({ storeId, productId, ...request }, { clients }) => {
        const [product, estimate] = await Promise.all([
          clients.store.products.get(storeId, productId),
          clients.store.products.estimateAiContent(storeId, productId, request),
        ]);
        return {
          action: `Write the landing sections ${request.sectionKeys.join(", ")}${request.generateVariants ? " and variant groups" : ""} for "${product.name}" with AI. Credits are charged on actual use, at most the estimate in details, and the charge stays even if the draft is discarded. The text comes back as a draft: nothing on the product changes until it is saved.`,
          details: estimate,
        };
      },
      costFeaturePath: AI_PRODUCT_CONTENT_FEATURE_PATH,
    },
    run: ({ storeId, productId, ...request }, { clients }) => clients.store.products.generateAiContent(storeId, productId, request),
    entity: (_result, args) => ({ entityType: "storeProduct", entityId: args.productId }),
  }),
  defineTool({
    name: "store_product_delete",
    toolset: "store-catalog",
    access: "full",
    title: "Delete a product",
    description: "Deletes a product: it leaves the catalogue and the storefront at once. Past orders keep their own copy of it. Cannot be undone.",
    input: z.object({
      storeId: idField(STORE_ID),
      productId: idField(PRODUCT_ID),
      version: versionField("the product"),
    }),
    annotations: { destructive: true, idempotent: true },
    confirm: {
      describe: async ({ storeId, productId }, { clients }) => {
        const product = await clients.store.products.get(storeId, productId);
        return `Delete the product "${product.name}"${product.sku ? ` (SKU ${product.sku})` : ""}, now ${product.status}. It leaves the catalogue and the storefront at once; past orders keep their copy. This cannot be undone.`;
      },
    },
    run: async ({ storeId, productId, version }, { clients }) => {
      await clients.store.products.delete(storeId, productId, version);
      return { deleted: true, productId };
    },
    entity: (_result, args) => ({ entityType: "storeProduct", entityId: args.productId }),
  }),

  // ─── Tags ─────────────────────────────────────────────────────────────────
  defineTool({
    name: "store_tag_search",
    toolset: "store-catalog",
    access: "read",
    title: "Search tags",
    description:
      "A store's catalogue tags with their product counts. Filter by part of the name, slug, status, whether they remove assignments automatically, or creation date (fromDate and toDate together). Pages with cursor.",
    input: z.object({
      storeId: idField(STORE_ID),
      name: z.string().optional().describe("Part of the tag name."),
      slug: z.string().optional(),
      status: z.enum(TAG_STATUSES).optional(),
      hasAutoRemoval: z.boolean().optional().describe("true: only tags that remove assignments after some days; false: only tags that never do."),
      fromDate: dateField("Created on or after, YYYY-MM-DD; with toDate.").optional(),
      toDate: dateField("Created on or before, YYYY-MM-DD; with fromDate.").optional(),
      ...cursorFields(),
    }),
    run: ({ storeId, ...filters }, { clients }) => clients.store.tags.search(storeId, filters),
  }),
  defineTool({
    name: "store_tag_get",
    toolset: "store-catalog",
    access: "read",
    title: "Get a tag",
    description: "One tag: name, slug, description, status, automatic-removal period and product count.",
    input: z.object({
      storeId: idField(STORE_ID),
      tagId: idField(TAG_ID),
    }),
    run: ({ storeId, tagId }, { clients }) => clients.store.tags.get(storeId, tagId),
  }),
  defineTool({
    name: "store_tag_resolve_products",
    toolset: "store-catalog",
    access: "read",
    title: "Products for tags",
    description:
      "The products carrying any of the given tags, without duplicates — what a tag-driven storefront section shows. No paging: limit caps the count.",
    input: z.object({
      storeId: idField(STORE_ID),
      tagIds: z.array(idField(TAG_ID)).min(1).describe("Tag ids, from store_tag_search."),
      limit: z.number().int().min(1).max(TAG_RESOLVE_MAX_LIMIT).optional().describe(`Most products to return, at most ${TAG_RESOLVE_MAX_LIMIT}. Default 12.`),
    }),
    run: ({ storeId, ...params }, { clients }) => clients.store.tags.resolveProducts(storeId, params),
  }),
  defineTool({
    name: "store_tag_list_products",
    toolset: "store-catalog",
    access: "read",
    title: "List a tag's products",
    description: "The products assigned to one tag, optionally narrowed by part of the product name. Pages with cursor.",
    input: z.object({
      storeId: idField(STORE_ID),
      tagId: idField(TAG_ID),
      search: z.string().optional().describe("Part of the product name."),
      ...cursorFields(),
    }),
    run: ({ storeId, tagId, ...filters }, { clients }) => clients.store.tags.listProducts(storeId, tagId, filters),
  }),
  defineTool({
    name: "store_tag_get_product_tags",
    toolset: "store-catalog",
    access: "read",
    title: "Get a product's tags",
    description: "The tags one product carries.",
    input: z.object({
      storeId: idField(STORE_ID),
      productId: idField(PRODUCT_ID),
    }),
    run: ({ storeId, productId }, { clients }) => clients.store.tags.getProductTags(storeId, productId),
  }),
  defineTool({
    name: "store_tag_create",
    toolset: "store-catalog",
    access: "write",
    title: "Create a tag",
    description: "Creates a catalogue tag for grouping products (e.g. New, Sale, Summer). Free. Add products to it with store_tag_assign_products.",
    input: z.object({
      storeId: idField(STORE_ID),
      name: z.string().min(1).describe("The tag's name."),
      ...tagEditableFields,
    }),
    run: ({ storeId, ...tag }, { clients }) => clients.store.tags.create(storeId, tag),
    entity: (result) => ({ entityType: "storeTag", entityId: result?._id }),
  }),
  defineTool({
    name: "store_tag_update",
    toolset: "store-catalog",
    access: "write",
    title: "Update a tag",
    description: "Changes a tag's name, slug, description, status or automatic-removal period. Fields left out keep their value.",
    input: z.object({
      storeId: idField(STORE_ID),
      tagId: idField(TAG_ID),
      version: versionField("the tag"),
      name: z.string().min(1).optional().describe("The tag's new name."),
      ...tagEditableFields,
    }),
    annotations: { idempotent: true },
    run: async ({ storeId, tagId, version, ...changes }, { clients }) => {
      requireAtLeastOne(changes, ["name", ...Object.keys(tagEditableFields)], "store_tag_update");
      return clients.store.tags.update(storeId, tagId, changes, version);
    },
    entity: (_result, args) => ({ entityType: "storeTag", entityId: args.tagId }),
  }),
  defineTool({
    name: "store_tag_assign_products",
    toolset: "store-catalog",
    access: "write",
    title: "Add products to a tag",
    description: `Adds up to ${TAG_ASSIGN_MAX_PRODUCTS} products to a tag. Products that already carry it are left alone; their other tags are untouched.`,
    input: z.object({
      storeId: idField(STORE_ID),
      tagId: idField(TAG_ID),
      productIds: z.array(idField(PRODUCT_ID)).min(1).max(TAG_ASSIGN_MAX_PRODUCTS).describe("Product ids, from store_product_search."),
    }),
    annotations: { idempotent: true },
    run: ({ storeId, tagId, productIds }, { clients }) => clients.store.tags.assignProducts(storeId, tagId, productIds),
    entity: (_result, args) => ({ entityType: "storeTag", entityId: args.tagId }),
  }),
  defineTool({
    name: "store_tag_unassign_product",
    toolset: "store-catalog",
    access: "write",
    title: "Remove a product from a tag",
    description: "Takes one product off one tag. The product and the tag both stay; add it back with store_tag_assign_products.",
    input: z.object({
      storeId: idField(STORE_ID),
      tagId: idField(TAG_ID),
      productId: idField(PRODUCT_ID),
    }),
    annotations: { idempotent: true },
    run: ({ storeId, tagId, productId }, { clients }) => clients.store.tags.unassignProduct(storeId, tagId, productId),
    entity: (_result, args) => ({ entityType: "storeTag", entityId: args.tagId }),
  }),
  defineTool({
    name: "store_tag_set_product_tags",
    toolset: "store-catalog",
    access: "write",
    title: "Set a product's tags",
    description: `Replaces one product's whole tag list (at most ${PRODUCT_MAX_TAGS}): tags left out are taken off it. An empty list removes every tag. Read the current list with store_tag_get_product_tags first.`,
    input: z.object({
      storeId: idField(STORE_ID),
      productId: idField(PRODUCT_ID),
      version: versionField("the product (its tag list is part of the product)"),
      tagIds: z.array(idField(TAG_ID)).max(PRODUCT_MAX_TAGS).describe("The product's complete tag list, ids from store_tag_search."),
    }),
    annotations: { idempotent: true },
    run: ({ storeId, productId, version, tagIds }, { clients }) => clients.store.tags.setProductTags(storeId, productId, tagIds, version),
    entity: (_result, args) => ({ entityType: "storeProduct", entityId: args.productId }),
  }),
  defineTool({
    name: "store_tag_delete",
    toolset: "store-catalog",
    access: "full",
    title: "Delete a tag",
    description: "Deletes a tag and takes it off every product that carries it. The products themselves stay. Cannot be undone.",
    input: z.object({
      storeId: idField(STORE_ID),
      tagId: idField(TAG_ID),
      version: versionField("the tag"),
    }),
    annotations: { destructive: true, idempotent: true },
    confirm: {
      describe: async ({ storeId, tagId }, { clients }) => {
        const tag = await clients.store.tags.get(storeId, tagId);
        const carried = tag.productsCount !== undefined ? ` It is on ${tag.productsCount} products, which lose it; the products themselves stay.` : " Every product carrying it loses it; the products themselves stay.";
        return `Delete the tag "${tag.name}".${carried} This cannot be undone.`;
      },
    },
    run: async ({ storeId, tagId, version }, { clients }) => {
      await clients.store.tags.delete(storeId, tagId, version);
      return { deleted: true, tagId };
    },
    entity: (_result, args) => ({ entityType: "storeTag", entityId: args.tagId }),
  }),
];
