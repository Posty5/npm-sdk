import { IPaginationResponse } from '@posty5/core';
import { SocialPublisherTaskStatusType, SocialPublisherTaskType, SocialPublisherTaskSourceType } from "../../types/type";

export interface IUploadConfig {
    url: string;
    fields: Record<string, string>;
}

export interface IGenerateUploadUrlsResponse {
    uploadVideo: IUploadConfig;
    uploadThumb?: IUploadConfig;
    videoUplaodFileURL: string;
    thumbUploadFileURL?: string;
    organization: any;
}

export interface ISocialPublisherTaskStatusLog {
    status: SocialPublisherTaskStatusType;
    error: string;
    changedAt: Date;
}

export interface ISocialPublisherTaskPostInfo {
    platformAccountId: string;
    currentError: string;
    isAllow: boolean;
    currentStatus: SocialPublisherTaskStatusType;
    currentStatusChangedAt: Date;
    publishId: string;
    videoId: string;
    videoURL: string;
    statusHistory: { status: SocialPublisherTaskStatusType, changedAt: Date }[];
    socialPublisherAccountId: string | any;
}

export interface ISocialPublisherTaskPlatform {
    postInfo: ISocialPublisherTaskPostInfo;
    // Platform specific fields can be added here if needed for public response
}

export interface ISocialPublisherTaskResponse {
    _id: string;
    numbering: number;
    type: SocialPublisherTaskType;
    source: SocialPublisherTaskSourceType;
    currentStatus: SocialPublisherTaskStatusType;
    currentError: string;
    currentStatusChangedAt: Date;
    statusHistory: ISocialPublisherTaskStatusLog[];
    needsMaintenance: boolean;
    organization: {
        workspaceId: string;
    };
    tiktokAccount?: ISocialPublisherTaskPlatform;
    facebookPage?: ISocialPublisherTaskPlatform;
    instagramAccount?: ISocialPublisherTaskPlatform;
    youtubeChannel?: ISocialPublisherTaskPlatform;
    createdAt: string;
    updatedAt: string;
}

export interface ISocialPublisherTaskStatusResponse {
    status: SocialPublisherTaskStatusType;
    error?: string;
}

export interface ISocialPublisherTaskNextPreviousResponse {
    nextId?: string;
    previousId?: string;
}

export interface IDefaultSettingsResponse {
    // Define default settings structure if needed based on API response
    [key: string]: any;
}


export type ISearchSocialPublisherTaskResponse = IPaginationResponse<ISocialPublisherTaskResponse>;
export type ICreateSocialPublisherTaskResponse = ISocialPublisherTaskResponse;
