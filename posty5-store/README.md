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

A section is written whole — fields you leave out go back to their defaults
rather than keeping their saved values. Send the section as you want it to end
up.

#### Holding stock back

`saleBuffer` reserves units so a product reads as sold out before the shelf is
literally empty:

```ts
await store.products.updateStock(storeId, productId, {
  stock: 42,
  saleBuffer: 3,           // out of stock at 3 remaining, not 0
  outOfStockBehavior: "hide", // or "showUnavailable", or "inherit"
});
```

`null` and `0` are different answers, which is why `saleBuffer` is nullable:

| `saleBuffer` | Meaning |
| --- | --- |
| `null` (default) | Use the store's reserve. |
| `0` | Sell down to the last unit, *ignoring* the store's reserve. |
| `n` | Sold out at `n` remaining. |

A `0` that meant "unset" would silently re-apply the store's buffer, so the two
had to stay distinguishable.

`outOfStockBehavior` decides what a sold-out product looks like: `hide` takes it
off the listings, the product page, the design sections and the sitemap;
`showUnavailable` leaves it on the shelf marked unavailable; `inherit` (the
default) defers to the store's own setting.

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

### Package profiles - pricing by the size of the parcel

A **profile** is a set of brackets ("up to 1 kg", "up to 5 kg"); an
**assignment** attaches one to a place with a fee per bracket. At checkout the
cart is measured, and the first bracket the parcel fits sets the fee.

```ts
// A profile, then the brackets. A profile with no brackets is a legal first state.
const profile = await store.shipping.createProfile(storeId, { name: "By weight", type: "weight" });
await store.shipping.addProfileConditions(storeId, profile._id, [
  { label: "Up to 1 kg", maxWeight: 1, order: 0 },
  { label: "Up to 5 kg", maxWeight: 5, order: 1 },
]);

// Price it somewhere. Fees point at bracket keys.
await store.shipping.assignProfile(storeId, "eg", {
  level: "governorate",
  governorateCode: "C",
  profileId: profile._id,
  fees: [{ conditionKey: "cnd_a", fee: 30 }, { conditionKey: "cnd_b", fee: 55 }],
  isDefault: true,
});

// What applies at a place, and whether it is the place's own or inherited.
const view = await store.shipping.listAssignments(storeId, "eg", {
  level: "city",
  governorateCode: "C",
  cityKey: "cairo",
});
console.log(view.inheritedFrom, view.isInherited);
```

Products carry the parcel these brackets are matched against:

```ts
await store.products.updateShipping(storeId, productId, {
  weight: 2.5,                        // kg
  length: 30, width: 20, height: 15,  // cm
});
```

Four rules decide what a buyer is charged, and each is easy to get backwards:

- **Profiles answer before the flat chain.** Where no bracket matches, the flat
  country -> governorate -> city chain still answers, so profiles add to a
  store's setup rather than replacing it.
- **The most specific tier holding profiles owns the answer outright.** A city
  with its own profiles ignores the governorate's completely - even for a parcel
  none of its own brackets fit, in which case the cart falls to the flat rate
  rather than climbing back up. A merchant who prices a city separately means
  "this is what this city costs", not "add these to what the country said".
- **An unmeasured parcel fits nothing.** `null` on a product measurement means
  "not measured", and a limit the cart cannot be compared against is unanswered,
  not satisfied - otherwise one product with a forgotten weight would ship the
  whole cart at the cheapest bracket. On a *bracket limit* `null` means the
  opposite: no cap on that measurement.
- **The default profile wins over a cheaper one.** Two profiles at one place are
  alternatives ("by weight" or "by size"); naming a default is a decision, not a
  tie-break. Without one, the cheaper match is quoted.

An unpriced bracket (`fee: null`) is safe to save - a parcel landing in it falls
through to the flat chain rather than shipping free - and `unpricedCount` on the
assignment tells you how many are still waiting.

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
| `listProfiles(storeId, filters?)` | `GET /:storeId/profiles` |
| `getProfile(storeId, profileId)` | `GET /:storeId/profiles/:profileId` |
| `createProfile(storeId, input)` | `POST /:storeId/profiles` |
| `updateProfile(storeId, profileId, changes)` | `PUT /:storeId/profiles/:profileId` |
| `deleteProfile(storeId, profileId)` | `DELETE /:storeId/profiles/:profileId` |
| `addProfileConditions(storeId, profileId, conditions[])` | `POST /:storeId/profiles/:profileId/conditions` |
| `removeProfileCondition(storeId, profileId, conditionKey)` | `DELETE /:storeId/profiles/:profileId/conditions/:conditionKey` |
| `downloadProfileTemplate(storeId, type?)` | `GET /:storeId/profiles/template` |
| `importProfileConditions(storeId, profileId, file)` | `POST /:storeId/profiles/:profileId/conditions/import` |
| `listAssignments(storeId, iso, place)` | `GET /:storeId/countries/:iso/assignments` |
| `assignProfile(storeId, iso, input)` | `POST /:storeId/countries/:iso/assignments` |
| `setDefaultAssignment(storeId, assignmentId)` | `PUT /:storeId/assignments/:assignmentId/default` |
| `removeAssignment(storeId, assignmentId)` | `DELETE /:storeId/assignments/:assignmentId` |

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
