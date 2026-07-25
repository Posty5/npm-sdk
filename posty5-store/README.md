# @posty5/store

Online Store management SDK for the [Posty5](https://posty5.com) API — manage a
store's **products** and **orders** programmatically.

## Install

```bash
npm install @posty5/store @posty5/core
```

## Authenticate

Create an [API key](https://studio.posty5.com) and pass it to `@posty5/core`'s
`HttpClient` (sent as the `X-API-Key` header). The key's owner must have the
matching store permission.

```ts
import { HttpClient } from "@posty5/core";
import { StoreClient } from "@posty5/store";

const http = new HttpClient({ apiKey: process.env.POSTY5_API_KEY });
const store = new StoreClient(http);
```

## Products

```ts
// Bulk-create products (charges `addProduct` per created row).
const report = await store.bulkCreateProducts(storeId, [
  { name: "Classic Tee", price: 20, stock: 100, sku: "TEE-001" },
  { name: "Hoodie", price: 45, options: [{ name: "Size", values: ["S", "M", "L"] }] },
]);
console.log(report.imported, "created,", report.failed, "failed");
```

## Orders

```ts
// Search with filters + cursor pagination.
const { items, pagination } = await store.searchOrders(storeId, {
  status: "pending",
  orderSource: "facebook",
  fromDate: "2026-07-01",
  pageSize: 50,
});

// Create an order manually (tagged createdFrom: "npmPackage").
const order = await store.createOrder(storeId, {
  items: [{ productId, qty: 2, options: { Size: "M" } }],
  customer: { name: "Sara", phone: "0100000000", address: "Cairo" },
  orderSource: "facebook",
});

// Change status (respects the store's status workflow).
await store.updateOrderStatus(storeId, order._id, "confirmed", "Called the customer");
```

## API

| Method | Endpoint |
| --- | --- |
| `bulkCreateProducts(storeId, products[])` | `POST /api/store-products/:storeId/bulk` |
| `searchOrders(storeId, filters?)` | `GET /api/store-orders/:storeId` |
| `createOrder(storeId, order)` | `POST /api/store-orders/:storeId` |
| `updateOrderStatus(storeId, id, status, note?)` | `POST /api/store-orders/:storeId/:id/status` |

Credit costs (`addProduct`, `manualOrder`, `orderStatusChange`) are charged to
the store owner per the account's plan; see `GET /api/plans/operation-costs`.

## License

MIT
