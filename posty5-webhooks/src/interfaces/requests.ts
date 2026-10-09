import type { WebhookEventType } from "./events";

/** Narrow events to specific links or QR codes (all of the caller's when omitted). */
export interface IWebhookEndpointTargets {
  shortLinkIds?: string[];
  qrCodeIds?: string[];
}

/** How events are delivered: one request per event, or batched every `windowSeconds`. */
export interface IWebhookDeliveryOptions {
  mode: "each" | "batch";
  windowSeconds?: 60 | 300 | 3600;
}

/** Body of `WebhookEndpointClient.create`. */
export interface ICreateWebhookEndpointRequest {
  /** HTTPS only; port 443 or 1024-65535; no credentials in the URL. */
  url: string;
  description?: string;
  events: WebhookEventType[];
  targets?: IWebhookEndpointTargets;
  /** Deliver bot visits too (default false). */
  includeBots?: boolean;
  /** Up to 10 positive values for the `*_milestone` events. */
  milestones?: number[];
  delivery?: IWebhookDeliveryOptions;
}

/** Body of `WebhookEndpointClient.update`: any create field, plus `enabled`. */
export interface IUpdateWebhookEndpointRequest extends Partial<ICreateWebhookEndpointRequest> {
  enabled?: boolean;
}

/** Query of `WebhookEndpointClient.listDeliveries`. */
export interface IListWebhookDeliveriesParams {
  status?: "pending" | "succeeded" | "failed" | "abandoned";
  eventType?: string;
}
