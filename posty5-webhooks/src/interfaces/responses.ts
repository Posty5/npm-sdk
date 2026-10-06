import type { IWebhookDeliveryOptions, IWebhookEndpointTargets } from "./requests";
import type { WebhookEventType } from "./events";

/** A registered webhook endpoint. The secret itself is never returned after creation. */
export interface IWebhookEndpoint {
  _id: string;
  userId: string;
  apiKeyId?: string;
  url: string;
  description?: string;
  events: WebhookEventType[];
  targets?: IWebhookEndpointTargets;
  includeBots: boolean;
  milestones?: number[];
  delivery: IWebhookDeliveryOptions;
  enabled: boolean;
  disabledReason?: "consecutiveFailures" | "gone" | "user" | "planDowngrade" | null;
  failureCount: number;
  /** Events dropped by the daily or pending caps. */
  droppedEvents?: number;
  lastDeliveryAt?: string;
  lastSuccessAt?: string;
  /** `whsec_` + the secret's last characters, to tell secrets apart. */
  secretHint: string;
  createdFrom: string;
  createdAt: string;
  updatedAt: string;
}

/** Answer of `create`: the endpoint and its signing secret, shown this once. */
export interface ICreateWebhookEndpointResponse {
  endpoint: IWebhookEndpoint;
  secret: string;
}

/** Answer of `rotateSecret`: the new secret, shown this once. The old one keeps signing for 24 h. */
export interface IRotateWebhookSecretResponse {
  secret: string;
}

/** One delivery attempt chain of an event to an endpoint. */
export interface IWebhookDelivery {
  _id: string;
  endpointId: string;
  userId?: string;
  eventId: string;
  eventType: string;
  /** The `webhook-id` header; stable across retries and redeliveries. */
  messageId?: string;
  payload?: unknown;
  attempt: number;
  status: "pending" | "succeeded" | "failed" | "abandoned";
  responseStatus?: number;
  /** At most 1 KB of the receiver's answer. */
  responseSnippet?: string;
  durationMs?: number;
  error?: string;
  nextAttemptAt?: string | null;
  /** Set on a redelivery: the delivery it repeats. */
  redeliveryOf?: string;
  createdAt: string;
  updatedAt?: string;
}

/** One entry of the event catalogue. */
export interface IWebhookEventTypeInfo {
  type: WebhookEventType | string;
  description?: string;
  /** i18n key of `description`. */
  descriptionKey?: string;
  /** True for the `*_milestone` events (they need `milestones` on the endpoint). */
  isMilestone?: boolean;
  /** Plan feature gating the event, if any. */
  gate?: string | null;
  /** Whether the caller's plan allows subscribing. */
  allowed?: boolean;
  samplePayload?: unknown;
}
