export interface ISocialPublisherWorkspaceRequest {
    name: string;
    description: string;
    /**
     * Tag (optional)
     * Use this field to filter workspaces by tag.
     * You can pass any custom value from your system.
     */
    tag?: string;
    /**
     * Reference ID (optional)
     * Use this field to filter workspaces by reference ID.
     * You can pass any custom identifier from your system.
     */
    refId?: string;
    /**
     * Has Image (optional)
     * Set to true if you will upload an image for this workspace
     */
    hasImage?: boolean;
    /**
     * Image URL (optional)
     * URL to workspace logo/image in R2 storage
     */
    imageUrl?: string;
}

export type ICreateSocialPublisherWorkspaceRequest = ISocialPublisherWorkspaceRequest;
export type IUpdateSocialPublisherWorkspaceRequest = ISocialPublisherWorkspaceRequest;

export interface ISearchSocialPublisherWorkspaceParams {
    name?: string;
    description?: string;
    userId?: string;
    /**
     * API Key ID (optional)
     * You can use this field to filter workspaces by API key
     */
    apiKeyId?: string;
    /**
     * Tag (optional)
     * You can use this field to filter workspaces by tag
     */
    tag?: string;
    /**
     * Reference ID (optional)
     * You can use this field to filter workspaces by reference ID
     */
    refId?: string;
}

