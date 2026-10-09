# Changelog

## 5.0.0

Optimistic concurrency. Released in lockstep with every `@posty5/*` package
that writes (all at 5.0.0). Needs the API's versioned-writes release.

### Breaking changes

- **Versioned writes.** Every update, delete and state-change method takes the document's version (`__v`) as a required argument and sends it as `If-Match: "<v>"` (bulk methods send a `versions` map). Omitting it is a compile error in TypeScript and a `TypeError` at runtime.
- **New return types.** Methods that returned `void`, a boolean or a rebuilt subset now return the server's result with `__v` set to the new version (at least `{ _id, __v }`). Deletes still return nothing: no successor document exists.
- **Two typed errors** (from `@posty5/core`): `ConflictError` (409 `VERSION_CONFLICT`, carries `currentVersion` and `resourceId`) and `VersionRequiredError` (428 `VERSION_REQUIRED`). Any other 409 stays a generic `Posty5Error`.
- **No automatic retry** of a versioned write (any request carrying `If-Match`), nor of a 409 or 428: a lost response retried with the old version would report a false conflict. The caller decides.
- Every entity model declares `__v: number`.
- In this package: products: `update`, `delete`, `patchSection` (now public) and every section method (`updateBasicInformation` ... `updatePurchase`) take `version` last; tags: `update`, `delete`, `setProductTags(storeId, productId, tagIds, productVersion)`; orders: `updateStatus(storeId, orderId, status, version, note?)` (and the facade's `updateOrderStatus`); shipping: `updateCountry`, `deleteCountry`, `upsertRoute` (0 for a place with no route yet), `clearRoute`, `updateProfile`, `deleteProfile`, `savePlacePrices(..., countryVersion)`, `updateParcelPrice` (now returns `{ _id, __v }`), `removeParcelPrice`; suppliers: `replaceCredentials`, `updateSettings`, `updateAutomation`, `setEnabled`, `disconnect(storeId, id, version, options?)`, `updateLink`, `deleteLink`, `retry(storeId, supplierOrderId, version, options?)`, `pay`, `cancel`, `fulfilGroupManually(..., orderVersion)`.

### Migration

```ts
const product = await store.products.get(storeId, productId);
const saved = await store.products.updatePrice(storeId, productId, { price: 10 }, product.__v);
await store.products.updateStock(storeId, productId, { stock: 5 }, saved.__v);
```

## 4.4.0

- **`store.stores` / `listStores(term?)`** — the stores the key can manage (owned or staffed), from `GET /api/store/lookup`; each `_id` is the `storeId` every other method takes.
- `orders.create` tags the order with the client's `createdFrom` when the API accepts it for orders (`STORE_ORDER_CREATED_FROM_VALUES`, now including `"mcp"`), otherwise `"npmPackage"`.
- Needs `@posty5/core` 4.3.0 or later.

### Shipping: package profiles follow the API's parcel-price model

The API (2026-09-25) made a profile one parcel size, priced per place, and
removed the bracket and assignment routes. The client follows it:

- **Added:** `shipping.getPlacePrices`, `savePlacePrices`, `listParcelPrices`,
  `updateParcelPrice`, `removeParcelPrice` (`/countries/:iso/parcel-prices`,
  `/parcel-prices`), and `importProfiles(storeId, type, file)`
  (`POST /profiles/import`, one profile per spreadsheet row).
- **Changed:** `createProfile` / `updateProfile` take exactly one size
  (`conditions: [condition]`); `IShippingProfile` carries `condition` and
  `pricing`; `deleteProfile` returns `{ removedPrices }` — it removes the
  profile's prices instead of refusing while they exist.
- **Removed** (their routes return 404): `addProfileConditions`,
  `removeProfileCondition`, `importProfileConditions`, `listAssignments`,
  `assignProfile`, `setDefaultAssignment`, `removeAssignment`, and the
  `IShippingAssignment*` / `IAssignShippingProfileInput` types except
  `IShippingAssignmentPlace`.

## 4.3.0

The first version published to npm. Earlier versions (up to 4.2.0) were never
published and are not tracked here.

### Added

- **`store.suppliers`** — `StoreSuppliersClient`, one method per dropshipping
  route under `/api/store-suppliers`: the supplier catalogue; connecting,
  configuring, testing and disconnecting a supplier (and `startOAuth` for
  suppliers connected by signing in); browsing, previewing and importing
  supplier products; product links and sync; the supplier-order queue and the
  part actions `submitGroup`, `retry`, `pay`, `cancel`, `fulfilGroupManually`.
  `listSupplierOrders` pages by cursor like every other list: it takes
  `IPaginationParams` (`cursor`, `pageSize` — default 25, max 100) plus the
  filters, and returns `IPaginated<IStoreSupplierOrder>`
  (`{ items, pagination }`). The page-number types `IPageNumberParams` and
  `IPagedItems` that an unpublished draft used for it are gone.
- **`isQueuedImport`** — tells a queued import (`jobId`) from an inline one.
- **Types** for suppliers, connections (no credential field anywhere),
  products, imports, links, supplier orders and order parts.
- **Orders**: `IStoreOrder.fulfilmentGroups`, `IStoreOrder.supplierOrders`,
  `IStoreOrderSummary.fulfilmentSummary`, and the `needsAttention` search filter.

### Changed

- The package is part of the npm workspace and the publish workflow, so
  `npm run build:all` builds it and a release tag publishes it.
