/**
 * Argument schemas the store-dropshipping tools share, and the reads and
 * wording their confirmation texts use. The confirmation reads are GETs only
 * and never fail the preview: a part or a balance that cannot be read is just
 * left out of the sentence.
 */
import { z } from "zod";
import type { IStoreSupplierOrder, ISupplierBalance, ISupplierImportPreview, StoreClient } from "@posty5/store";
import {
  SUPPLIER_IMPORT_PRODUCT_STATUSES,
  SUPPLIER_LINK_SYNC_FIELDS,
  SUPPLIER_PRICE_ROUNDINGS,
  SUPPLIER_PRICE_RULE_TYPES,
} from "../config/store-dropshipping-enums.config";
import { SUPPLIER_IMPORT_MAX_ITEMS } from "../config/store-dropshipping-limits.config";
import type { IOrderPartLookup } from "../interfaces/store-dropshipping.interface";

/** How a supplier cost becomes the store price. */
export function priceRuleSchema() {
  return z.object({
    type: z
      .enum(SUPPLIER_PRICE_RULE_TYPES)
      .describe("markupPercent: cost plus value percent; markupFixed: cost plus value; targetMargin: a price on which value percent is margin (below 100)."),
    value: z.number().min(0).describe("The percentage or amount the type applies."),
    rounding: z.enum(SUPPLIER_PRICE_ROUNDINGS).optional().describe('Default "none".'),
    includeFreightEstimate: z.boolean().optional().describe("Add the supplier's freight estimate to the product's extra delivery fee."),
  });
}

/** The import arguments `store_supplier_preview_import` and `store_supplier_import` share, so a preview and its import are the same call. */
export function supplierImportFields() {
  return {
    items: z
      .array(
        z.object({
          supplierProductId: z.string().min(1).describe("From store_supplier_browse_products or store_supplier_resolve_url."),
          supplierVariantIds: z
            .array(z.string().min(1))
            .optional()
            .describe("Only these variants, from store_supplier_get_product (variants[].supplierVariantId); omit for every variant."),
        }),
      )
      .min(1)
      .max(SUPPLIER_IMPORT_MAX_ITEMS)
      .describe(`Up to ${SUPPLIER_IMPORT_MAX_ITEMS} supplier products, each once.`),
    priceRule: priceRuleSchema().optional().describe("How to price them; omit for the store's own rule."),
    defaults: z
      .object({
        status: z.enum(SUPPLIER_IMPORT_PRODUCT_STATUSES).optional().describe("The status every imported product starts in."),
        tagIds: z.array(z.string().min(1)).optional().describe("Tag _ids, from store_tag_search."),
        tagNames: z.array(z.string().min(1)).optional().describe("Tags by name."),
      })
      .optional()
      .describe("What every imported product starts with."),
    allowDuplicate: z.boolean().optional().describe("Import a supplier product the store already has, as a second copy. Default false."),
  };
}

/** Which fields a product link's sync may overwrite on the store product. */
export function linkSyncSchema() {
  const fields = Object.fromEntries(SUPPLIER_LINK_SYNC_FIELDS.map((field) => [field, z.boolean().optional()]));
  return z.object(fields as Record<(typeof SUPPLIER_LINK_SYNC_FIELDS)[number], z.ZodOptional<z.ZodBoolean>>);
}

/** One sentence on an import preview: how many products, and the rows that would not import. */
export function summariseImportPreview(preview: ISupplierImportPreview, allowDuplicate: boolean | undefined): string {
  const failing = preview.rows.filter((row) => !!row.error).length;
  const duplicates = allowDuplicate ? 0 : preview.rows.filter((row) => !!row.duplicateOf).length;
  const notes = [
    failing ? `${failing} row(s) have an error and would not be imported.` : "",
    duplicates ? `${duplicates} product(s) are already in the store and would not be imported again.` : "",
  ].filter(Boolean);
  return [
    `Import ${preview.totals.products} product(s) from this supplier into the store as new products, each charged like adding a product (the batch's credits are in details.totals; the whole batch is refused if the credit balance cannot cover it).`,
    ...notes,
    "It is not undone as a batch: each imported product would have to be deleted on its own.",
  ].join(" ");
}

/** `amount currency` in the supplier's own currency (never converted), or undefined without an amount. */
export function formatSupplierAmount(amount: number | null | undefined, currency: string | undefined): string | undefined {
  if (amount === null || amount === undefined) return undefined;
  return currency ? `${amount} ${currency}` : `${amount}`;
}

/** What a supplier order costs the merchant: the payment amount when recorded, else the order's total cost. */
export function supplierOrderAmount(order: IStoreSupplierOrder): string | undefined {
  return formatSupplierAmount(order.payment?.amount ?? order.costs?.total, order.payment?.currency ?? order.costs?.currency);
}

/** "supplier order P5-123 at cjdropshipping (store order 1042, now needsReview)". */
export function supplierOrderLabel(order: IStoreSupplierOrder): string {
  return `supplier order ${order.supplierOrderNumber} at ${order.supplierKey} (store order ${order.orderNumber ?? order.orderId}, now ${order.status})`;
}

/** The order part `groupKey` of `orderId`, or undefined when it cannot be read (no `orders.view`, unknown order or part). */
export async function findOrderPart(store: StoreClient, storeId: string, orderId: string, groupKey: string): Promise<IOrderPartLookup | undefined> {
  try {
    const order = await store.orders.get(storeId, orderId);
    const part = order.fulfilmentGroups?.find((group) => group.key === groupKey);
    return part ? { orderNumber: order.orderNumber, part } : undefined;
  } catch {
    return undefined;
  }
}

/** "the CJ part of order 1042 (2 line(s), now pending)", or the raw ids when the part could not be read. */
export function orderPartLabel(lookup: IOrderPartLookup | undefined, orderId: string, groupKey: string): string {
  if (!lookup) return `part ${groupKey} of order ${orderId}`;
  const { part, orderNumber } = lookup;
  return `the ${part.supplierName ?? part.supplierKey ?? part.label} part of order ${orderNumber} (${part.lineKeys.length} line(s), now ${part.status})`;
}

/** The connection's balance at the supplier, or undefined where the supplier reports none. */
export async function findSupplierBalance(store: StoreClient, storeId: string, integrationId: string): Promise<ISupplierBalance | undefined> {
  try {
    return await store.suppliers.getBalance(storeId, integrationId);
  } catch {
    return undefined;
  }
}
