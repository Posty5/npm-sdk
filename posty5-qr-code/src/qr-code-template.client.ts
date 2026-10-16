import { HttpClient, IBinaryResponse, IPaginationParams, IPaginationResponse, ValidationError, assertVersion, uploadToR2, withVersion } from "@posty5/core";
import {
  ICreateQRCodeTemplateRequest,
  IPublicQRCodeTemplateLookupParams,
  IQRCodeTemplateDetails,
  IQRCodeTemplateItem,
  IQRCodeTemplateListParams,
  IQRCodeTemplateLookupItem,
  IQRCodeTemplateLookupParams,
  IQrDesignCatalogue,
  IQrLogoUploadTicket,
  IQrRenderOptions,
  IUpdateQRCodeTemplateRequest,
  QrCodeFileContent,
  QrLogoFileType,
} from "./interfaces";
import { toQrCodeFileUpload } from "./helpers/qr-code-request.helper";
import { toQrRenderQuery } from "./helpers/qr-render-query.helper";
import { QrCodeTemplatePathsConst } from "./qr-code.config";

/**
 * QR code templates (designs) — `/api/qr-code-template`. A template's `_id` is
 * the `templateId` every QR create method takes.
 *
 * Designs: shapes (`dotShape`, `eyeFrameShape`, `eyeBallShape`), a gradient
 * `fill`, a `frame` with a call to action and a logo, on every plan. Rendering
 * SVG / PDF / print sizes and uploading a logo file need a paid plan; the
 * API's 403 message is surfaced unchanged as `AuthorizationError`. None of
 * these methods costs credits except `create` (a template creation).
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

  /**
   * Save a design as a private template of yours. Any v2 field makes it a v2
   * design (`designVersion: 2`, set by the API). A pasted logo URL is
   * re-hosted on the Posty5 CDN when saved.
   *
   * @example
   * ```typescript
   * const template = await templates.create({
   *   name: 'Menu',
   *   options: {
   *     correctLevel: 2,
   *     dotShape: 'rounded',
   *     eyeFrameShape: 'leaf',
   *     fill: { type: 'linear', rotation: 45, stops: [{ offset: 0, color: '#0059F7' }, { offset: 1, color: '#7B2FF7' }] },
   *     frame: { id: 'banner-bottom', text: 'Scan for menu' },
   *   },
   * });
   * ```
   */
  async create(data: ICreateQRCodeTemplateRequest): Promise<IQRCodeTemplateItem> {
    const response = await this.http.post<IQRCodeTemplateItem>(this.basePath, data);
    return response.result!;
  }

  /**
   * Replace a template's name and design (owner only). The id travels in the
   * body (`_id`), the version as `If-Match`. A v2 design updated without
   * `designVersion` keeps its v2 fields; send `designVersion: 1` to remove them.
   *
   * @example
   * ```typescript
   * const current = await templates.get(id);
   * await templates.update(id, { name: current.name!, options: { ...current.options, dotShape: 'dots' } }, current.__v);
   * ```
   */
  async update(id: string, data: IUpdateQRCodeTemplateRequest, version: number): Promise<IQRCodeTemplateItem & { _id: string; __v: number }> {
    assertVersion(version);
    const response = await this.http.put<IQRCodeTemplateItem>(this.basePath, { _id: id, name: data.name, options: data.options }, { version });
    return withVersion(response, id);
  }

  /** One of your templates with its design and `__v`. Owner only. */
  async get(id: string): Promise<IQRCodeTemplateDetails> {
    const response = await this.http.get<IQRCodeTemplateDetails>(`${this.basePath}/${id}`);
    return response.result!;
  }

  /** Your templates with usage counts; `name` filters by part of the name. */
  async list(params?: IQRCodeTemplateListParams, pagination?: IPaginationParams): Promise<IPaginationResponse<IQRCodeTemplateItem>> {
    const response = await this.http.get<IPaginationResponse<IQRCodeTemplateItem>>(this.basePath, {
      params: { ...params, ...pagination },
    });
    return response.result!;
  }

  /** Delete one of your templates. Refused while QR codes still use it. */
  async delete(id: string, version: number): Promise<void> {
    assertVersion(version);
    await this.http.delete(`${this.basePath}/${id}`, { version });
  }

  /**
   * Render a template (yours or a public one) as PNG, SVG or PDF. Plain PNG
   * is on every plan; SVG, PDF, a print preset, a DPI or a PNG over 2048 px
   * need a plan with vector export. A template you cannot see throws
   * `NotFoundError`. No credits.
   *
   * @example
   * ```typescript
   * const pdf = await templates.render(id, { format: 'pdf', presetId: 'flyer-5cm' });
   * writeFileSync('menu.pdf', Buffer.from(pdf.data));
   * ```
   */
  async render(id: string, options?: IQrRenderOptions): Promise<IBinaryResponse> {
    return this.http.getBinary(`${this.basePath}/${id}${QrCodeTemplatePathsConst.render}`, {
      params: toQrRenderQuery(options),
    });
  }

  /**
   * The design catalogue: frames, call-to-action presets, print presets, dot
   * and eye shapes (ids, i18n label keys, SVG previews) and the design limits.
   * Public; no credits.
   */
  async getDesignCatalogue(): Promise<IQrDesignCatalogue> {
    const response = await this.http.get<IQrDesignCatalogue>(`${this.basePath}${QrCodeTemplatePathsConst.designCatalogue}`);
    return response.result!;
  }

  /**
   * A signed PUT URL for your own logo file (PNG, JPEG, WebP or SVG, up to
   * 2 MB). Needs a plan with logo upload. Most callers want `uploadLogo`.
   */
  async getLogoUploadUrl(fileType: QrLogoFileType, fileSize: number): Promise<IQrLogoUploadTicket> {
    const response = await this.http.post<IQrLogoUploadTicket>(`${this.basePath}${QrCodeTemplatePathsConst.logoUploadUrl}`, { fileType, fileSize });
    return response.result!;
  }

  /**
   * Upload a logo file and return its public URL — save it as
   * `options.logo` with `logoSource: "upload"`. `file` is a `Blob` / `File`
   * (its `type` is used unless `fileType` is given) or an `ArrayBuffer` /
   * Node `Buffer` (then `fileType` is required). Needs a plan with logo
   * upload; no credits.
   *
   * @example
   * ```typescript
   * const logo = await templates.uploadLogo(readFileSync('./logo.png'), 'image/png');
   * await templates.create({ name: 'Brand', options: { logo, logoSource: 'upload', correctLevel: 2 } });
   * ```
   */
  async uploadLogo(file: QrCodeFileContent, fileType?: QrLogoFileType): Promise<string> {
    const typed = typeof Blob !== "undefined" && file instanceof Blob && !!file.type;
    if (!fileType && !typed) {
      throw new ValidationError("fileType is required when the logo is not a Blob with a type");
    }
    const { blob, mimeType, sizeBytes } = toQrCodeFileUpload<QrLogoFileType>(file, fileType);
    const ticket = await this.getLogoUploadUrl(mimeType, sizeBytes);
    await uploadToR2(ticket.uploadFileURL, blob, { contentType: mimeType });
    return ticket.fileURL;
  }
}
