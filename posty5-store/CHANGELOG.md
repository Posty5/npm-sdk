# Changelog

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
