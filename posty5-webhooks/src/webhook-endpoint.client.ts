import { HttpClient, IPaginationParams, IPaginationResponse } from "@posty5/core";
import { WEBHOOK_ENDPOINTS_PATH } from "./config";
import type {
  ICreateWebhookEndpointRequest,
  ICreateWebhookEndpointResponse,
  IListWebhookDeliveriesParams,
  IRotateWebhookSecretResponse,
  IUpdateWebhookEndpointRequest,
  IWebhookDelivery,
  IWebhookEndpoint,
  IWebhookEventTypeInfo,
} from "./interfaces";

/**
 * Manage the caller's webhook endpoints (`/api/webhook-endpoints`): register
 * HTTPS URLs for visit, scan and milestone events, rotate secrets, send a
 * test, and inspect or redeliver deliveries.
 */
export class WebhookEndpointClient {
  private http: HttpClient;
  private basePath = WEBHOOK_ENDPOINTS_PATH;

  constructor(http: HttpClient) {
    this.http = http;
  }

  /** The caller's endpoints, paginated. */
  async list(pagination?: IPaginationParams): Promise<IPaginationResponse<IWebhookEndpoint>> {
    const response = await this.http.get<IPaginationResponse<IWebhookEndpoint>>(this.basePath, { params: { ...pagination } });
    return response.result!;
  }

  /** One endpoint. */
  async get(id: string): Promise<IWebhookEndpoint> {
    const response = await this.http.get<IWebhookEndpoint>(`${this.basePath}/${id}`);
    return response.result!;
  }

  /**
   * Register an endpoint. Each subscribed event's plan gate is checked (403
   * when the plan lacks it). The answer carries the signing `secret`: store
   * it now, it is never returned again.
   */
  async create(data: ICreateWebhookEndpointRequest): Promise<ICreateWebhookEndpointResponse> {
    const response = await this.http.post<ICreateWebhookEndpointResponse>(this.basePath, {
      ...data,
      createdFrom: this.http.createdFrom,
    });
    return response.result!;
  }

  /** Change an endpoint; the plan gates are re-checked. */
  async update(id: string, data: IUpdateWebhookEndpointRequest): Promise<IWebhookEndpoint> {
    const response = await this.http.put<IWebhookEndpoint>(`${this.basePath}/${id}`, data);
    return response.result!;
  }

  /** Delete an endpoint; queued deliveries are abandoned. */
  async delete(id: string): Promise<void> {
    await this.http.delete(`${this.basePath}/${id}`);
  }

  /** Issue a new secret (answered once). The old one keeps signing alongside it for 24 h. */
  async rotateSecret(id: string): Promise<IRotateWebhookSecretResponse> {
    const response = await this.http.post<IRotateWebhookSecretResponse>(`${this.basePath}/${id}/rotate-secret`);
    return response.result!;
  }

  /** Send a `webhook.test` event; answers the delivery to poll. */
  async sendTest(id: string): Promise<IWebhookDelivery> {
    const response = await this.http.post<IWebhookDelivery>(`${this.basePath}/${id}/test`);
    return response.result!;
  }

  /** An endpoint's deliveries (kept 30 days), newest first. */
  async listDeliveries(
    id: string,
    params?: IListWebhookDeliveriesParams,
    pagination?: IPaginationParams,
  ): Promise<IPaginationResponse<IWebhookDelivery>> {
    const response = await this.http.get<IPaginationResponse<IWebhookDelivery>>(`${this.basePath}/${id}/deliveries`, {
      params: { ...params, ...pagination },
    });
    return response.result!;
  }

  /** Deliver a past delivery's payload again, as a new attempt chain. */
  async redeliver(id: string, deliveryId: string): Promise<IWebhookDelivery> {
    const response = await this.http.post<IWebhookDelivery>(`${this.basePath}/${id}/deliveries/${deliveryId}/redeliver`);
    return response.result!;
  }

  /** The event catalogue: every event type, its gate and a sample payload. */
  async listEventTypes(): Promise<IWebhookEventTypeInfo[]> {
    const response = await this.http.get<IWebhookEventTypeInfo[]>(`${this.basePath}/event-types`);
    return response.result!;
  }
}
