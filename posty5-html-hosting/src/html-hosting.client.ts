import { HttpClient, IPaginationParams } from '@posty5/core';
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
} from './interfaces';

/**
 * HTML Hosting Client for managing HTML pages via Posty5 API
 */
export class HtmlHostingClient {
    private http: HttpClient;
    private basePath = '/api/html-hosting';

    /**
     * Create a new HTML Hosting client
     * @param http - HTTP client instance from @posty5/core
     */
    constructor(http: HttpClient) {
        this.http = http;
    }

    /**
     * Create an HTML page by uploading a file to R2 storage
     * @param data - Create request data with file information
     * @param file - HTML file to upload
     * @returns Created page with ID, shorter link, and file URL
     */
    async createWithFile(data: ICreateHtmlPageRequestWithFile, file: File): Promise<IHtmlPageCreateWithFileResponse> {
        // Step 1: Create the HTML page record and get upload configuration
        const response = await this.http.post<ICreateHtmlPageResponse>(this.basePath, {
            ...data,
            sourceType: "file",
        });
        const result = response.result!.details;
        const uploadConfig = response.result!.uplaodFileConfig;

        // Step 2: Upload HTML file to R2 using pre-signed URL
        const formData = new FormData();

        // Add all fields from the signed URL configuration
        Object.entries(uploadConfig.fields).forEach(([key, value]) => {
            formData.append(key, value);
        });

        // Add the file last (required by AWS S3)
        formData.append('file', file);

        // Upload to R2
        await fetch(uploadConfig.url, {
            method: 'POST',
            body: formData,
        });

        // Step 3: Publish the HTML page
        await this.publish(result._id);

        return {
            _id: result._id,
            shorterLink: result.shorterLink,
            fileUrl: result.fileUrl!
        };
    }

    /**
     * Create an HTML page from a GitHub repository
     * The API will automatically fetch and deploy the file from GitHub
     * @param data - Create request data with GitHub file URL
     * @returns Created page with ID, shorter link, and GitHub info
     */
    async createWithGithubFile(data: ICreateHtmlPageRequestWithGithub): Promise<IHtmlPageCreateWithGithubResponse> {
        const response = await this.http.post<ICreateHtmlPageResponse>(this.basePath, {
            ...data,
            sourceType: "github",
        });
        const result = response.result!.details;

        return {
            _id: result._id,
            shorterLink: result.shorterLink,
            githubInfo: result.githubInfo!
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
     * @param id - HTML page ID to update
     * @param data - Update request data with file information
     * @param file - New HTML file to upload
     * @returns Updated page with ID, shorter link, and file URL
     */
    async updateWithNewFile(id: string, data: IUpdateHtmlPageRequestWithFile, file: File): Promise<IHtmlPageCreateWithFileResponse> {
        // Step 1: Update the HTML page record and get upload configuration
        const response = await this.http.put<IUpdateHtmlPageResponse>(`${this.basePath}/${id}`, {
            ...data,
            sourceType: "file",
            isNewFile: true,
            createdFrom: "npmPackage"
        });
        const result = response.result!.details;
        const uploadConfig = response.result!.uplaodFileConfig;

        // Step 2: Upload HTML file to R2 using pre-signed URL
        if (uploadConfig) {
            const formData = new FormData();

            // Add all fields from the signed URL configuration
            Object.entries(uploadConfig.fields).forEach(([key, value]) => {
                formData.append(key, value);
            });

            // Add the file last (required by AWS S3)
            formData.append('file', file);

            // Upload to R2
            await fetch(uploadConfig.url, {
                method: 'POST',
                body: formData,
            });
        }

        // Step 3: Publish the HTML page
        await this.publish(result._id);

        return {
            _id: result._id,
            shorterLink: result.shorterLink,
            fileUrl: result.fileUrl!
        };
    }

    /**
     * Update an HTML page with a new GitHub repository file
     * The API will automatically fetch and deploy the file from GitHub
     * @param id - HTML page ID to update
     * @param data - Update request data with GitHub file URL
     * @returns Updated page with ID, shorter link, and GitHub info
     */
    async updateWithGithubFile(id: string, data: IUpdateHtmlPageRequestWithGithub): Promise<IHtmlPageCreateWithGithubResponse> {
        const response = await this.http.put<IUpdateHtmlPageResponse>(`${this.basePath}/${id}`, {
            ...data,
            sourceType: "github",
        });
        const result = response.result!.details;

        return {
            _id: result._id,
            shorterLink: result.shorterLink,
            githubInfo: result.githubInfo!
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
    async search(params?: IListParams, pagination?: IPaginationParams): Promise<ISearchHtmlPagesResponse> {
        const response = await this.http.get<ISearchHtmlPagesResponse>(this.basePath, {
            params: {
                ...params,
                ...pagination
            }
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
     * Publish an HTML page to make it live and accessible
     * @param id - HTML page ID
     */
    private async publish(id: string): Promise<void> {
        await this.http.put<IPublishHtmlPageResponse>(`${this.basePath}/publish/${id}`, {});
    }

    /**
     * Clear the cache for an HTML page to force fresh content delivery
     * @param id - HTML page ID
     */
    async cleanCache(id: string): Promise<void> {
        await this.http.put<ICleanCacheResponse>(`${this.basePath}/${id}/clean-cache`, {});
    }



}
