import { HttpClient, IPaginationParams, uploadToR2 } from '@posty5/core';
import {
    ICreateSocialPublisherWorkspaceRequest,
    IUpdateSocialPublisherWorkspaceRequest,
    ISearchSocialPublisherWorkspaceParams,
    ISearchSocialPublisherWorkspaceResponse,
    ISocialPublisherWorkspaceResponse,
    ICreateSocialPublisherWorkspaceResponse,
    IUpdateSocialPublisherWorkspaceResponse,
    IDeleteSocialPublisherWorkspaceResponse,
    ISocialPublisherWorkspaceSampleDetails
} from './interfaces';

/**
 * Social Publisher Workspace Client
 */
export class SocialPublisherWorkspaceClient {
    private http: HttpClient;
    private basePath = '/api/social-publisher-workspace';

    /**
     * Create client
     * @param http - HttpClient instance
     */
    constructor(http: HttpClient) {
        this.http = http;
    }

    /**
     * Search workspaces
     * @param params - Search filters
     * @param pagination - Pagination options
     */
    async list(params?: ISearchSocialPublisherWorkspaceParams, pagination?: IPaginationParams): Promise<ISearchSocialPublisherWorkspaceResponse> {
        const response = await this.http.get<ISearchSocialPublisherWorkspaceResponse>(this.basePath, {
            params: {
                ...params,
                ...pagination
            }
        });
        return response.result!;
    }

    /**
     * Get workspace by ID
     * @param id - Workspace ID
     */
    async get(id: string): Promise<ISocialPublisherWorkspaceResponse> {
        const response = await this.http.get<ISocialPublisherWorkspaceResponse>(`${this.basePath}/${id}`);
        return response.result!;
    }

    /**
     * Create workspace with optional image upload
     * @param data - Workspace data
     * @param image - Optional image file (File or Blob)
     * @returns Workspace details
     * 
     * @example
     * ```typescript
     * // Create without image
     * const workspace = await client.create({ name: 'My Workspace', description: 'Description' });
     * 
     * // Create with image
     * const file = new File([imageBlob], 'logo.png', { type: 'image/png' });
     * const workspace = await client.create(
     *   { name: 'My Workspace', description: 'Description' },
     *   file
     * );
     * ```
     */
    async create(data: ICreateSocialPublisherWorkspaceRequest, image?: File | Blob): Promise<ISocialPublisherWorkspaceSampleDetails> {
        // Step 1: Create workspace and get upload config
        const response = await this.http.post<ICreateSocialPublisherWorkspaceResponse>(this.basePath, {
            ...data,
            hasImage: !!image,
            createdFrom: "npmPackage"
        });

        const workspace = response.result!.workspace;
        const uploadConfig = response.result!.uploadImageConfig;

        // Step 2: Upload image if provided
        if (image && uploadConfig) {
            await uploadToR2(uploadConfig.uploadUrl, image, {
                contentType: image instanceof File ? image.type : 'image/png'
            });

            // Step 3: Update workspace with imageUrl
            await this.update(workspace._id, { imageUrl: uploadConfig.imageUrl });
            workspace.imageUrl = uploadConfig.imageUrl;
        }

        return workspace;
    }

    /**
     * Update workspace with optional image upload
     * @param id - Workspace ID
     * @param data - Workspace data
     * @param image - Optional new image file (File or Blob)
     * @returns Workspace details
     * 
     * @example
     * ```typescript
     * // Update without changing image
     * await client.update('workspace-id', { name: 'New Name', description: 'New Description' });
     * 
     * // Update with new image
     * const file = new File([imageBlob], 'new-logo.png', { type: 'image/png' });
     * await client.update(
     *   'workspace-id',
     *   { name: 'New Name', description: 'New Description' },
     *   file
     * );
     * ```
     */
    async update(id: string, data: IUpdateSocialPublisherWorkspaceRequest, image?: File | Blob): Promise<ISocialPublisherWorkspaceSampleDetails> {
        // Step 1: Update workspace and get upload config
        const response = await this.http.put<IUpdateSocialPublisherWorkspaceResponse>(`${this.basePath}/${id}`, {
            ...data,
            hasImage: !!image
        });

        const workspace = response.result!.workspace;
        const uploadConfig = response.result!.uploadImageConfig;

        // Step 2: Upload image if provided
        if (image && uploadConfig) {
            await uploadToR2(uploadConfig.uploadUrl, image, {
                contentType: image instanceof File ? image.type : 'image/png'
            });

            // Step 3: Update workspace with imageUrl
            await this.update(workspace._id, { imageUrl: uploadConfig.imageUrl });
            workspace.imageUrl = uploadConfig.imageUrl;
        }

        return workspace;
    }

    /**
     * Delete workspace
     * @param id - Workspace ID
     */
    async delete(id: string): Promise<void> {
        await this.http.delete<IDeleteSocialPublisherWorkspaceResponse>(`${this.basePath}/${id}`);
    }
}
