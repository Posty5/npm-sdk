# Changelog

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
