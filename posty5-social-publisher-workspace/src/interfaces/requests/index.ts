export interface ISocialPublisherWorkspaceRequest {
    name: string;
    description: string;
}

export type ICreateSocialPublisherWorkspaceRequest = ISocialPublisherWorkspaceRequest;
export type IUpdateSocialPublisherWorkspaceRequest = ISocialPublisherWorkspaceRequest;

export interface ISearchSocialPublisherWorkspaceParams {
    name?: string;
    description?: string;
    userId?: string;
}
