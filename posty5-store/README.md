# @posty5/store

Online Store management SDK for the [Posty5](https://posty5.com) API — run a
store's **catalogue, orders, tags, customers and shipping** from anywhere.

## Install

```bash
npm install @posty5/store @posty5/core
```

## Authenticate

Create an [API key](https://studio.posty5.com) and pass it to `@posty5/core`'s
`HttpClient` (sent as the `X-API-Key` header). Every call is scoped to a store
id and authorized by the key owner's store permission — `products.manage` for
the catalogue and tags, `orders.*` for orders and customers, `settings.manage`
for shipping. A store's owner holds all of them.

> An API key carries the full identity of the user who created it; it is not
> scoped to a single store. Treat it as you would a password.

```ts
import { HttpClient } from "@posty5/core";
import { StoreClient } from "@posty5/store";

const http = new HttpClient({ apiKey: process.env.POSTY5_API_KEY });
const store = new StoreClient(http);
```

The client is split into five areas: `store.products`, `store.orders`,
`store.tags`, `store.customers` and `store.shipping`.

## Products

```ts
// Whole-document create.
const product = await store.products.create(storeId, {
  name: "Classic Tee",
  price: 20,
  stock: 100,
  sku: "TEE-001",
});

// Or up to 200 at a time — a row that fails validation is reported, not fatal.
const report = await store.products.bulkCreate(storeId, [
  { name: "Hoodie", price: 45, options: [{ name: "Size", values: ["S", "M", "L"] }] },
]);
console.log(report.imported, "created,", report.failed, "failed");

// Search, with tag filters and cursor pagination.
const { items } = await store.products.search(storeId, { status: "active", tagIds: [tagId] });
```

### Section updates

`create`/`update` take the whole document. The section methods write only the
part they name, so a stock-sync job and a merchant editing the description never
overwrite each other:

```ts
await store.products.updateStock(storeId, productId, { stock: 42 });
await store.products.updatePrice(storeId, productId, { price: 18, compareAtPrice: 25 });
await store.products.updateSeo(storeId, productId, {
  seo: { title: "Classic Tee", metaDescription: "100% cotton" },
  slug: "classic-tee",
});
```

Sections: `updateBasicInformation`, `updateMedia`, `updatePrice`, `updateStock`,
`updateVariants`, `updateTags`, `updateSeo`, `updateSettings`, `updateLanding`,
`updateShipping`, `updatePurchase`.

### Clone, import, AI

```ts
// Paste a link from any storefront → a draft with an external buy link.
const draft = await store.products.cloneFromUrl(storeId, "https://example.com/p/123");

// Excel round-trip.
const template = await store.products.downloadImportTemplate(storeId);
await store.products.importFromExcel(storeId, { fileBase64, fileName: "products.xlsx" });

// Price a landing-page generation, then run it. The result is an UNSAVED draft.
const keys = ["hero", "features"];
const estimate = await store.products.estimateAiContent(storeId, productId, {
  brief: "A soft cotton tee for summer",
  sectionKeys: keys,
});
const draftContent = await store.products.generateAiContent(storeId, productId, {
  brief: "A soft cotton tee for summer",
  sectionKeys: keys,
});
await store.products.updateLanding(storeId, productId, draftContent as any);
```

## Orders

```ts
const { items, pagination } = await store.orders.search(storeId, {
  status: "pending",
  orderSource: "facebook",
  fromDate: "2026-07-01",
  pageSize: 50,
});

// Record an order received off-store (tagged createdFrom: "npmPackage").
const order = await store.orders.create(storeId, {
  items: [{ productId, qty: 2, options: { Size: "M" } }],
  customer: {
    name: "Sara",
    phone: "0100000000",
    address: "12 Nile St",
    // City names repeat across governorates, so send the pair.
    countryIso: "eg",
    governorateCode: "C",
    cityKey: "cairo",
  },
  orderSource: "facebook",
});

await store.orders.updateStatus(storeId, order._id, "confirmed", "Called the customer");
await store.orders.addInternalNote(storeId, order._id, "Customer asked for evening delivery");

const stats = await store.orders.statistics(storeId, { days: 30 });
const workbook = await store.orders.exportToExcel(storeId, { status: "delivered" });
```

The status workflow is enforced server-side: `pending → confirmed → processing →
shipped → delivered`, with `cancelled`/`refused` reachable from any non-terminal
state and the three terminal states accepting nothing further.

## Tags

```ts
const tag = await store.tags.create(storeId, { name: "Summer", autoRemoveAfterDays: 90 });
await store.tags.assignProducts(storeId, tag._id, [productId]);
await store.tags.setProductTags(storeId, productId, [tag._id]);
const summer = await store.tags.resolveProducts(storeId, { tagIds: [tag._id], limit: 12 });
```

## Customers

Read-only — a customer record is derived from orders and, when the shopper has a
Posty5 account, owned by them.

```ts
const { items } = await store.customers.search(storeId, { text: "sara", hasAccount: true });
const profile = await store.customers.get(storeId, customerId);
const theirOrders = await store.customers.orders(storeId, customerId);
```

## Shipping

The model is **country → governorate → city**, and a fee falls through those in
order before landing on the store default. `null` at any level means "not set
here — inherit"; an explicit `0` is free delivery and stops the fallback.

The world's countries, governorates and cities are **reference data** and are
never stored on a store. A store owns one document per open country, plus one
**route** row per place it prices or blocks differently — everywhere it said
nothing simply has no row.

```ts
// Opening a country prices everything inside it. No rows are written yet.
await store.shipping.addCountry(storeId, { iso: "eg", defaultFee: 50 });

// The picker behind "add a country" — the world minus what you already opened.
const catalogue = await store.shipping.listCountryCatalogue(storeId, { text: "eg" });

// Governorates are catalogue reference data, not your rows.
const { items: govs } = await store.shipping.listGovernorates(storeId, "eg");

// Every place with what it charges today, and where that price came from.
const routes = await store.shipping.listRoutes(storeId, "eg", { level: "city", governorateCode: "C" });
routes.items.forEach((r) => console.log(r.cityName, r.effectiveFee, r.inheritedFrom));

// Price or block one place, or up to 200 at once.
await store.shipping.upsertRoute(storeId, "eg", { level: "city", governorateCode: "C", cityKey: "cairo", fee: 30 });
await store.shipping.bulkUpsertRoutes(storeId, "eg", [
  { level: "governorate", governorateCode: "ALX", isAllowed: false },
]);

// One fee for a whole scope. Sending the fee they already inherit CLEARS the
// rows instead of writing them — uniformity is "no rows" in this model.
const { written, cleared } = await store.shipping.applyFee(storeId, "eg", { level: "city", fee: 40 });

// Put one place back on what it inherits.
await store.shipping.clearRoute(storeId, rateId);

// What would this destination be charged? Same resolution checkout uses.
const quote = await store.shipping.previewFee(storeId, {
  countryIso: "eg",
  governorateCode: "C",
  cityKey: "cairo",
});
```

A route that ends up saying nothing — no fee **and** delivery allowed — is
removed rather than stored, so `upsertRoute` answers `{ cleared: true, rate: null }`.
That is not an error: it is the state "no row" already represents.

Per-product surcharges are separate, and always charged **per unit**:

```ts
await store.products.updateShipping(storeId, productId, { extraFeePerUnit: 5, note: "Bulky" });
```

## API

### `store.products` — `/api/store-products`

| Method | Endpoint |
| --- | --- |
| `search(storeId, filters?)` | `GET /:storeId` |
| `get(storeId, productId)` | `GET /:storeId/:id` |
| `getLandingSectionsConfig()` | `GET /config/landing-sections` |
| `create(storeId, product)` | `POST /:storeId` |
| `bulkCreate(storeId, products[])` | `POST /:storeId/bulk` |
| `createDraft(storeId, draft)` | `POST /:storeId/draft` |
| `cloneFromUrl(storeId, url)` | `POST /:storeId/clone` |
| `downloadImportTemplate(storeId)` | `GET /:storeId/import/template` |
| `importFromExcel(storeId, file)` | `POST /:storeId/import` |
| `update(storeId, productId, changes)` | `PUT /:storeId/:id` |
| `delete(storeId, productId)` | `DELETE /:storeId/:id` |
| `reorder(storeId, items[])` | `PUT /:storeId/reorder` |
| `updateBasicInformation(…)` | `PATCH /:storeId/:id/basic-information` |
| `updateMedia(…)` | `PATCH /:storeId/:id/media` |
| `updatePrice(…)` | `PATCH /:storeId/:id/price` |
| `updateStock(…)` | `PATCH /:storeId/:id/stock` |
| `updateVariants(…)` | `PATCH /:storeId/:id/variants` |
| `updateTags(…)` | `PATCH /:storeId/:id/tags` |
| `updateSeo(…)` | `PATCH /:storeId/:id/seo` |
| `updateSettings(…)` | `PATCH /:storeId/:id/settings` |
| `updateLanding(…)` | `PATCH /:storeId/:id/landing` |
| `updateShipping(…)` | `PATCH /:storeId/:id/shipping` |
| `updatePurchase(…)` | `PATCH /:storeId/:id/purchase` |
| `createImageUploadUrl(…)` | `POST /:storeId/:id/image-upload-url` |
| `estimateAiContent(…)` | `POST /:storeId/:id/ai/estimate` |
| `generateAiContent(…)` | `POST /:storeId/:id/ai/generate` |

### `store.orders` — `/api/store-orders`

| Method | Endpoint |
| --- | --- |
| `search(storeId, filters?)` | `GET /:storeId` |
| `get(storeId, orderId)` | `GET /:storeId/:id` |
| `statistics(storeId, filters?)` | `GET /:storeId/statistics` |
| `printData(storeId, filters?)` | `GET /:storeId/print` |
| `exportToExcel(storeId, filters?)` | `GET /:storeId/export` |
| `create(storeId, order)` | `POST /:storeId` |
| `updateStatus(storeId, id, status, note?)` | `POST /:storeId/:id/status` |
| `addInternalNote(storeId, id, note)` | `POST /:storeId/:id/notes` |

### `store.tags` — `/api/store-tags`

| Method | Endpoint |
| --- | --- |
| `search(storeId, filters?)` | `GET /:storeId` |
| `get(storeId, tagId)` | `GET /:storeId/:id` |
| `create(storeId, tag)` | `POST /:storeId` |
| `update(storeId, tagId, changes)` | `PUT /:storeId/:id` |
| `delete(storeId, tagId)` | `DELETE /:storeId/:id` |
| `resolveProducts(storeId, params)` | `GET /:storeId/resolve` |
| `listProducts(storeId, tagId, filters?)` | `GET /:storeId/:id/products` |
| `assignProducts(storeId, tagId, productIds[])` | `POST /:storeId/:id/products` |
| `unassignProduct(storeId, tagId, productId)` | `DELETE /:storeId/:id/products/:productId` |
| `getProductTags(storeId, productId)` | `GET /:storeId/product/:productId` |
| `setProductTags(storeId, productId, tagIds[])` | `PUT /:storeId/product/:productId` |
| `downloadImportTemplate(storeId)` | `GET /:storeId/import/template` |
| `importFromExcel(storeId, file)` | `POST /:storeId/import` |
| `exportToExcel(storeId, filters?)` | `GET /:storeId/export` |

### `store.customers` — `/api/store-customers`

| Method | Endpoint |
| --- | --- |
| `search(storeId, filters?)` | `GET /:storeId` |
| `get(storeId, customerId)` | `GET /:storeId/:customerId` |
| `addresses(storeId, customerId)` | `GET /:storeId/:customerId/addresses` |
| `orders(storeId, customerId, pagination?)` | `GET /:storeId/:customerId/orders` |

### `store.shipping` — `/api/store-shipping`

| Method | Endpoint |
| --- | --- |
| `listCountries(storeId, filters?)` | `GET /:storeId/countries` |
| `listCountryCatalogue(storeId, filters?)` | `GET /:storeId/countries/catalogue` |
| `getCountry(storeId, iso)` | `GET /:storeId/countries/:iso` |
| `addCountry(storeId, input)` | `POST /:storeId/countries` |
| `updateCountry(storeId, iso, changes)` | `PUT /:storeId/countries/:iso` |
| `deleteCountry(storeId, iso)` | `DELETE /:storeId/countries/:iso` |
| `listGovernorates(storeId, iso)` | `GET /:storeId/countries/:iso/governorates` |
| `listRoutes(storeId, iso, filters?)` | `GET /:storeId/countries/:iso/routes` |
| `upsertRoute(storeId, iso, input)` | `POST /:storeId/countries/:iso/routes` |
| `bulkUpsertRoutes(storeId, iso, items[])` | `POST /:storeId/countries/:iso/routes/bulk` |
| `applyFee(storeId, iso, input)` | `POST /:storeId/countries/:iso/routes/apply-fee` |
| `clearRoute(storeId, rateId)` | `DELETE /:storeId/routes/:rateId` |
| `previewFee(storeId, params)` | `GET /:storeId/preview-fee` |

### Shorthands

`bulkCreateProducts`, `searchOrders`, `createOrder` and `updateOrderStatus`
remain on `StoreClient` itself and delegate to the sub-clients.

## Pagination

Lists page by opaque cursor, not by page number, so a list stays stable while
rows are written underneath it:

```ts
let cursor: string | undefined;
do {
  const page = await store.orders.search(storeId, { cursor, pageSize: 100 });
  handle(page.items);
  cursor = page.pagination.nextCursor ?? undefined;
} while (cursor);
```

## File downloads

`downloadImportTemplate`, `exportToExcel` and friends answer with the file
itself rather than the JSON envelope, so they return
`{ data: ArrayBuffer, contentType, fileName }`:

```ts
import { writeFile } from "node:fs/promises";

const file = await store.orders.exportToExcel(storeId, { status: "delivered" });
await writeFile(file.fileName ?? "orders.xlsx", Buffer.from(file.data));
```

## Credits

Product, order and store operations (`addProduct`, `manualOrder`,
`orderStatusChange`, `exportOrders`, AI generation) are charged to the store
owner per the account's plan; see `GET /api/plans/operation-costs`. Tag
operations are free and unmetered.

## License

MIT
