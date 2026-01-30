import { HttpClient, IPaginationParams, uploadToR2 } from '@posty5/core';
import {
    ICreateWorkspaceRequest,
    IUpdateWorkspaceRequest,
    IListParams,
    ISearchWorkspaceResponse,
    ICreateWorkspaceResponse,
    IUpdateWorkspaceResponse,
    IDeleteWorkspaceResponse,
    IWorkspaceResponse,
    IWorkspaceForNewTaskResponse
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
    async list(params?: IListParams, pagination?: IPaginationParams): Promise<ISearchWorkspaceResponse> {
        const response = await this.http.get<ISearchWorkspaceResponse>(this.basePath, {
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
    async get(id: string): Promise<IWorkspaceResponse> {
        const response = await this.http.get<IWorkspaceResponse>(`${this.basePath}/${id}`);
        return response.result!;
    }

    /**
     * Get workspace details for creating new task
     * @param id - Workspace ID
     * @returns Workspace details with populated account information
     * 
     * @example
     * ```typescript
     * const workspace = await client.getForNewTask('workspace-id');
     * console.log(workspace.account.youtube); // YouTube account details
     * console.log(workspace.account.facebook?.status); // Facebook account status
     * ```
     */
    async getForNewTask(id: string): Promise<IWorkspaceForNewTaskResponse> {
        const response = await this.http.get<IWorkspaceForNewTaskResponse>(
            `${this.basePath}/${id}/for-new-task`
        );
        return response.result!;
    }


    /**
     * Create workspace with optional image upload
     * @param data - Workspace data
     * @param logo - Optional image file (File or Blob)
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
     */
    async create(data: ICreateWorkspaceRequest, logo?: File | Blob): Promise<string> {
        // Step 1: Create workspace and get upload config
        const response = await this.http.post<ICreateWorkspaceResponse>(this.basePath, {
            ...data,
            hasImage: !!logo,
            createdFrom: "npmPackage"
        });


        // Step 2: Upload image if provided
        if (logo && response.result?.uploadImageConfig) {
            var res = await uploadToR2(response.result.uploadImageConfig.uploadUrl, logo, {
                contentType: /*logo instanceof File ? logo.type : 'image/png'*/ "image/png"
            });
            console.log(res);
        }

        return response.result?.workspaceId!;
    }

    /**
     * Update workspace with optional image upload
     * @param id - Workspace ID
     * @param data - Workspace data
     * @param logo - Optional new image file (File or Blob)
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
     */
    async update(id: string, data: IUpdateWorkspaceRequest, logo?: File | Blob): Promise<void> {
        // Step 1: Update workspace and get upload config
        const response = await this.http.put<IUpdateWorkspaceResponse>(`${this.basePath}/${id}`, {
            ...data,
            hasImage: !!logo
        });


        // Step 2: Upload image if provided
        if (logo && response.result?.uploadImageConfig) {
            await uploadToR2(response.result.uploadImageConfig.uploadUrl, logo, {
                contentType: logo instanceof File ? logo.type : 'image/png'
            });
        }
    }

    /**
     * Delete workspace
     * @param id - Workspace ID
     */
    async delete(id: string): Promise<void> {
        await this.http.delete<IDeleteWorkspaceResponse>(`${this.basePath}/${id}`);
    }
}
