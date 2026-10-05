/**
 * store_product_update_section: one `data` object per product section, checked
 * against that section's shape here and saved through the matching SDK
 * `update<Section>` method. Each writer's `save` is typed from its schema, so a
 * schema that drifts from the SDK's input type fails the build.
 */
import { z } from "zod";
import type { IStoreProduct, StoreProductsClient } from "@posty5/store";
import {
  EXTERNAL_LINK_PLATFORMS,
  PRODUCT_IMAGE_SOURCES,
  PRODUCT_OUT_OF_STOCK_BEHAVIORS,
  PRODUCT_PURCHASE_MODES,
  PRODUCT_STATUSES,
  VARIANT_GROUP_TYPES,
} from "../config/store-catalog-enums.config";
import { PRODUCT_MAX_IMAGES, PRODUCT_MAX_TAGS } from "../config/store-catalog-limits.config";
import type { IProductSectionWriter, ProductSection } from "../interfaces/store-catalog.interface";
import { ToolInputError } from "./tool-input.error";

/** A whole number of units; `null` = not tracked. */
const trackedCount = () => z.number().int().min(0).nullable();

const productImage = z.object({
  _id: z.string().optional(),
  url: z.string().url(),
  source: z.enum(PRODUCT_IMAGE_SOURCES).optional(),
  bucketFilePath: z.string().optional(),
});

const variantValue = z.object({
  _id: z.string().optional(),
  key: z.string().optional(),
  name: z.string().min(1),
  colorHex: z.string().optional(),
  images: z.array(z.string().url()).optional(),
  extraPrice: z.number().optional(),
  stock: trackedCount().optional(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

const variantGroup = z.object({
  _id: z.string().optional(),
  key: z.string().optional(),
  name: z.string().min(1),
  type: z.enum(VARIANT_GROUP_TYPES).optional(),
  isRequired: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
  values: z.array(variantValue).min(1),
});

const variantStockGroup = z.object({
  _id: z.string().optional(),
  key: z.string().optional(),
  valueKeys: z.array(z.string()).min(1),
  sku: z.string().optional(),
  stock: trackedCount().optional(),
  isAvailable: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

const externalLink = z.object({
  _id: z.string().optional(),
  storeName: z.string().optional(),
  url: z.string().url(),
  price: z.number().min(0).nullable().optional(),
  currency: z.string().optional(),
  logoUrl: z.string().optional(),
  platform: z.enum(EXTERNAL_LINK_PLATFORMS).optional(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

/** A parcel measurement: positive, or `null` for "not measured". */
const measurement = () => z.number().positive().nullable().optional();

/** The `data` shape of each section, mirroring the SDK's `IProduct<Section>Input`. */
export const PRODUCT_SECTION_SCHEMAS = {
  basicInformation: z.object({
    name: z.string().min(1),
    sku: z.string(),
    description: z.string().optional(),
  }),
  media: z.object({
    images: z.array(productImage).max(PRODUCT_MAX_IMAGES),
  }),
  price: z.object({
    price: z.number().min(0).nullable(),
    compareAtPrice: z.number().min(0).nullable().optional(),
  }),
  stock: z.object({
    stock: trackedCount(),
    saleBuffer: trackedCount().optional(),
    outOfStockBehavior: z.enum(PRODUCT_OUT_OF_STOCK_BEHAVIORS).optional(),
  }),
  variants: z.object({
    variantGroups: z.array(variantGroup),
    variantStockGroups: z.array(variantStockGroup).optional(),
  }),
  tags: z.object({
    tagIds: z.array(z.string().min(1)).max(PRODUCT_MAX_TAGS),
  }),
  seo: z.object({
    seo: z.object({
      title: z.string().optional(),
      metaDescription: z.string().optional(),
      ogImage: z.string().optional(),
      noIndex: z.boolean().optional(),
    }),
    slug: z.string().optional(),
  }),
  settings: z.object({
    status: z.enum(PRODUCT_STATUSES).optional(),
    isFeatured: z.boolean().optional(),
    minPerOrder: z.number().int().min(1).nullable().optional(),
    maxPerOrder: z.number().int().min(1).nullable().optional(),
    sortOrder: z.number().int().min(0).optional(),
  }),
  landing: z.object({
    sectionOrder: z.array(z.string()).optional(),
    sections: z
      .record(
        z.string(),
        z.object({
          isEnabled: z.boolean().optional(),
          data: z.record(z.string(), z.unknown()).optional(),
        }),
      )
      .optional(),
  }),
  shipping: z.object({
    extraFeePerUnit: z.number().min(0).nullable().optional(),
    note: z.string().optional(),
    weight: measurement(),
    length: measurement(),
    width: measurement(),
    height: measurement(),
    packageProfileId: z.string().nullable().optional(),
    packageConditionKey: z.string().optional(),
  }),
  purchase: z.object({
    mode: z.enum(PRODUCT_PURCHASE_MODES).optional(),
    externalLinks: z.array(externalLink).optional(),
  }),
} satisfies Record<ProductSection, z.ZodType>;

type SectionData<K extends ProductSection> = z.output<(typeof PRODUCT_SECTION_SCHEMAS)[K]>;

/** A writer for section `K`, its `save` typed from that section's schema. */
function sectionWriter<K extends ProductSection>(
  section: K,
  save: (products: StoreProductsClient, storeId: string, productId: string, data: SectionData<K>) => Promise<IStoreProduct>,
): IProductSectionWriter {
  return {
    schema: PRODUCT_SECTION_SCHEMAS[section],
    save: (products, storeId, productId, data) => save(products, storeId, productId, data as SectionData<K>),
  };
}

/** Each section's SDK method. */
export const PRODUCT_SECTION_WRITERS: Record<ProductSection, IProductSectionWriter> = {
  basicInformation: sectionWriter("basicInformation", (products, storeId, productId, data) => products.updateBasicInformation(storeId, productId, data)),
  media: sectionWriter("media", (products, storeId, productId, data) => products.updateMedia(storeId, productId, data)),
  price: sectionWriter("price", (products, storeId, productId, data) => products.updatePrice(storeId, productId, data)),
  stock: sectionWriter("stock", (products, storeId, productId, data) => products.updateStock(storeId, productId, data)),
  variants: sectionWriter("variants", (products, storeId, productId, data) => products.updateVariants(storeId, productId, data)),
  tags: sectionWriter("tags", (products, storeId, productId, data) => products.updateTags(storeId, productId, data)),
  seo: sectionWriter("seo", (products, storeId, productId, data) => products.updateSeo(storeId, productId, data)),
  settings: sectionWriter("settings", (products, storeId, productId, data) => products.updateSettings(storeId, productId, data)),
  landing: sectionWriter("landing", (products, storeId, productId, data) => products.updateLanding(storeId, productId, data)),
  shipping: sectionWriter("shipping", (products, storeId, productId, data) => products.updateShipping(storeId, productId, data)),
  purchase: sectionWriter("purchase", (products, storeId, productId, data) => products.updatePurchase(storeId, productId, data)),
};

/**
 * Checks `data` against `section`'s shape and saves it. A mismatch is a
 * `ToolInputError` listing every issue, and nothing is sent.
 */
export async function saveProductSection(
  products: StoreProductsClient,
  storeId: string,
  productId: string,
  section: ProductSection,
  data: unknown,
): Promise<IStoreProduct> {
  const writer = PRODUCT_SECTION_WRITERS[section];
  const parsed = writer.schema.safeParse(data);
  if (!parsed.success) throw new ToolInputError(`data does not fit section "${section}":\n${z.prettifyError(parsed.error)}`);
  return writer.save(products, storeId, productId, parsed.data);
}
