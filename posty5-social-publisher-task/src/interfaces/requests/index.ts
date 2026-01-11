import { SocialPublisherTaskScheduleType, SocialPublisherTaskSourceType } from "../../types/type";

export interface IYouTubeConfig {
    title: string;
    description: string;
    tags: string[];
    madeForKids?: boolean;
    defaultLanguage?: string;
    defaultAudioLanguage?: string;
    categoryId?: string;
    localizationLanguages?: string[];
}

export interface ITikTokConfig {
    caption: string;
    disable_duet: boolean;
    disable_stitch: boolean;
    disable_comment: boolean;
    privacy_level: string;
}

export interface IFacebookPageConfig {
    description: string;
    title?: string;
}

export interface IInstagramConfig {
    description: string;
    share_to_feed?: boolean;
    is_published_to_both_feed_and_story?: boolean;
}

export interface IScheduleConfig {
    type: SocialPublisherTaskScheduleType;
    scheduledAt?: Date;
}

export interface ICreateSocialPublisherTaskRequest {
    /** Workspace ID */
    workspaceId: string;
    source: SocialPublisherTaskSourceType;
    isAllowYouTube: boolean;
    isAllowTiktok: boolean;
    isAllowFacebookPage: boolean;
    isAllowInstagram: boolean;
    youTube?: IYouTubeConfig;
    tiktok?: ITikTokConfig;
    facebookPage?: IFacebookPageConfig;
    instagram?: IInstagramConfig;
    videoURL?: string;
    thumbURL?: string;
    postURL?: string;
    schedule?: IScheduleConfig;
    /**
     * Tag (optional)
     * Use this field to filter tasks by tag.
     * You can pass any custom value from your system.
     */
    tag?: string;
    /**
     * Reference ID (optional)
     * Use this field to filter tasks by reference ID.
     * You can pass any custom identifier from your system.
     */
    refId?: string;
}


export interface ITaskSetting {
    /** Workspace ID */
    workspaceId: string;
    isAllowYouTube: boolean;
    isAllowTiktok: boolean;
    isAllowFacebookPage: boolean;
    isAllowInstagram: boolean;
    youTube?: IYouTubeConfig;
    tiktok?: ITikTokConfig;
    facebookPage?: IFacebookPageConfig;
    instagram?: IInstagramConfig;
    schedule?: IScheduleConfig;
}


export interface IGenerateUploadUrlsRequest {
    thumbFileType?: string;
    videoFileType?: string;
}
