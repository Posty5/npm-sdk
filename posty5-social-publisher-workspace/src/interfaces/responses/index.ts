import { IPaginationResponse } from '@posty5/core';
export type SocialPublisherAccountStatusType = "active" | "inactive" | "authenticationExpired";

export interface ISocialPublisherAccountSampleDetails {
    link: string;
    name: string;
    thumbnail: string;
    platformAccountId: string;
    status: SocialPublisherAccountStatusType;
}

export interface ISocialPublisherWorkspaceAccount {
    youtube?: ISocialPublisherAccountSampleDetails | any;
    facebook?: ISocialPublisherAccountSampleDetails | any;
    instagram?: ISocialPublisherAccountSampleDetails | any;
    tiktok?: ISocialPublisherAccountSampleDetails | any;
    facebookPlatformPageId?: string;
    instagramPlatformAccountId?: string;
}

export interface ISocialPublisherWorkspaceResponse {
    _id: string;
    name: string;
    account: ISocialPublisherWorkspaceAccount;
}

export interface ISocialPublisherWorkspaceSampleDetails {
    _id: string;
    name: string;
    description: string;
    imageUrl?: string; // URL to workspace logo/image
    userId?: string | any;
    createdAt?: string;
}

/**
 * Upload image configuration returned by API
 */
export interface IUploadImageConfig {
    uploadUrl: string;
    imageUrl: string;
}

/**
 * Workspace details with upload config
 */
export interface IWorkspaceWithUploadConfig {
    workspace: ISocialPublisherWorkspaceSampleDetails;
    uploadImageConfig: IUploadImageConfig | null;
}

export type ISearchSocialPublisherWorkspaceResponse = IPaginationResponse<ISocialPublisherWorkspaceSampleDetails>;
export type ICreateSocialPublisherWorkspaceResponse = IWorkspaceWithUploadConfig; // Returns workspace and upload config
export type IUpdateSocialPublisherWorkspaceResponse = IWorkspaceWithUploadConfig; // Returns workspace and upload config
export interface IDeleteSocialPublisherWorkspaceResponse {
    message?: string;
}
