import { assertVersion, withVersion } from "@posty5/core";
import { BaseStoreClient } from "./base.client";
import {
  IBrowseSupplierProductsFilters,
  IConnectSupplierInput,
  ICreateSupplierLinkInput,
  IDisconnectSupplierResult,
  IImportSupplierProductsInput,
  IPaginated,
  IReplaceSupplierCredentialsInput,
  IStartSupplierOAuthInput,
  IStoreProductSupplierLink,
  IStoreSupplierCatalogue,
  IStoreSupplierIntegration,
  IStoreSupplierOrder,
  ISupplierAutomationInput,
  ISupplierBalance,
  ISupplierDisconnectImpact,
  ISupplierImportJobStatus,
  ISupplierImportPreview,
  ISupplierImportResult,
  ISupplierLinkSyncResult,
  ISupplierLinksFilters,
  ISupplierOAuthStartResult,
  ISupplierOrderActionResult,
  ISupplierOrderSearchFilters,
  ISupplierProduct,
  ISupplierProductPage,
  ISupplierTestResult,
  IUpdateSupplierLinkInput,
  IUpdateSupplierSettingsInput,
} from "../interfaces";

/**
 * Dropshipping — `/api/store-suppliers`: connect suppliers, import and link
 * their products, and act on the orders sent to them.
 *
 * Permissions (store staff keys): `suppliers.view` to read, `suppliers.manage`
 * to connect and configure, `suppliers.import` to browse, import and link,
 * `suppliers.orders.manage` to send, pay, retry, cancel or take over a part.
 * Paying a supplier spends the merchant's own supplier balance — treat a key
 * holding `suppliers.orders.manage` accordingly.
 *
 * Connecting, importing, sending and paying are refused when the store
 * owner's plan does not include dropshipping (Pro and above); reads, cancel
 * and fulfil-manually are not. Importing a product costs the same credits as
 * adding one; nothing else here is charged.
 *
 * **Paused outcomes are errors.** `submitGroup`, `retry` and `pay` answer a
 * pause (`needsReview`, `failed`, `skipped`, or a part already being sent) as
 * an HTTP failure whose details name the reason, so they throw the core
 * `ValidationError`. Read the supplier order again to see where it stands.
 */
export class StoreSuppliersClient extends BaseStoreClient {
  private base = "/api/store-suppliers";

  // ─── Catalogue and connections ────────────────────────────────────────────

  /** The suppliers this store can connect, with what each can do. `suppliers.view`. */
  async catalogue(storeId: string): Promise<IStoreSupplierCatalogue> {
    const res = await this.http.get<IStoreSupplierCatalogue>(`${this.base}/${storeId}/catalogue`);
    return res.result!;
  }

  /** The store's supplier connections. Credentials are never returned. `suppliers.view`. */
  async list(storeId: string): Promise<IStoreSupplierIntegration[]> {
    const res = await this.http.get<{ items: IStoreSupplierIntegration[] }>(`${this.base}/${storeId}`);
    return res.result!.items;
  }

  /**
   * Connect a supplier. Read `catalogue()` first: `credentials` keys come from
   * the entry's `credentialFields`. The key is checked with the supplier before
   * it is stored, encrypted. Starts in `test` mode unless `mode` says otherwise.
   * `suppliers.manage`, plan gate.
   */
  async connect(storeId: string, input: IConnectSupplierInput): Promise<IStoreSupplierIntegration> {
    const res = await this.http.post<IStoreSupplierIntegration>(`${this.base}/${storeId}`, input);
    return res.result!;
  }

  /**
   * Start connecting a supplier that uses sign-in instead of a key (AliExpress).
   * Send the merchant to `authorizeUrl`. `suppliers.manage`, plan gate.
   */
  async startOAuth(storeId: string, input: IStartSupplierOAuthInput): Promise<ISupplierOAuthStartResult> {
    const res = await this.http.post<ISupplierOAuthStartResult>(`${this.base}/${storeId}/oauth/start`, input);
    return res.result!;
  }

  /** Replace a connection's credentials. `suppliers.manage`, plan gate. */
  async replaceCredentials(storeId: string, id: string, input: IReplaceSupplierCredentialsInput, version: number): Promise<IStoreSupplierIntegration> {
    assertVersion(version);
    const res = await this.http.put<IStoreSupplierIntegration>(`${this.base}/${storeId}/${id}`, input, { version });
    return withVersion(res, id);
  }

  /** Change the supplier-specific settings (and optionally the mode). `suppliers.manage`. */
  async updateSettings(storeId: string, id: string, input: IUpdateSupplierSettingsInput, version: number): Promise<IStoreSupplierIntegration> {
    assertVersion(version);
    const res = await this.http.put<IStoreSupplierIntegration>(`${this.base}/${storeId}/${id}/settings`, input, { version });
    return withVersion(res, id);
  }

  /**
   * Change what the connection may do on its own. `submitAndPay` is refused
   * for a supplier that cannot be paid from a balance. `suppliers.manage`, plan gate.
   */
  async updateAutomation(storeId: string, id: string, automation: ISupplierAutomationInput, version: number): Promise<IStoreSupplierIntegration> {
    assertVersion(version);
    const res = await this.http.put<IStoreSupplierIntegration>(`${this.base}/${storeId}/${id}/automation`, automation, { version });
    return withVersion(res, id);
  }

  /** Switch the connection on or off. `suppliers.manage`, plan gate. */
  async setEnabled(storeId: string, id: string, enabled: boolean, version: number): Promise<IStoreSupplierIntegration> {
    assertVersion(version);
    const res = await this.http.put<IStoreSupplierIntegration>(`${this.base}/${storeId}/${id}/enabled`, { enabled }, { version });
    return withVersion(res, id);
  }

  /** Check the connection now and record its health. `suppliers.manage`. */
  async test(storeId: string, id: string): Promise<ISupplierTestResult> {
    const res = await this.http.post<ISupplierTestResult>(`${this.base}/${storeId}/${id}/test`, {});
    return res.result!;
  }

  /** The balance at the supplier, where the supplier reports one. `suppliers.view`. */
  async getBalance(storeId: string, id: string): Promise<ISupplierBalance> {
    const res = await this.http.get<ISupplierBalance>(`${this.base}/${storeId}/${id}/balance`);
    return res.result!;
  }

  /** What disconnecting would affect. `suppliers.view`. */
  async getDisconnectImpact(storeId: string, id: string): Promise<ISupplierDisconnectImpact> {
    const res = await this.http.get<ISupplierDisconnectImpact>(`${this.base}/${storeId}/${id}/impact`);
    return res.result!;
  }

  /**
   * Disconnect. Credentials are deleted; imported products stay as the store's
   * own. Refused while supplier orders are open unless `force`. `suppliers.manage`.
   */
  async disconnect(storeId: string, id: string, version: number, options: { force?: boolean } = {}): Promise<IDisconnectSupplierResult> {
    assertVersion(version);
    const res = await this.http.delete<IDisconnectSupplierResult>(`${this.base}/${storeId}/${id}`, { params: this.toQuery(options), version });
    return res.result!;
  }

  // ─── Supplier products and imports ────────────────────────────────────────

  /** Browse or search the supplier's catalogue. Paged by number. `suppliers.import`, plan gate. */
  async browseProducts(storeId: string, id: string, filters: IBrowseSupplierProductsFilters = {}): Promise<ISupplierProductPage> {
    const res = await this.http.get<ISupplierProductPage>(`${this.base}/${storeId}/${id}/products`, { params: this.toQuery(filters) });
    return res.result!;
  }

  /** One supplier product with its variants, costs and stock. `suppliers.import`, plan gate. */
  async getProduct(storeId: string, id: string, supplierProductId: string): Promise<ISupplierProduct> {
    const res = await this.http.get<ISupplierProduct>(`${this.base}/${storeId}/${id}/products/${encodeURIComponent(supplierProductId)}`);
    return res.result!;
  }

  /** Resolve a pasted product link to the supplier product. Short links are refused. `suppliers.import`, plan gate. */
  async resolveUrl(storeId: string, id: string, url: string): Promise<ISupplierProduct> {
    const res = await this.http.post<ISupplierProduct>(`${this.base}/${storeId}/${id}/products/resolve-url`, { url });
    return res.result!;
  }

  /** Price the chosen products and name duplicates. Nothing is created or charged. `suppliers.import`, plan gate. */
  async previewImport(storeId: string, id: string, input: IImportSupplierProductsInput): Promise<ISupplierImportPreview> {
    const res = await this.http.post<ISupplierImportPreview>(`${this.base}/${storeId}/${id}/import/preview`, input);
    return res.result!;
  }

  /**
   * Import up to 50 products. Small imports answer the rows; large ones answer
   * a job id — tell them apart with `isQueuedImport` and poll `getImportStatus`.
   * Charged like adding products; the whole batch is refused if the credits
   * cannot cover it. `suppliers.import`, plan gate.
   */
  async importProducts(storeId: string, id: string, input: IImportSupplierProductsInput): Promise<ISupplierImportResult> {
    const res = await this.http.post<ISupplierImportResult>(`${this.base}/${storeId}/${id}/import`, input);
    return res.result!;
  }

  /** A background import's progress, and its rows once completed. `suppliers.import`. */
  async getImportStatus(storeId: string, jobId: string): Promise<ISupplierImportJobStatus> {
    const res = await this.http.get<ISupplierImportJobStatus>(`${this.base}/${storeId}/imports/${encodeURIComponent(jobId)}`);
    return res.result!;
  }

  // ─── Product links ────────────────────────────────────────────────────────

  /** The store's product links. `suppliers.view`. */
  async listLinks(storeId: string, filters: ISupplierLinksFilters = {}): Promise<IStoreProductSupplierLink[]> {
    const res = await this.http.get<{ items: IStoreProductSupplierLink[] }>(`${this.base}/${storeId}/links`, { params: this.toQuery(filters) });
    return res.result!.items;
  }

  /**
   * Link a product the store already sells to a supplier product. Changes who
   * ships it; never its price, images or description. `suppliers.import`, plan gate.
   */
  async createLink(storeId: string, input: ICreateSupplierLinkInput): Promise<IStoreProductSupplierLink> {
    const res = await this.http.post<IStoreProductSupplierLink>(`${this.base}/${storeId}/links`, input);
    return res.result!;
  }

  /** Change a link's price rule, sync switches, estimate or disclosure. `suppliers.import`. */
  async updateLink(storeId: string, linkId: string, changes: IUpdateSupplierLinkInput, version: number): Promise<IStoreProductSupplierLink> {
    assertVersion(version);
    const res = await this.http.put<IStoreProductSupplierLink>(`${this.base}/${storeId}/links/${linkId}`, changes, { version });
    return withVersion(res, linkId);
  }

  /** Unlink. The product stays and becomes the store's own. `suppliers.import`. */
  async deleteLink(storeId: string, linkId: string, version: number): Promise<{ _id: string }> {
    assertVersion(version);
    const res = await this.http.delete<{ _id: string }>(`${this.base}/${storeId}/links/${linkId}`, { version });
    return res.result!;
  }

  /** Sync one link now. Refused within a minute of the last sync. `suppliers.import`. */
  async syncLink(storeId: string, linkId: string): Promise<ISupplierLinkSyncResult> {
    const res = await this.http.post<ISupplierLinkSyncResult>(`${this.base}/${storeId}/links/${linkId}/sync`, {});
    return res.result!;
  }

  // ─── Supplier orders ──────────────────────────────────────────────────────

  /**
   * Supplier orders, newest first, paged by cursor in the store's list
   * envelope (`{ items, pagination }`). Pass `pagination.nextCursor` back as
   * `cursor` while `pagination.hasMore` is true. `pageSize` defaults to 25,
   * max 100. `suppliers.view`.
   */
  async listSupplierOrders(storeId: string, filters: ISupplierOrderSearchFilters = {}): Promise<IPaginated<IStoreSupplierOrder>> {
    const res = await this.http.get<IPaginated<IStoreSupplierOrder>>(`${this.base}/${storeId}/orders`, { params: this.toQuery(filters) });
    return res.result!;
  }

  /**
   * One supplier order with its history. `destination` is present only for a
   * caller holding `orders.customerData.view`. `suppliers.view`.
   */
  async getSupplierOrder(storeId: string, supplierOrderId: string): Promise<IStoreSupplierOrder> {
    const res = await this.http.get<IStoreSupplierOrder>(`${this.base}/${storeId}/orders/${supplierOrderId}`);
    return res.result!;
  }

  /**
   * Send one part of an order to its supplier now. Calling it twice finds the
   * first supplier order rather than creating a second. `payNow` pays the
   * supplier even when the shopper has not paid — recorded with the caller.
   * `groupKey` is the part's `key` (e.g. `supplier:<integrationId>`).
   * `suppliers.orders.manage`, plan gate. Throws on a pause.
   */
  async submitGroup(storeId: string, orderId: string, groupKey: string, options: { payNow?: boolean } = {}): Promise<ISupplierOrderActionResult> {
    const res = await this.http.post<ISupplierOrderActionResult>(
      `${this.base}/${storeId}/orders/${orderId}/groups/${encodeURIComponent(groupKey)}/submit`,
      options,
    );
    return res.result!;
  }

  /**
   * Try a queued, paused or failed supplier order again. The pre-flight runs
   * again; a `needsReview` order usually needs something changed first.
   * `acceptCost` accepts the supplier's new price — recorded with the caller.
   * `suppliers.orders.manage`, plan gate. Throws on a pause.
   */
  async retry(storeId: string, supplierOrderId: string, version: number, options: { acceptCost?: boolean } = {}): Promise<ISupplierOrderActionResult> {
    assertVersion(version);
    const res = await this.http.post<ISupplierOrderActionResult>(`${this.base}/${storeId}/orders/${supplierOrderId}/retry`, options, { version });
    return withVersion(res, supplierOrderId);
  }

  /**
   * Pay a supplier order that was created but not paid. The supplier's own
   * status is read first, so an order already paid there is recorded, not
   * paid again. `suppliers.orders.manage`, plan gate. Throws on a pause.
   */
  async pay(storeId: string, supplierOrderId: string, version: number): Promise<ISupplierOrderActionResult> {
    assertVersion(version);
    const res = await this.http.post<ISupplierOrderActionResult>(`${this.base}/${storeId}/orders/${supplierOrderId}/pay`, {}, { version });
    return withVersion(res, supplierOrderId);
  }

  /**
   * Withdraw the order at the supplier, where the supplier still allows it.
   * Once shipped it cannot be withdrawn and the call throws. Open below Pro.
   * `suppliers.orders.manage`.
   */
  async cancel(storeId: string, supplierOrderId: string, version: number): Promise<ISupplierOrderActionResult> {
    assertVersion(version);
    const res = await this.http.post<ISupplierOrderActionResult>(`${this.base}/${storeId}/orders/${supplierOrderId}/cancel`, {}, { version });
    return withVersion(res, supplierOrderId);
  }

  /** Take a part over: the store ships it itself. Open below Pro. `suppliers.orders.manage`. */
  async fulfilGroupManually(storeId: string, orderId: string, groupKey: string, orderVersion: number): Promise<{ orderId: string }> {
    assertVersion(orderVersion, "orderVersion");
    const res = await this.http.post<{ orderId: string }>(
      `${this.base}/${storeId}/orders/${orderId}/groups/${encodeURIComponent(groupKey)}/fulfil-manually`,
      {}, { version: orderVersion });
    return res.result!;
  }
}
