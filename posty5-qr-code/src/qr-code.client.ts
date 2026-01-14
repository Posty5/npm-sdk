import { HttpClient, IPaginationParams, IPaginationResponse } from "@posty5/core";
import {
  ICreateQRCodeResponse,
  IUpdateQRCodeResponse,
  IGetQRCodeResponse,
  IDeleteQRCodeResponse,
  // ISearchQRCodesResponse,
  ILookupQRCodesResponse,
  IListParams,
  ICreateFreeTextQRCodeRequest,
  ICreateEmailQRCodeRequest,
  ICreateWifiQRCodeRequest,
  ICreateCallQRCodeRequest,
  ICreateSMSQRCodeRequest,
  ICreateURLQRCodeRequest,
  ICreateGeolocationQRCodeRequest,
  IQRCode,
  IUpdateEmailQRCodeRequest,
  IUpdateWifiQRCodeRequest,
  IUpdateCallQRCodeRequest,
  IUpdateSMSQRCodeRequest,
  IUpdateURLQRCodeRequest,
  IUpdateGeolocationQRCodeRequest,
} from "./interfaces";

/**
 * QR Code Client for managing QR codes via Posty5 API
 *
 * @example
 * ```typescript
 * import { HttpClient } from '@posty5/core';
 * import { QRCodeClient } from '@posty5/qr-code';
 *
 * const http = new HttpClient({
 *   baseUrl: 'https://api.posty5.com',
 *   apiKey: 'your-api-key'
 * });
 *
 * const qrCodeClient = new QRCodeClient(http);
 *
 * // Create a URL QR code
 * const qrCode = await qrCodeClient.create({
 *   name: 'My Website',
 *   qrCodeTarget: {
 *     type: 'url',
 *     url: {
 *       url: 'https://example.com'
 *     }
 *   }
 * });
 * ```
 */
export class QRCodeClient {
  private http: HttpClient;
  private basePath = "/api/qr-code";

  /**
   * Create a new QR Code client
   * @param http - HTTP client instance from @posty5/core
   */
  constructor(http: HttpClient) {
    this.http = http;
  }
   
  /**
   * Create a free text QR code with custom text content
   *
   * @param data - Free text QR code creation data
   * @returns Created QR code with ID and landing page URL
   *
   * @example
   * ```typescript
   * const qrCode = await qrCodeClient.createFreeText({
   *   name: 'Custom Text QR',
   *   templateId: 'template_123',
   *   qrCodeTarget: {
   *     text: 'Any custom text you want to encode'
   *   }
   * });
   * console.log('QR Code URL:', qrCode.qrCodeLandingPage);
   * ```
   */
  async createFreeText(data: ICreateFreeTextQRCodeRequest): Promise<ICreateQRCodeResponse> {
    let qrCodeTarget = {
      text: data.text,
      type: "freeText",
    };
    data.text = undefined as unknown as string;
    const response = await this.http.post<ICreateQRCodeResponse>(this.basePath, {
      qrCodeTarget,
      ...data,
      options: {
        text: qrCodeTarget.text,
      },
      templateType: "user",
      createdFrom: "npmPackage",
    });
    return response.result!;
  }

  /**
   * Create an email QR code that opens the default email client
   *
   * @param data - Email QR code creation data
   * @returns Created QR code with ID and landing page URL
   *
   * @example
   * ```typescript
   * const qrCode = await qrCodeClient.createEmail({
   *   name: 'Contact Us',
   *   templateId: 'template_123',
   *   email: {
   *     email: 'contact@example.com',
   *     subject: 'Inquiry from QR Code',
   *     body: 'Hello, I would like to know more about...'
   *   }
   * });
   * ```
   */
  async createEmail(data: ICreateEmailQRCodeRequest): Promise<ICreateQRCodeResponse> {
     let qrCodeTarget = {
      email: data.email,
      type: "email",
    };
    data.email = undefined as unknown as any;
    const response = await this.http.post<ICreateQRCodeResponse>(this.basePath, {
      ...data,
      qrCodeTarget,
      options: {
        text: `mailto:${qrCodeTarget.email.email}?subject=${qrCodeTarget.email.subject}&body=${qrCodeTarget.email.body}`,
      },
      templateType: "user",
      createdFrom: "npmPackage",
    });
    return response.result!;
  }

  /**
   * Create a WiFi QR code for easy network connection
   *
   * @param data - WiFi QR code creation data
   * @returns Created QR code with ID and landing page URL
   *
   * @example
   * ```typescript
   * const qrCode = await qrCodeClient.createWifi({
   *   name: 'Office WiFi',
   *   templateId: 'template_123',
   *   wifi: {
   *     name: 'OfficeNetwork',
   *     authenticationType: 'WPA',
   *     password: 'secret123'
   *   }
   * });
   * ```
   */
  async createWifi(data: ICreateWifiQRCodeRequest): Promise<ICreateQRCodeResponse> {
    let qrCodeTarget = {
      wifi: data.wifi,
      type: "wifi",
    };
    data.wifi = undefined as unknown as any;
    const response = await this.http.post<ICreateQRCodeResponse>(this.basePath, {
      ...data,
      qrCodeTarget,
      options: {
        text: `WIFI:T:${qrCodeTarget.wifi.authenticationType};S:${qrCodeTarget.wifi.name};P:${qrCodeTarget.wifi.password};`,
      },
      templateType: "user",
      createdFrom: "npmPackage",
    });
    return response.result!;
  }

  /**
   * Create a phone call QR code that initiates a call
   *
   * @param data - Call QR code creation data
   * @returns Created QR code with ID and landing page URL
   *
   * @example
   * ```typescript
   * const qrCode = await qrCodeClient.createCall({
   *   name: 'Call Support',
   *   templateId: 'template_123',
   *   call: {
   *     phoneNumber: '+1234567890'
   *   }
   * });
   * ```
   */
  async createCall(data: ICreateCallQRCodeRequest): Promise<ICreateQRCodeResponse> {
     let qrCodeTarget = {
      call: data.call,
      type: "call",
    };
    data.call = undefined as unknown as any;
    const response = await this.http.post<ICreateQRCodeResponse>(this.basePath, {
      ...data,
      qrCodeTarget,
      options: {
        text: `tel:${qrCodeTarget.call.phoneNumber}`,
      },
      templateType: "user",
      createdFrom: "npmPackage",
    });
    return response.result!;
  }

  /**
   * Create an SMS QR code with pre-filled message
   *
   * @param data - SMS QR code creation data
   * @returns Created QR code with ID and landing page URL
   *
   * @example
   * ```typescript
   * const qrCode = await qrCodeClient.createSMS({
   *   name: 'Text Us',
   *   templateId: 'template_123',
   *   sms: {
   *     phoneNumber: '+1234567890',
   *     message: 'I scanned your QR code!'
   *   }
   * });
   * ```
   */
  async createSMS(data: ICreateSMSQRCodeRequest): Promise<ICreateQRCodeResponse> {
     let qrCodeTarget = {
      sms: data.sms,
      type: "sms",
    };
    data.sms = undefined as unknown as any;
    const response = await this.http.post<ICreateQRCodeResponse>(this.basePath, {
      ...data,
      qrCodeTarget,
      options: {
        text: `sms:${qrCodeTarget.sms.phoneNumber}?body=${qrCodeTarget.sms.message}`,
      },
      templateType: "user",
      createdFrom: "npmPackage",
    });
    return response.result!;
  }
  /**
   * Create a URL QR code that opens a website
   *
   * @param data - URL QR code creation data
   * @returns Created QR code with ID and landing page URL
   *
   * @example
   * ```typescript
   * const qrCode = await qrCodeClient.createURL({
   *   name: 'Website Link',
   *   templateId: 'template_123',
   *   url: {
   *     url: 'https://example.com'
   *   },
   *   tag: 'marketing',
   *   refId: 'CAMPAIGN-001'
   * });
   * ```
   */
  async createURL(data: ICreateURLQRCodeRequest): Promise<ICreateQRCodeResponse> {
    let qrCodeTarget = {
      url: data.url,
      type: "url",
    };
    data.url = undefined as unknown as any;
    const response = await this.http.post<ICreateQRCodeResponse>(this.basePath, {
      ...data,
      qrCodeTarget,
      options: {
        text: qrCodeTarget.url.url,
      },
      templateType: "user",
      createdFrom: "npmPackage",
    });
    return response.result!;
  }
  /**
   * Create a geolocation QR code that opens map coordinates
   *
   * @param data - Geolocation QR code creation data
   * @returns Created QR code with ID and landing page URL
   *
   * @example
   * ```typescript
   * const qrCode = await qrCodeClient.createGeolocation({
   *   name: 'Our Office Location',
   *   templateId: 'template_123',
   *   geolocation: {
   *     latitude: 40.7128,
   *     longitude: -74.0060
   *   }
   * });
   * ```
   */
  async createGeolocation(data: ICreateGeolocationQRCodeRequest): Promise<ICreateQRCodeResponse> {
     let qrCodeTarget = {
      geolocation: data.geolocation,
      type: "geolocation",
    };
    data.geolocation = undefined as unknown as any;
    const response = await this.http.post<ICreateQRCodeResponse>(this.basePath, {
      ...data,
      qrCodeTarget,
      options: {
        text: `geo:${qrCodeTarget.geolocation.latitude},${qrCodeTarget.geolocation.longitude}`,
      },
      templateType: "user",
      createdFrom: "npmPackage",
    });
    return response.result!;
  }

   /**
   * Update a free text QR code with custom text content
   *
   * @param data - Free text QR code creation data
   * @returns Created QR code with ID and landing page URL
   *
   * @example
   * ```typescript
   * const qrCode = await qrCodeClient.updateFreeText("qr_code_id",{
   *   name: 'Custom Text QR',
   *   templateId: 'template_123',
   *   qrCodeTarget: {
   *     text: 'Any custom text you want to encode'
   *   }
   * });
   * console.log('QR Code URL:', qrCode.qrCodeLandingPage);
   * ```
   */
  async updateFreeText(id: string, data: ICreateFreeTextQRCodeRequest): Promise<ICreateQRCodeResponse> {
    let qrCodeTarget = {
      text: data.text,
      type: "freeText",
    };
    data.text = undefined as unknown as string;
    const response = await this.http.put<ICreateQRCodeResponse>(`${this.basePath}/${id}`, {
      qrCodeTarget,
      ...data,
      options: {
        text: qrCodeTarget.text,
      },
      templateType: "user",
      createdFrom: "npmPackage",
    });
    return response.result!;
  }

  /**
   * Update an email QR code that opens the default email client
   *
   * @param data - Email QR code update data
   * @returns Updated QR code with ID and landing page URL
   *
   * @example
   * ```typescript
   * const qrCode = await qrCodeClient.updateEmail("qr_code_id",{
   *   name: 'Contact Us',
   *   templateId: 'template_123',
   *   email: {
   *     email: 'contact@example.com',
   *     subject: 'Inquiry from QR Code',
   *     body: 'Hello, I would like to know more about...'
   *   }
   * });
   * ```
   */
  async updateEmail(id: string, data: IUpdateEmailQRCodeRequest): Promise<IUpdateQRCodeResponse> {
     let qrCodeTarget = {
      email: data.email,
      type: "email",
    };
    data.email = undefined as unknown as any;
    const response = await this.http.put<IUpdateQRCodeResponse>(`${this.basePath}/${id}`, {
      ...data,
      qrCodeTarget,
      options: {
        text: `mailto:${qrCodeTarget.email.email}?subject=${qrCodeTarget.email.subject}&body=${qrCodeTarget.email.body}`,
      },
      templateType: "user",
      createdFrom: "npmPackage",
    });
    return response.result!;
  }

  /**
   * Update a WiFi QR code for easy network connection
   *
   * @param data - WiFi QR code update data
   * @returns Updated QR code with ID and landing page URL
   *
   * @example
   * ```typescript
   * const qrCode = await qrCodeClient.updateWifi("qr_code_id",{
   *   name: 'Office WiFi',
   *   templateId: 'template_123',
   *   wifi: {
   *     name: 'OfficeNetwork',
   *     authenticationType: 'WPA',
   *     password: 'secret123'
   *   }
   * });
   * ```
   */
  async updateWifi(id: string, data: IUpdateWifiQRCodeRequest): Promise<IUpdateQRCodeResponse> {
    let qrCodeTarget = {
      wifi: data.wifi,
      type: "wifi",
    };
    data.wifi = undefined as unknown as any;
    const response = await this.http.put<IUpdateQRCodeResponse>(`${this.basePath}/${id}`, {
      ...data,
      qrCodeTarget,
      options: {
        text: `WIFI:T:${qrCodeTarget.wifi.authenticationType};S:${qrCodeTarget.wifi.name};P:${qrCodeTarget.wifi.password};`,
      },
      templateType: "user",
      createdFrom: "npmPackage",
    });
    return response.result!;
  }

  /**
   * Update a phone call QR code that initiates a call
   *
   * @param data - Call QR code update data
   * @returns Updated QR code with ID and landing page URL
   *
   * @example
   * ```typescript
   * const qrCode = await qrCodeClient.updateCall("qr_code_id",{
   *   name: 'Call Support',
   *   templateId: 'template_123',
   *   call: {
   *     phoneNumber: '+1234567890'
   *   }
   * });
   * ```
   */
  async updateCall(id: string, data: IUpdateCallQRCodeRequest): Promise<IUpdateQRCodeResponse> {
     let qrCodeTarget = {
      call: data.call,  
      type: "call",
    };
    data.call = undefined as unknown as any;
    const response = await this.http.put<IUpdateQRCodeResponse>(`${this.basePath}/${id}`, {
      ...data,
      qrCodeTarget,
      options: {
        text: `tel:${qrCodeTarget.call.phoneNumber}`,
      },
      templateType: "user",
      createdFrom: "npmPackage",
    });
    return response.result!;
  }

  /**
   * Update an SMS QR code with pre-filled message
   *
   * @param data - SMS QR code update data
   * @returns Updated QR code with ID and landing page URL
   *
   * @example
   * ```typescript
   * const qrCode = await qrCodeClient.updateSMS("qr_code_id",{
   *   name: 'Text Us',
   *   templateId: 'template_123',
   *   sms: {
   *     phoneNumber: '+1234567890',
   *     message: 'I scanned your QR code!'
   *   }
   * });
   * ```
   */
  async updateSMS(id: string, data: IUpdateSMSQRCodeRequest): Promise<IUpdateQRCodeResponse> {
     let qrCodeTarget = {
      sms: data.sms,
      type: "sms",
    };
    data.sms = undefined as unknown as any;
    const response = await this.http.put<IUpdateQRCodeResponse>(`${this.basePath}/${id}`, {
      ...data,
      qrCodeTarget,
      options: {
        text: `sms:${qrCodeTarget.sms.phoneNumber}?body=${qrCodeTarget.sms.message}`,
      },
      templateType: "user",
      createdFrom: "npmPackage",
    });
    return response.result!;
  }
  /**
   * Update a URL QR code that opens a website
   *
   * @param data - URL QR code update data
   * @returns Updated QR code with ID and landing page URL
   *
   * @example
   * ```typescript
   * const qrCode = await qrCodeClient.updateURL("qr_code_id",{
   *   name: 'Website Link',
   *   templateId: 'template_123',
   *   url: {
   *     url: 'https://example.com'
   *   },
   *   tag: 'marketing',
   *   refId: 'CAMPAIGN-001'
   * });
   * ```
   */
  async updateURL(id: string, data: IUpdateURLQRCodeRequest): Promise<IUpdateQRCodeResponse> {
    let qrCodeTarget = {
      url: data.url,
      type: "url",
    };
    data.url = undefined as unknown as any;
    const response = await this.http.put<IUpdateQRCodeResponse>(`${this.basePath}/${id}`, {
      ...data,
      qrCodeTarget,
      options: {
        text: qrCodeTarget.url.url,
      },
      templateType: "user",
      createdFrom: "npmPackage",
    });
    return response.result!;
  }
  /**
   * Update a geolocation QR code that opens map coordinates
   *
   * @param data - Geolocation QR code update data
   * @returns Updated QR code with ID and landing page URL
   *
   * @example
   * ```typescript
   * const qrCode = await qrCodeClient.updateGeolocation("qr_code_id",{
   *   name: 'Our Office Location',
   *   templateId: 'template_123',
   *   geolocation: {
   *     latitude: 40.7128,
   *     longitude: -74.0060
   *   }
   * });
   * ```
   */
  async updateGeolocation(id: string, data: IUpdateGeolocationQRCodeRequest): Promise<IUpdateQRCodeResponse> {
     let qrCodeTarget = {
      geolocation: data.geolocation,
      type: "geolocation",
    };
    data.geolocation = undefined as unknown as any;
    const response = await this.http.put<IUpdateQRCodeResponse>(`${this.basePath}/${id}`, {
      ...data,
      qrCodeTarget,
      options: {
        text: `geo:${qrCodeTarget.geolocation.latitude},${qrCodeTarget.geolocation.longitude}`,
      },
      templateType: "user",
      createdFrom: "npmPackage",
    });
    return response.result!;
  }

  /**
   * Get a QR code by ID
   *
   * @param id - QR code ID
   * @returns QR code details
   *
   * @example
   * ```typescript
   * const qrCode = await qrCodeClient.get('qr123');
   * console.log(qrCode.name);
   * console.log(qrCode.numberOfVisitors);
   * ```
   */
  async get(id: string): Promise<IGetQRCodeResponse> {
    const response = await this.http.get<IGetQRCodeResponse>(`${this.basePath}/${id}`);
    return response.result!;
  }

  /**
   * Delete a QR code
   *
   * @param id - QR code ID
   *
   * @example
   * ```typescript
   * await qrCodeClient.delete('qr123');
   * ```
   */
  async delete(id: string): Promise<void> {
    await this.http.delete<IDeleteQRCodeResponse>(`${this.basePath}/${id}`);
  }

  /**
   * List QR codes with pagination and optional filters
   *
   * @param params - Filter parameters (optional)
   * @param pagination - Pagination parameters (optional)
   * @returns Paginated list of QR codes
   *
   * @example
   * ```typescript
   * // List all QR codes
   * const result = await qrCodeClient.list();
   * console.log(result.items);
   * console.log(result.pagination);
   *
   * // List with filters
   * const filtered = await qrCodeClient.list(
   *   { status: 'approved', tag: 'marketing' },
   *   { page: 1, pageSize: 20 }
   * );
   * ```
   */
  async list(params?: IListParams, pagination?: IPaginationParams): Promise<IPaginationResponse<IQRCode[]>> {
    const response = await this.http.get<IPaginationResponse<IQRCode[]>>(this.basePath, {
      params: {
        ...params,
        ...pagination,
      },
    });
    return response.result!;
  }
}
