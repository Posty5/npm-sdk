/** ─── Dropshipping: suppliers, connections, products, links ─────────────────
 *
 * Transcribed from the api (`store-supplier/type.ts`, the suppliers module's
 * DTOs). No interface here has a credential field: credentials are write-only
 * and no route ever returns them.
 */

export type StoreFulfilmentKind = "merchant" | "thirdParty";
export type StoreSupplierMode = "test" | "live";
export type StoreSupplierAutomationMode = "manual" | "submit" | "submitAndPay";
export type StoreSupplierConnectionMethod = "manual" | "oauth";
export type StoreSupplierCategory = "general" | "printOnDemand" | "regional";
export type StoreDropshippingContractModel = "standard" | "promiseToSell";
export type StoreSupplierPriceRuleType = "markupPercent" | "markupFixed" | "targetMargin";
export type StoreSupplierPriceRounding = "none" | "nearest" | "endsIn99" | "endsIn95";
export type StoreSupplierLinkSyncField = "stock" | "cost" | "price" | "images" | "description";
export type StoreSupplierIntegrationAuditAction =
  | "connected"
  | "credentialsReplaced"
  | "modeChanged"
  | "enabled"
  | "disabled"
  | "automationChanged"
  | "settingsChanged"
  | "tested"
  | "disconnected";

/** What a supplier can do, as the catalogue declares it. */
export interface IStoreSupplierCapabilities {
  browseCatalogue: boolean;
  productByUrl: boolean;
  productById: boolean;
  stock: boolean;
  freightQuote: boolean;
  createOrder: boolean;
  payFromBalance: boolean;
  /** Creating the order pays for it (BigBuy): there is no separate pay step. */
  payOnCreate: boolean;
  /** Payment is finished on the supplier's own site through a link. */
  manualPaymentUrl: boolean;
  balance: boolean;
  cancelOrder: boolean;
  tracking: boolean;
  webhooks: boolean;
  artwork: boolean;
}

/** A field the supplier asks for when connecting. Read these before calling `connect`. */
export interface IStoreSupplierCredentialField {
  key: string;
  label: string;
  secret: boolean;
  optional?: boolean;
}

/** A non-secret, supplier-specific setting. */
export interface IStoreSupplierSettingsField {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
  hint?: string;
}

/** One supplier this build can connect, with this store's verdict on it. */
export interface IStoreSupplierCatalogueEntry {
  key: string;
  name: string;
  category: StoreSupplierCategory;
  /** Warehouse countries. */
  countries: string[];
  /** Countries it delivers to; empty means not restricted. */
  destinationCountries: string[];
  connectionMethods: StoreSupplierConnectionMethod[];
  credentialFields: IStoreSupplierCredentialField[];
  settingsFields: IStoreSupplierSettingsField[];
  capabilities: IStoreSupplierCapabilities;
  /** A `test` connection can place orders that are never charged or shipped. */
  sandbox: boolean;
  /** False until a real order has moved through this supplier end to end. */
  verified: boolean;
  logo?: string;
  docsUrl?: string;
  /** False when Posty5 switched it off or this build lacks it — `unavailableReason` says which. */
  available: boolean;
  unavailableReason?: string;
  /** A hint, never a filter: whether it delivers to any country this store ships to. */
  servesStoreCountries: boolean;
}

/** `GET /api/store-suppliers/:storeId/catalogue`. */
export interface IStoreSupplierCatalogue {
  items: IStoreSupplierCatalogueEntry[];
  /** False when the server cannot encrypt credentials yet — connecting would be refused. */
  credentialsStorageReady: boolean;
}

/** What a connection may do on its own. */
export interface IStoreSupplierAutomation {
  mode: StoreSupplierAutomationMode;
  /** Send cash-on-delivery and manual orders too. Off by default. */
  allowUnpaidOrders: boolean;
  /** The most one order may cost at the supplier. */
  maxCostPerOrder?: number | null;
  /** The most the supplier cost may be, as a fraction of what the shopper paid (0.7 = 70%). */
  maxCostRatio?: number | null;
  /** ISO-2 countries orders may be sent to; empty means any. */
  allowedCountries: string[];
}

export interface IStoreSupplierHealth {
  checkedAt: string;
  ok: boolean;
  message?: string;
  lastSuccessAt?: string;
}

export interface IStoreSupplierAuditEntry {
  action: StoreSupplierIntegrationAuditAction;
  byUserId?: string;
  at: string;
  note?: string;
}

/** A supplier connection. Credentials are never returned — only whether they are stored. */
export interface IStoreSupplierIntegration {
  _id: string;
  /** Document version: pass it to versioned writes (`update`, `delete`, ...). */
  __v: number;
  supplierKey: string;
  connectionMethod: StoreSupplierConnectionMethod;
  mode: StoreSupplierMode;
  enabled: boolean;
  settings?: Record<string, unknown>;
  automation: IStoreSupplierAutomation;
  account?: { name?: string; currency?: string } | null;
  health?: IStoreSupplierHealth;
  hasCredentials: boolean;
  /** Paused after repeated errors, until `circuitOpenUntil`. */
  isCircuitOpen: boolean;
  circuitOpenUntil?: string;
  lastWebhookAt?: string | null;
  audit: IStoreSupplierAuditEntry[];
  /** Where the supplier's notifications are sent. Empty when no public origin is configured. */
  webhookUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Connecting a supplier. `credentials` keys come from the catalogue entry's
 * `credentialFields` (for example `{ apiKey }`) — they differ per supplier.
 */
export interface IConnectSupplierInput {
  supplierKey: string;
  /** Defaults to `test`. */
  mode?: StoreSupplierMode;
  credentials: Record<string, string>;
  settings?: Record<string, string | number | boolean>;
}

export interface IReplaceSupplierCredentialsInput {
  credentials: Record<string, string>;
  mode?: StoreSupplierMode;
}

export interface IUpdateSupplierSettingsInput {
  settings: Record<string, string | number | boolean>;
  mode?: StoreSupplierMode;
}

/** At least one field. */
export type ISupplierAutomationInput = Partial<IStoreSupplierAutomation>;

/** `POST /:storeId/:id/test`. */
export interface ISupplierTestResult {
  ok: boolean;
  message?: string;
  account?: { name?: string; currency?: string };
}

/** The balance at the supplier, in the supplier's currency — never converted. */
export interface ISupplierBalance {
  amount: number;
  currency: string;
}

/** What disconnecting would touch — read before disconnecting. */
export interface ISupplierDisconnectImpact {
  linkedProducts: number;
  openSupplierOrders: number;
}

export interface IDisconnectSupplierResult extends ISupplierDisconnectImpact {
  _id: string;
}

/** `POST /:storeId/oauth/start` — for suppliers connected by signing in (AliExpress). */
export interface IStartSupplierOAuthInput {
  supplierKey: string;
  /** Defaults to `live`. */
  mode?: StoreSupplierMode;
  /** Where the merchant lands afterwards; must be one of the platform's own origins. */
  returnUrl?: string;
}

export interface ISupplierOAuthStartResult {
  /** Send the merchant here to sign in at the supplier. */
  authorizeUrl: string;
  expiresAt: string;
}

// ─── Supplier products ──────────────────────────────────────────────────────

export interface IDeliveryEstimate {
  minDays: number;
  maxDays: number;
  countryIso?: string;
}

export interface ISupplierVariant {
  supplierVariantId: string;
  sku?: string;
  name?: string;
  /** Option name → value, e.g. `{ Color: "Red", Size: "M" }`. */
  options: Record<string, string>;
  /** What one unit costs at the supplier, in `currency`. */
  cost: number;
  currency: string;
  stock?: number | null;
  weightGrams?: number | null;
  imageUrl?: string;
}

/** One product as the supplier describes it. `description` is untrusted HTML. */
export interface ISupplierProduct {
  supplierProductId: string;
  name: string;
  description?: string;
  images: string[];
  categoryPath: string[];
  variants: ISupplierVariant[];
  shipsFromCountries: string[];
  deliveryEstimate?: IDeliveryEstimate | null;
  url?: string;
  /** The store product already imported from it, if any. */
  alreadyImported?: string | null;
}

export interface ISupplierProductSummary {
  supplierProductId: string;
  name: string;
  image?: string;
  costMin?: number;
  costMax?: number;
  currency?: string;
  variantCount?: number;
  categoryPath?: string[];
  url?: string;
  /** The store product already imported from it, if any. */
  alreadyImported?: string | null;
}

export interface IBrowseSupplierProductsFilters {
  q?: string;
  categoryId?: string;
  page?: number;
  pageSize?: number;
}

/** A page of the supplier's catalogue — paged by number, not by cursor. */
export interface ISupplierProductPage {
  items: ISupplierProductSummary[];
  page: number;
  pageSize: number;
  total?: number;
  /** A mirrored catalogue (BigBuy) that is still being copied, or is out of date. */
  catalogueState?: "warming" | "stale";
}

// ─── Importing ──────────────────────────────────────────────────────────────

export interface ISupplierPriceRule {
  type: StoreSupplierPriceRuleType;
  value: number;
  rounding?: StoreSupplierPriceRounding;
  /** Add the supplier's freight estimate to the product's extra delivery fee. */
  includeFreightEstimate?: boolean;
}

export interface IImportSupplierProductsInput {
  /** Up to 50 products, each once. Omit `supplierVariantIds` to take every variant. */
  items: { supplierProductId: string; supplierVariantIds?: string[] }[];
  /** Defaults to the store's rule. */
  priceRule?: ISupplierPriceRule;
  defaults?: { status?: "draft" | "active" | "hidden"; tagIds?: string[]; tagNames?: string[] };
  /** Import a supplier product the store already has, as a second copy. */
  allowDuplicate?: boolean;
}

export interface ISupplierImportPreviewRow {
  supplierProductId: string;
  name: string;
  image?: string;
  variantCount: number;
  costMin: number | null;
  costMax: number | null;
  priceMin: number | null;
  priceMax: number | null;
  currency: string;
  /** Set when this supplier product is already imported. */
  duplicateOf?: { productId: string; name: string } | null;
  warnings: string[];
  error?: string;
}

export interface ISupplierImportPreview {
  rows: ISupplierImportPreviewRow[];
  totals: { products: number; creditsPerProduct: number; credits: number };
}

export type SupplierImportRowState = "added" | "failed" | "skipped" | "duplicate";

export interface ISupplierImportRow {
  supplierProductId: string;
  state: SupplierImportRowState;
  productId?: string;
  name?: string;
  warnings: string[];
  message?: string;
}

/** Imported inline: the rows are here. */
export interface ISupplierImportReport {
  jobId: null;
  rows: ISupplierImportRow[];
}

/** Too large to run inline: poll `getImportStatus(jobId)`. */
export interface IQueuedSupplierImport {
  jobId: string;
  rows: null;
}

export type ISupplierImportResult = ISupplierImportReport | IQueuedSupplierImport;

export interface ISupplierImportJobStatus {
  jobId: string;
  state: string;
  progress: number;
  /** Present once `state` is `completed`. */
  rows: ISupplierImportRow[] | null;
}

// ─── Product links ──────────────────────────────────────────────────────────

export interface IStoreProductSupplierLinkVariant {
  combinationKey?: string | null;
  valueKeys: string[];
  supplierVariantId: string;
  supplierSku?: string | null;
  cost: number;
  currency: string;
  stock?: number | null;
  /** The supplier stopped offering it; stock is held at zero, never deleted. */
  unavailable?: boolean;
  lastSyncedAt?: string | null;
}

/** A store product and the supplier product it is fulfilled from. */
export interface IStoreProductSupplierLink {
  _id: string;
  /** Document version: pass it to versioned writes (`update`, `delete`, ...). */
  __v: number;
  productId: string;
  integrationId: string;
  supplierKey: string;
  supplierProductId: string;
  supplierProductUrl?: string | null;
  variants: IStoreProductSupplierLinkVariant[];
  priceRule: Required<ISupplierPriceRule>;
  /** What the hourly sync may overwrite. */
  sync: Record<StoreSupplierLinkSyncField, boolean>;
  deliveryEstimate?: IDeliveryEstimate | null;
  lastSyncAt?: string | null;
  lastSyncError?: string | null;
  warnings: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ISupplierLinksFilters {
  productId?: string;
}

export interface ICreateSupplierLinkInput {
  productId: string;
  integrationId: string;
  supplierProductId: string;
  /** Each store variant (`combinationKey`, null for a product without variants) mapped to a supplier variant. */
  variants: { combinationKey?: string | null; supplierVariantId: string }[];
  /** Pull cost and stock straight away. Defaults to true. */
  syncNow?: boolean;
}

/** At least one field. */
export interface IUpdateSupplierLinkInput {
  priceRule?: ISupplierPriceRule;
  sync?: Partial<Record<StoreSupplierLinkSyncField, boolean>>;
  deliveryEstimate?: { minDays: number; maxDays: number } | null;
  disclosure?: { enabled?: boolean; label?: string | null };
  /** Reprice the product with the new rule now. A rule change alone never reprices. */
  applyPriceRuleNow?: boolean;
}

export interface ISupplierLinkSyncResult {
  link: IStoreProductSupplierLink;
  /** The fields that changed, e.g. `["stock", "cost"]`. Empty when already up to date. */
  changed: string[];
}
