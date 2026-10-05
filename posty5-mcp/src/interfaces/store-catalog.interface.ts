import type { IStoreProduct, StoreProductsClient } from "@posty5/store";
import type { z } from "zod";
import type { PRODUCT_SECTIONS } from "../config/store-catalog-enums.config";

/** One of the product sections store_product_update_section writes. */
export type ProductSection = (typeof PRODUCT_SECTIONS)[number];

/** How one product section is checked and saved: the shape of its `data`, and the SDK `update<Section>` call. */
export interface IProductSectionWriter {
  schema: z.ZodType;
  save(products: StoreProductsClient, storeId: string, productId: string, data: unknown): Promise<IStoreProduct>;
}
