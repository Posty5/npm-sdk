/** Event types a webhook endpoint can subscribe to (`GET /api/webhook-endpoints/event-types` is the live list). */
export type WebhookEventType =
  | "short_link.visited"
  | "short_link.visits_milestone"
  | "qr_code.scanned"
  | "qr_code.scans_milestone"
  | "webhook.test";

/** The link or QR code an event is about. */
export interface IWebhookEventTarget {
  type: "shortLink" | "qrCode";
  id: string;
  code?: string;
  url?: string;
  name?: string;
  destinationUrl?: string;
  tag?: string | null;
  refId?: string | null;
}

/** One visit or scan. Never carries the IP, visitor hash, full referrer or user agent. */
export interface IWebhookVisit {
  at: string;
  channel: "link" | "qr";
  country?: string | null;
  deviceType?: string | null;
  os?: string | null;
  browser?: string | null;
  referrerHost?: string | null;
  language?: string | null;
  isBot: boolean;
  outcome?: string | null;
  ruleId?: string | null;
  variantId?: string | null;
  domainId?: string | null;
}

/** A visit counter reaching a configured value. */
export interface IWebhookMilestone {
  metric: "visits";
  value: number;
  reachedAt: string;
}

/** Fields every envelope shares. */
export interface IWebhookEnvelopeBase<TType extends string, TData> {
  /** `evt_…`; stable across retries of the same event. */
  id: string;
  type: TType;
  /** Payload version, e.g. `2026-10-01`. */
  apiVersion: string;
  createdAt: string;
  data: TData;
}

export type IShortLinkVisitedEvent = IWebhookEnvelopeBase<"short_link.visited", { target: IWebhookEventTarget; visit: IWebhookVisit }>;
export type IQrCodeScannedEvent = IWebhookEnvelopeBase<"qr_code.scanned", { target: IWebhookEventTarget; visit: IWebhookVisit }>;
export type IShortLinkVisitsMilestoneEvent = IWebhookEnvelopeBase<"short_link.visits_milestone", { target: IWebhookEventTarget; milestone: IWebhookMilestone }>;
export type IQrCodeScansMilestoneEvent = IWebhookEnvelopeBase<"qr_code.scans_milestone", { target: IWebhookEventTarget; milestone: IWebhookMilestone }>;
export type IWebhookTestEvent = IWebhookEnvelopeBase<"webhook.test", Record<string, unknown>>;

/** A single (non-batch) event. */
export type Posty5WebhookSingleEvent =
  | IShortLinkVisitedEvent
  | IQrCodeScannedEvent
  | IShortLinkVisitsMilestoneEvent
  | IQrCodeScansMilestoneEvent
  | IWebhookTestEvent;

/** Endpoints with `delivery.mode: "batch"` receive up to 500 events in one envelope. */
export type IWebhookBatchEvent = IWebhookEnvelopeBase<"batch", { events: Posty5WebhookSingleEvent[] }>;

/** Whatever `verifyWebhookSignature` returns: switch on `type`. */
export type Posty5WebhookEvent = Posty5WebhookSingleEvent | IWebhookBatchEvent;
