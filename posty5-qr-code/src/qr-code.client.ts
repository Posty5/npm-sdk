import { HttpClient, IPaginationParams } from '@posty5/core';
import {
    ICreateQRCodeResponse,
    IUpdateQRCodeResponse,
    IGetQRCodeResponse,
    IDeleteQRCodeResponse,
    ISearchQRCodesResponse,
    ILookupQRCodesResponse,
    IListParams,
    ICreateFreeTextQRCodeRequest,
    ICreateEmailQRCodeRequest,
    ICreateWifiQRCodeRequest,
    ICreateCallQRCodeRequest,
    ICreateSMSQRCodeRequest,
    ICreateURLQRCodeRequest,
    ICreateGeolocationQRCodeRequest,
} from './interfaces';

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
    private basePath = '/api/qr-code';

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
        const response = await this.http.post<ICreateQRCodeResponse>(this.basePath, {
            ...data,
            options: {
                text: data.qrCodeTarget.text,
            },
            templateType: "user",
            createdFrom: "npmPackage"
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
        const response = await this.http.post<ICreateQRCodeResponse>(this.basePath, {
            ...data,
            options: {
                text: `mailto:${data.email.email}?subject=${data.email.subject}&body=${data.email.body}`,
            },
            templateType: "user",
            createdFrom: "npmPackage"
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
        const response = await this.http.post<ICreateQRCodeResponse>(this.basePath, {
            ...data,
            options: {
                text: `WIFI:T:${data.wifi.authenticationType};S:${data.wifi.name};P:${data.wifi.password};`,
            },
            templateType: "user",
            createdFrom: "npmPackage"
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
        const response = await this.http.post<ICreateQRCodeResponse>(this.basePath, {
            ...data,
            options: {
                text: `tel:${data.call.phoneNumber}`,
            },
            templateType: "user",
            createdFrom: "npmPackage"
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
        const response = await this.http.post<ICreateQRCodeResponse>(this.basePath, {
            ...data,
            options: {
                text: `sms:${data.sms.phoneNumber}?body=${data.sms.message}`,
            },
            templateType: "user",
            createdFrom: "npmPackage"
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
        const response = await this.http.post<ICreateQRCodeResponse>(this.basePath, {
            ...data,
            options: {
                text: data.url.url,
            },
            templateType: "user",
            createdFrom: "npmPackage"
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
        const response = await this.http.post<ICreateQRCodeResponse>(this.basePath, {
            ...data,
            options: {
                text: `geo:${data.geolocation.latitude},${data.geolocation.longitude}`,
            },
            templateType: "user",
            createdFrom: "npmPackage"
        });
        return response.result!;
    }


    /**
     * Update a free text QR code with new custom text content
     * 
     * @param id - QR code ID to update
     * @param data - Updated free text QR code data
     * @returns Updated QR code
     * 
     * @example
     * ```typescript
     * const updated = await qrCodeClient.updateFreeText('qr_123', {
     *   name: 'Updated Custom Text',
     *   templateId: 'template_123',
     *   qrCodeTarget: {
     *     text: 'New custom text content'
     *   }
     * });
     * ```
     */
    async updateFreeText(id: string, data: ICreateFreeTextQRCodeRequest): Promise<IUpdateQRCodeResponse> {
        const response = await this.http.post<IUpdateQRCodeResponse>(`${this.basePath}/${id}`, {
            ...data,
            options: {
                text: data.qrCodeTarget.text,
            },
            templateType: "user",
            createdFrom: "npmPackage"
        });
        return response.result!;
    }

    /**
     * Update an email QR code with new email details
     * 
     * @param id - QR code ID to update
     * @param data - Updated email QR code data
     * @returns Updated QR code
     * 
     * @example
     * ```typescript
     * const updated = await qrCodeClient.updateEmail('qr_123', {
     *   name: 'Updated Contact Email',
     *   templateId: 'template_123',
     *   email: {
     *     email: 'support@example.com',
     *     subject: 'Support Request',
     *     body: 'Please help me with...'
     *   }
     * });
     * ```
     */
    async updateEmail(id: string, data: ICreateEmailQRCodeRequest): Promise<IUpdateQRCodeResponse> {
        const response = await this.http.post<IUpdateQRCodeResponse>(`${this.basePath}/${id}`, {
            ...data,
            options: {
                text: `mailto:${data.email.email}?subject=${data.email.subject}&body=${data.email.body}`,
            },
            templateType: "user",
            createdFrom: "npmPackage"
        });
        return response.result!;
    }

    /**
     * Update a WiFi QR code with new network credentials
     * 
     * @param id - QR code ID to update
     * @param data - Updated WiFi QR code data
     * @returns Updated QR code
     * 
     * @example
     * ```typescript
     * const updated = await qrCodeClient.updateWifi('qr_123', {
     *   name: 'Updated WiFi Network',
     *   templateId: 'template_123',
     *   wifi: {
     *     name: 'NewNetwork',
     *     authenticationType: 'WPA2',
     *     password: 'newpassword456'
     *   }
     * });
     * ```
     */
    async updateWifi(id: string, data: ICreateWifiQRCodeRequest): Promise<IUpdateQRCodeResponse> {
        const response = await this.http.post<IUpdateQRCodeResponse>(`${this.basePath}/${id}`, {
            ...data,
            options: {
                text: `WIFI:T:${data.wifi.authenticationType};S:${data.wifi.name};P:${data.wifi.password};`,
            },
            templateType: "user",
            createdFrom: "npmPackage"
        });
        return response.result!;
    }

    /**
     * Update a phone call QR code with new phone number
     * 
     * @param id - QR code ID to update
     * @param data - Updated call QR code data
     * @returns Updated QR code
     * 
     * @example
     * ```typescript
     * const updated = await qrCodeClient.updateCall('qr_123', {
     *   name: 'Updated Support Number',
     *   templateId: 'template_123',
     *   call: {
     *     phoneNumber: '+0987654321'
     *   }
     * });
     * ```
     */
    async updateCall(id: string, data: ICreateCallQRCodeRequest): Promise<IUpdateQRCodeResponse> {
        const response = await this.http.post<IUpdateQRCodeResponse>(`${this.basePath}/${id}`, {
            ...data,
            options: {
                text: `tel:${data.call.phoneNumber}`,
            },
            templateType: "user",
            createdFrom: "npmPackage"
        });
        return response.result!;
    }

    /**
     * Update an SMS QR code with new message details
     * 
     * @param id - QR code ID to update
     * @param data - Updated SMS QR code data
     * @returns Updated QR code
     * 
     * @example
     * ```typescript
     * const updated = await qrCodeClient.updateSMS('qr_123', {
     *   name: 'Updated SMS',
     *   templateId: 'template_123',
     *   sms: {
     *     phoneNumber: '+0987654321',
     *     message: 'Updated message text'
     *   }
     * });
     * ```
     */
    async updateSMS(id: string, data: ICreateSMSQRCodeRequest): Promise<IUpdateQRCodeResponse> {
        const response = await this.http.post<IUpdateQRCodeResponse>(`${this.basePath}/${id}`, {
            ...data,
            options: {
                text: `sms:${data.sms.phoneNumber}?body=${data.sms.message}`,
            },
            templateType: "user",
            createdFrom: "npmPackage"
        });
        return response.result!;
    }
    /**
     * Update a URL QR code with new website link
     * 
     * @param id - QR code ID to update
     * @param data - Updated URL QR code data
     * @returns Updated QR code
     * 
     * @example
     * ```typescript
     * const updated = await qrCodeClient.updateURL('qr_123', {
     *   name: 'Updated Website',
     *   templateId: 'template_123',
     *   url: {
     *     url: 'https://newwebsite.com'
     *   }
     * });
     * ```
     */
    async updateURL(id: string, data: ICreateURLQRCodeRequest): Promise<IUpdateQRCodeResponse> {
        const response = await this.http.post<IUpdateQRCodeResponse>(`${this.basePath}/${id}`, {
            ...data,
            options: {
                text: data.url.url,
            },
            templateType: "user",
            createdFrom: "npmPackage"
        });
        return response.result!;
    }
    /**
     * Update a geolocation QR code with new coordinates
     * 
     * @param id - QR code ID to update
     * @param data - Updated geolocation QR code data
     * @returns Updated QR code
     * 
     * @example
     * ```typescript
     * const updated = await qrCodeClient.updateGeolocation('qr_123', {
     *   name: 'Updated Location',
     *   templateId: 'template_123',
     *   geolocation: {
     *     latitude: 51.5074,
     *     longitude: -0.1278
     *   }
     * });
     * ```
     */
    async updateGeolocation(id: string, data: ICreateGeolocationQRCodeRequest): Promise<IUpdateQRCodeResponse> {
        const response = await this.http.post<IUpdateQRCodeResponse>(`${this.basePath}/${id}`, {
            ...data,
            options: {
                text: `geo:${data.geolocation.latitude},${data.geolocation.longitude}`,
            },
            templateType: "user",
            createdFrom: "npmPackage"
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
     * console.log(result.data);
     * console.log(result.pagination);
     * 
     * // List with filters
     * const filtered = await qrCodeClient.list(
     *   { status: 'approved', tag: 'marketing' },
     *   { page: 1, pageSize: 20 }
     * );
     * ```
     */
    async search(params?: IListParams, pagination?: IPaginationParams): Promise<ISearchQRCodesResponse> {
        const response = await this.http.get<ISearchQRCodesResponse>(this.basePath, {
            params: {
                ...params,
                ...pagination
            }
        });
        return response.result!;
    }


}
