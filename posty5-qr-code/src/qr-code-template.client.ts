import { HttpClient, IPaginationParams, IPaginationResponse } from "@posty5/core";
import { IPublicQRCodeTemplateLookupParams, IQRCodeTemplateLookupItem, IQRCodeTemplateLookupParams } from "./interfaces";

/**
 * QR code templates, read-only — `/api/qr-code-template`. Where the
 * `templateId` every QR create method takes comes from. Designing a template
 * stays in the Posty5 dashboard.
 */
export class QRCodeTemplateClient {
  private http: HttpClient;
  private readonly basePath = "/api/qr-code-template";

  constructor(http: HttpClient) {
    this.http = http;
  }

  /** Your own templates. */
  async listUserTemplates(params?: IQRCodeTemplateLookupParams, pagination?: IPaginationParams): Promise<IPaginationResponse<IQRCodeTemplateLookupItem>> {
    const response = await this.http.get<IPaginationResponse<IQRCodeTemplateLookupItem>>(`${this.basePath}/user-lookup`, {
      params: { ...params, ...pagination },
    });
    return response.result!;
  }

  /** Posty5's public templates — no API key needed. */
  async listPublicTemplates(params?: IPublicQRCodeTemplateLookupParams, pagination?: IPaginationParams): Promise<IPaginationResponse<IQRCodeTemplateLookupItem>> {
    const response = await this.http.get<IPaginationResponse<IQRCodeTemplateLookupItem>>(`${this.basePath}/public-lookup`, {
      params: { ...params, ...pagination },
    });
    return response.result!;
  }
}
