import { IPaginationResponse } from '@posty5/core';
export type SocialPublisherAccountStatusType = "active" | "inactive" | "authenticationExpired";

export interface IAccountSampleDetails {
    link: string;
    name: string;
    thumbnail: string;
    platformAccountId: string;
    status: SocialPublisherAccountStatusType;
}

export interface IWorkspaceAccount {
    youtube?: IAccountSampleDetails | any;
    facebook?: IAccountSampleDetails | any;
    instagram?: IAccountSampleDetails | any;
    tiktok?: IAccountSampleDetails | any;
    facebookPlatformPageId?: string;
    instagramPlatformAccountId?: string;
}

export interface IWorkspaceResponse {
    _id: string;
    name: string;
    account: IWorkspaceAccount;
}

export interface IWorkspaceSampleDetails {
    _id: string;
    name: string;
    description: string;
    imageUrl?: string; // URL to workspace logo/image
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
    workspaceId: string;
    uploadImageConfig: IUploadImageConfig | null;
}

export type ISearchWorkspaceResponse = IPaginationResponse<IWorkspaceSampleDetails>;
export type ICreateWorkspaceResponse = IWorkspaceWithUploadConfig; // Returns workspace and upload config
export type IUpdateWorkspaceResponse = IWorkspaceWithUploadConfig; // Returns workspace and upload config
export interface IDeleteWorkspaceResponse {
    message?: string;
}
