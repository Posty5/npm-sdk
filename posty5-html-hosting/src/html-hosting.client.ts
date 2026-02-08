import { HttpClient, IPaginationParams, uploadToR2 } from "@posty5/core";
import {
  IHtmlPageResponse,
  ISearchHtmlPagesResponse,
  ILookupHtmlPagesResponse,
  ILookupFormsResponse,
  IDeleteHtmlPageResponse,
  IPublishHtmlPageResponse,
  ICleanCacheResponse,
  ICreateHtmlPageRequestWithFile,
  ICreateHtmlPageRequestWithGithub,
  ICreateHtmlPageResponse,
  IUpdateHtmlPageResponse,
  IHtmlPageCreateWithFileResponse,
  IHtmlPageCreateWithGithubResponse,
  IUpdateHtmlPageRequestWithFile,
  IUpdateHtmlPageRequestWithGithub,
  IListParams,
} from "./interfaces";

/**
 * HTML Hosting Client for managing HTML pages via Posty5 API
 */
export class HtmlHostingClient {
  private http: HttpClient;
  private basePath = "/api/html-hosting";

  /**
   * Create a new HTML Hosting client
   * @param http - HTTP client instance from @posty5/core
   */
  constructor(http: HttpClient) {
    this.http = http;
  }

  /**
   * Create an HTML page by uploading a file to R2 storage
   * Auto-publishes after file upload is complete
   * @param data - Create request data with file information
   * @param file - HTML file to upload (File or Blob)
   * @returns Created page with ID, shorter link, and file URL
   *
   * @example
   * ```typescript
   * // Using File object
   * const file = new File([htmlContent], 'page.html', { type: 'text/html' });
   * await client.createWithFile({ name: 'My Page', fileName: 'page.html' }, file);
   *
   * // Using Blob
   * const blob = new Blob([htmlContent], { type: 'text/html' });
   * await client.createWithFile({ name: 'My Page', fileName: 'page.html' }, blob);
   * ```
   */
  async createWithFile(data: ICreateHtmlPageRequestWithFile, file: File | Blob): Promise<IHtmlPageCreateWithFileResponse> {
    // Step 1: Create the HTML page record and get upload configuration
    const response = await this.http.post<ICreateHtmlPageResponse>(`${this.basePath}/file`, {
      ...data,
      createdFrom: "npmPackage",
    });
    const result = response.result!.details;
    const uploadConfig = response.result!.uploadFileConfig;

    // Step 2: Upload HTML file to R2 using uploadToR2 utility
    await uploadToR2(uploadConfig.uploadUrl, file, {
      contentType: file instanceof File ? file.type : "text/html",
    });

    // Page is auto-published by backend after file upload

    return {
      _id: result._id,
      shorterLink: result.shorterLink,
      fileUrl: result.fileUrl!,
    };
  }

  /**
   * Create an HTML page from a GitHub repository
   * The API will automatically fetch, deploy, and publish the file from GitHub
   * @param data - Create request data with GitHub file URL
   * @returns Created page with ID, shorter link, and GitHub info
   */
  async createWithGithubFile(data: ICreateHtmlPageRequestWithGithub): Promise<IHtmlPageCreateWithGithubResponse> {
    const response = await this.http.post<ICreateHtmlPageResponse>(`${this.basePath}/github`, {
      ...data,
      createdFrom: "npmPackage",
    });
    const result = response.result!.details;

    return {
      _id: result._id,
      shorterLink: result.shorterLink,
      githubInfo: result.githubInfo!,
    };
  }

  /**
   * Get an HTML page by ID
   * @param id - HTML page ID
   * @returns HTML page details
   */
  async get(id: string): Promise<IHtmlPageResponse> {
    const response = await this.http.get<IHtmlPageResponse>(`${this.basePath}/${id}`);
    return response.result!;
  }

  /**
   * Update an HTML page with a new file upload to R2 storage
   * Auto-publishes after file upload is complete
   * @param id - HTML page ID to update
   * @param data - Update request data with file information
   * @param file - New HTML file to upload (File or Blob)
   * @returns Updated page with ID, shorter link, and file URL
   */
  async updateWithNewFile(id: string, data: IUpdateHtmlPageRequestWithFile, file: File | Blob): Promise<IHtmlPageCreateWithFileResponse> {
    // Step 1: Update the HTML page record and get upload configuration
    const response = await this.http.put<IUpdateHtmlPageResponse>(`${this.basePath}/${id}/file`, {
      ...data,
      isNewFile: true,
    });
    const result = response.result!.details;
    const uploadConfig = response.result!.uploadFileConfig;

    // Step 2: Upload HTML file to R2 using uploadToR2 utility
    if (uploadConfig) {
      await uploadToR2(uploadConfig.uploadUrl, file, {
        contentType: file instanceof File ? file.type : "text/html",
      });
    }

    // Page is auto-published by backend

    return {
      _id: result._id,
      shorterLink: result.shorterLink,
      fileUrl: result.fileUrl!,
    };
  }

  /**
   * Update an HTML page with a new GitHub repository file
   * The API will automatically fetch, deploy, and publish the file from GitHub
   * @param id - HTML page ID to update
   * @param data - Update request data with GitHub file URL
   * @returns Updated page with ID, shorter link, and GitHub info
   */
  async updateWithGithubFile(id: string, data: IUpdateHtmlPageRequestWithGithub): Promise<IHtmlPageCreateWithGithubResponse> {
    const response = await this.http.put<IUpdateHtmlPageResponse>(`${this.basePath}/${id}/github`, {
      ...data,
    });
    const result = response.result!.details;

    return {
      _id: result._id,
      shorterLink: result.shorterLink,
      githubInfo: result.githubInfo!,
    };
  }

  /**
   * Delete an HTML page
   * @param id - HTML page ID
   * @returns Deletion confirmation
   */
  async delete(id: string): Promise<void> {
    await this.http.delete<IDeleteHtmlPageResponse>(`${this.basePath}/${id}`);
  }

  /**
   * Search HTML pages with pagination and optional search/filter
   * @param params - Pagination parameters with optional search query and status filter
   * @returns Paginated list of HTML pages
   */
  async list(params?: IListParams, pagination?: IPaginationParams): Promise<ISearchHtmlPagesResponse> {
    const response = await this.http.get<ISearchHtmlPagesResponse>(this.basePath, {
      params: {
        ...params,
        ...pagination,
      },
    });
    return response.result!;
  }

  /**
   * Get a simplified lookup list of HTML pages (ID and name only)
   * Useful for dropdowns and selection lists
   * @returns Array of HTML page lookup items with ID and name
   */
  async lookup(): Promise<ILookupHtmlPagesResponse> {
    const response = await this.http.get<ILookupHtmlPagesResponse>(`${this.basePath}/lookup`);
    return response.result!;
  }

  /**
   * Get form IDs for an HTML page
   * @param id - HTML page ID
   * @returns Array of form lookup items
   */
  async lookupForms(id: string): Promise<ILookupFormsResponse> {
    const response = await this.http.get<ILookupFormsResponse>(`${this.basePath}/lookup-froms/${id}`);
    return response.result!;
  }

  /**
   * Clear the cache for an HTML page to force fresh content delivery
   * @param id - HTML page ID
   */
  async cleanCache(id: string): Promise<void> {
    await this.http.put<ICleanCacheResponse>(`${this.basePath}/${id}/clean-cache`, {});
  }
}
