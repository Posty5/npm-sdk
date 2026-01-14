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
    userId?: string | any;
    createdAt?: string;
}

export type ISearchSocialPublisherWorkspaceResponse = IPaginationResponse<ISocialPublisherWorkspaceSampleDetails>;
export type ICreateSocialPublisherWorkspaceResponse = string; // Returns ID string
export type IUpdateSocialPublisherWorkspaceResponse = string; // Returns success message string usually, but module says it returns string message "Workspace Updated Successfully"
export interface IDeleteSocialPublisherWorkspaceResponse {
    message?: string;
}
