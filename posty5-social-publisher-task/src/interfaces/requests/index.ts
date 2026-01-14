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
    facebook?: IFacebookPageConfig;
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
    facebook?: IFacebookPageConfig;
    instagram?: IInstagramConfig;
    schedule?: IScheduleConfig;
    source: SocialPublisherTaskSourceType;
}


export interface IGenerateUploadUrlsRequest {
    thumbFileType?: string;
    videoFileType?: string;
}

/**
 * Simplified options for the unified publish() method
 * This provides a more user-friendly API compared to the detailed ITaskSetting
 */
export interface IPublishOptions {
    /**
     * Workspace ID (required)
     */
    workspaceId: string;

    /**
     * Video source (required)
     * Can be:
     * - File object (will be uploaded)
     * - Direct video URL (http://... or https://...)
     * - Facebook video URL (auto-detected for repost)
     * - TikTok video URL (auto-detected for repost)
     * - YouTube Shorts URL (auto-detected for repost)
     */
    video: File | string;

    /**
     * Optional thumbnail
     * Can be:
     * - File object (will be uploaded)
     * - URL string (will be used directly)
     */
    thumbnail?: File | string;

    /**
     * Platforms to publish to (required)
     * At least one platform must be specified
     */
    platforms: Array<'youtube' | 'tiktok' | 'facebook' | 'instagram'>;

    /**
     * YouTube-specific configuration
     * Required if 'youtube' is in platforms array
     */
    youtube?: IYouTubeConfig;

    /**
     * TikTok-specific configuration
     * Required if 'tiktok' is in platforms array
     */
    tiktok?: ITikTokConfig;

    /**
     * Facebook Page-specific configuration
     * Required if 'facebook' is in platforms array
     */
    facebook?: IFacebookPageConfig;

    /**
     * Instagram-specific configuration
     * Required if 'instagram' is in platforms array
     */
    instagram?: IInstagramConfig;

    /**
     * Optional scheduling
     * - 'now': Publish immediately (default)
     * - Date: Schedule for specific date/time
     */
    schedule?: 'now' | Date;

    /**
     * Optional tag for categorization
     */
    tag?: string;

    /**
     * Optional reference ID for external systems
     */
    refId?: string;
}

/**
 * Base interface for quick publish options
 * Contains common fields shared across all platform-specific publish methods
 */
export interface IQuickPublishBaseOptions {
    /**
     * Workspace ID (required)
     * The workspace where the task will be created
     */
    workspaceId: string;

    /**
     * Video source (required)
     * Can be:
     * - File object: Will be uploaded to cloud storage
     * - URL string: Direct video URL or platform URL (Facebook, TikTok, YouTube)
     * 
     * Supported formats: .mp4, .mov, .avi, .mkv, .webm
     */
    video: File | string;

    /**
     * Optional thumbnail image
     * Can be:
     * - File object: Will be uploaded to cloud storage
     * - URL string: Direct image URL
     * 
     * If not provided, platforms may auto-generate a thumbnail
     */
    thumbnail?: File | string;

    /**
     * Optional scheduling
     * - 'now': Publish immediately (default)
     * - Date object: Schedule for specific date/time
     * 
     * @default 'now'
     */
    schedule?: 'now' | Date;

    /**
     * Optional tag for categorization
     * Use this to group and filter tasks by custom tags
     * 
     * @example 'campaign-2024', 'product-launch', 'seasonal'
     */
    tag?: string;

    /**
     * Optional reference ID for external systems
     * Use this to link tasks with your external system's identifiers
     * 
     * @example 'external-id-123', 'crm-campaign-456'
     */
    refId?: string;
}

/**
 * Quick publish options for YouTube only
 * Extends base options with YouTube-specific fields
 */
export interface IQuickPublishYouTubeOptions extends IQuickPublishBaseOptions {
    /**
     * Video title (required)
     * Maximum 100 characters
     * 
     * @example 'How to Build a Web App in 2024'
     */
    title: string;

    /**
     * Video description (required)
     * Maximum 5000 characters
     * Supports line breaks and URLs
     * 
     * @example 'In this tutorial, we will build...'
     */
    description: string;

    /**
     * Video tags (required)
     * Array of keywords for video discovery
     * Maximum 500 characters total
     * 
     * @example ['tutorial', 'web development', 'javascript']
     */
    tags: string[];

    /**
     * Whether the video is made for kids
     * Required by YouTube's COPPA compliance
     * 
     * @default false
     */
    madeForKids?: boolean;
}

/**
 * Quick publish options for TikTok only
 * Extends base options with TikTok-specific fields
 */
export interface IQuickPublishTikTokOptions extends IQuickPublishBaseOptions {
    /**
     * Video caption (required)
     * Maximum 2200 characters
     * Supports hashtags and mentions
     * 
     * @example 'Check out this amazing tutorial! #coding #webdev'
     */
    caption: string;

    /**
     * Privacy level for the video
     * - 'public': Visible to everyone
     * - 'friends': Visible to friends only
     * - 'private': Only visible to you
     * 
     * @default 'public'
     */
    privacy_level?: string;

    /**
     * Disable duet feature
     * If true, other users cannot create duets with this video
     * 
     * @default false
     */
    disable_duet?: boolean;

    /**
     * Disable stitch feature
     * If true, other users cannot create stitches with this video
     * 
     * @default false
     */
    disable_stitch?: boolean;

    /**
     * Disable comments
     * If true, users cannot comment on this video
     * 
     * @default false
     */
    disable_comment?: boolean;
}

/**
 * Quick publish options for Facebook only
 * Extends base options with Facebook-specific fields
 */
export interface IQuickPublishFacebookOptions extends IQuickPublishBaseOptions {
    /**
     * Video title (required)
     * Maximum 255 characters
     * 
     * @example 'Amazing Product Demo'
     */
    title: string;

    /**
     * Video description (required)
     * Maximum 63,206 characters
     * Supports line breaks, mentions, and hashtags
     * 
     * @example 'Check out our new product features...'
     */
    description: string;
}

/**
 * Quick publish options for Instagram only
 * Extends base options with Instagram-specific fields
 */
export interface IQuickPublishInstagramOptions extends IQuickPublishBaseOptions {
    /**
     * Video caption/description (required)
     * Maximum 2,200 characters
     * Supports hashtags and mentions
     * 
     * @example 'New video is live! Check it out 🎥 #instagram #video'
     */
    description: string;

    /**
     * Share to Instagram feed
     * If true, video will appear in main feed
     * 
     * @default false
     */
    share_to_feed?: boolean;

    /**
     * Publish to both feed and story
     * If true, video will appear in both feed and story
     * 
     * @default false
     */
    is_published_to_both_feed_and_story?: boolean;
}

/**
 * Quick publish options for all platforms with universal caption
 * Extends base options with a single caption field used across all platforms
 */
export interface IQuickPublishAllOptions extends IQuickPublishBaseOptions {
    /**
     * Universal caption for all platforms (required)
     * This caption will be used as:
     * - YouTube: title and description
     * - TikTok: caption
     * - Facebook: title and description
     * - Instagram: description
     * 
     * Keep it concise for best results across all platforms
     * 
     * @example 'Check out my new video!'
     */
    caption: string;
}

