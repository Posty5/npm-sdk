import { SocialPublisherPostScheduleType, SocialPublisherPostSourceType } from "../../types/type";

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
  type: SocialPublisherPostScheduleType;
  scheduledAt?: Date;
}

/**
 * Image-post source — uploaded to our bucket or fetched from a public URL.
 */
export type ImageSourceType = "image-file" | "image-url";

/**
 * Image-post media block. One of `bucketKey` (uploaded) or `externalUrl`
 * (image-url) must be provided, matching the `source` discriminator.
 */
export interface IImageMediaRequest {
  source: ImageSourceType;
  /** Bucket file URL returned by `generate-upload-urls` (when source = image-file). */
  bucketKey?: string;
  /** Direct public image URL (when source = image-url). */
  externalUrl?: string;
  /** Optional metadata — server uses for soft validation. */
  width?: number;
  height?: number;
  /** e.g. "image/jpeg", "image/png", "image/webp". */
  mimeType?: string;
}

/**
 * Image-post create request (workspace target).
 * Image posts cost **5 credits** + 1 for an optional auto-comment.
 * YouTube community posts are always reported as `notSupported`.
 */
export interface ICreateImagePostToWorkspaceRequest {
  /** Workspace ID. */
  workspaceId: string;
  image: IImageMediaRequest;
  /** Shared caption used as the default per-platform description if no
   *  platform-specific block is supplied. 1..8000 chars. */
  caption: string;
  /** Marks the caption as AI-enhanced; surfaces on the status page. */
  aiEnhanced?: boolean;
  youtube?: IYouTubeConfig;
  tiktok?: ITikTokConfig;
  facebook?: IFacebookPageConfig;
  instagram?: IInstagramConfig;
  schedule?: IScheduleConfig;
  comment?: ICommentRequest;
  tag?: string;
  refId?: string;
}

/**
 * Image-post create request (single-account target).
 */
export interface ICreateImagePostToAccountRequest {
  /** Account ID. */
  accountId: string;
  image: IImageMediaRequest;
  caption: string;
  aiEnhanced?: boolean;
  youtube?: IYouTubeConfig;
  tiktok?: ITikTokConfig;
  facebook?: IFacebookPageConfig;
  instagram?: IInstagramConfig;
  schedule?: IScheduleConfig;
  comment?: ICommentRequest;
  tag?: string;
  refId?: string;
}

/**
 * Optional post-publish comment.
 * Adds a comment under each platform post once it is published.
 *
 * Pricing: +1 credit on top of the video charge (Pro plan).
 * TikTok comments are not supported by the platform and will always
 * be reported as `notSupported` in the status response.
 */
export interface ICommentRequest {
  /** Comment text (1..2200 characters). */
  text: string;
  /** Post the comment on Facebook (default: true). */
  postToFacebook?: boolean;
  /** Post the comment on Instagram (default: true). */
  postToInstagram?: boolean;
  /** Post the comment on YouTube (default: true). */
  postToYoutube?: boolean;
  /** Post the comment on TikTok (default: false — not supported by TikTok). */
  postToTiktok?: boolean;
}

export interface ICreateSocialPublisherPostRequest {
  /** Workspace ID */
  workspaceId: string;
  source: SocialPublisherPostSourceType;
  youtube?: IYouTubeConfig;
  tiktok?: ITikTokConfig;
  facebook?: IFacebookPageConfig;
  instagram?: IInstagramConfig;
  videoURL?: string;
  thumbURL?: string;
  postURL?: string;
  schedule?: IScheduleConfig;
  /**
   * Optional post-publish comment (Pro plan, +1 credit).
   * Once the video is published, a comment is added under each enabled
   * platform post. TikTok is not supported.
   */
  comment?: ICommentRequest;
  /**
   * Tag (optional)
   * Use this field to filter posts by tag.
   * You can pass any custom value from your system.
   */
  tag?: string;
  /**
   * Reference ID (optional)
   * Use this field to filter posts by reference ID.
   * You can pass any custom identifier from your system.
   */
  refId?: string;
}

export interface ICreateSocialPublisherAccountPostRequest {
  /** Account ID */
  accountId: string;
  source: SocialPublisherPostSourceType;
  youtube?: IYouTubeConfig;
  tiktok?: ITikTokConfig;
  facebook?: IFacebookPageConfig;
  instagram?: IInstagramConfig;
  videoURL?: string;
  thumbURL?: string;
  postURL?: string;
  schedule?: IScheduleConfig;
  /**
   * Optional post-publish comment (Pro plan, +1 credit).
   * Once the video is published, a comment is added under each enabled
   * platform post. TikTok is not supported.
   */
  comment?: ICommentRequest;
  /**
   * Tag (optional)
   * Use this field to filter posts by tag.
   * You can pass any custom value from your system.
   */
  tag?: string;
  /**
   * Reference ID (optional)
   * Use this field to filter posts by reference ID.
   * You can pass any custom identifier from your system.
   */
  refId?: string;
}

export interface IPostSetting {
  /** Workspace ID */
  workspaceId: string;
  youtube?: IYouTubeConfig;
  tiktok?: ITikTokConfig;
  facebook?: IFacebookPageConfig;
  instagram?: IInstagramConfig;
  schedule?: IScheduleConfig;
  source: SocialPublisherPostSourceType;
  /** Optional post-publish comment (Pro plan, +1 credit). TikTok is not supported. */
  comment?: ICommentRequest;
  /** Optional caller-supplied tag, persisted on the created post for filtering. */
  tag?: string;
  /** Optional caller-supplied reference ID, persisted on the created post for filtering. */
  refId?: string;
}

export interface IAccountPostSetting {
  /** Account ID */
  accountId: string;
  youtube?: IYouTubeConfig;
  tiktok?: ITikTokConfig;
  facebook?: IFacebookPageConfig;
  instagram?: IInstagramConfig;
  schedule?: IScheduleConfig;
  source: SocialPublisherPostSourceType;
  /** Optional post-publish comment (Pro plan, +1 credit). TikTok is not supported. */
  comment?: ICommentRequest;
  /** Optional caller-supplied tag, persisted on the created post for filtering. */
  tag?: string;
  /** Optional caller-supplied reference ID, persisted on the created post for filtering. */
  refId?: string;
}

export interface IGenerateUploadUrlsRequest {
  thumbFileType?: string;
  videoFileType?: string;
}

/**
 * Simplified options for the unified publish() method
 * This provides a more user-friendly API compared to the detailed IPostSetting
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
   * YouTube-specific configuration.
   * Required if the workspace has a YouTube account connected.
   */
  youtube?: IYouTubeConfig;

  /**
   * TikTok-specific configuration.
   * Required if the workspace has a TikTok account connected.
   */
  tiktok?: ITikTokConfig;

  /**
   * Facebook Page-specific configuration.
   * Required if the workspace has a Facebook Page connected.
   */
  facebook?: IFacebookPageConfig;

  /**
   * Instagram-specific configuration.
   * Required if the workspace has an Instagram account connected.
   */
  instagram?: IInstagramConfig;

  /**
   * Optional scheduling
   * - 'now': Publish immediately (default)
   * - Date: Schedule for specific date/time
   */
  schedule?: "now" | Date;

  /**
   * Optional tag for categorization
   */
  tag?: string;

  /**
   * Optional reference ID for external systems
   */
  refId?: string;

  /**
   * Optional post-publish comment (Pro plan, +1 credit).
   * TikTok comments are not supported.
   */
  comment?: ICommentRequest;
}

/**
 * Options for publishing to an account
 */
export interface IPublishToAccountOptions {
  /**
   * Account ID (required)
   */
  accountId: string;

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
   * YouTube-specific configuration.
   * Required if the workspace has a YouTube account connected.
   */
  youtube?: IYouTubeConfig;

  /**
   * TikTok-specific configuration.
   * Required if the workspace has a TikTok account connected.
   */
  tiktok?: ITikTokConfig;

  /**
   * Facebook Page-specific configuration.
   * Required if the workspace has a Facebook Page connected.
   */
  facebook?: IFacebookPageConfig;

  /**
   * Instagram-specific configuration.
   * Required if the workspace has an Instagram account connected.
   */
  instagram?: IInstagramConfig;

  /**
   * Optional scheduling
   * - 'now': Publish immediately (default)
   * - Date: Schedule for specific date/time
   */
  schedule?: "now" | Date;

  /**
   * Optional tag for categorization
   */
  tag?: string;

  /**
   * Optional reference ID for external systems
   */
  refId?: string;

  /**
   * Optional post-publish comment (Pro plan, +1 credit).
   * TikTok comments are not supported.
   */
  comment?: ICommentRequest;
}

/**
 * Base interface for quick publish options
 * Contains common fields shared across all platform-specific publish methods
 */
export interface IQuickPublishBaseOptions {
  /**
   * Workspace ID (required)
   * The workspace where the post will be created
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
  schedule?: "now" | Date;

  /**
   * Optional tag for categorization
   * Use this to group and filter posts by custom tags
   *
   * @example 'campaign-2024', 'product-launch', 'seasonal'
   */
  tag?: string;

  /**
   * Optional reference ID for external systems
   * Use this to link posts with your external system's identifiers
   *
   * @example 'external-id-123', 'crm-campaign-456'
   */
  refId?: string;

  /**
   * Optional post-publish comment (Pro plan, +1 credit).
   * TikTok comments are not supported.
   */
  comment?: ICommentRequest;
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

export interface IListParams {
  caption?: string;

  numbering?: string;
  currentStatus?: string;
  workspaceId?: string;
  refId?: string;
  tag?: string;
  "youtube.postInfo.isAllow"?: boolean;
  "facebook.postInfo.isAllow"?: boolean;
  "instagram.postInfo.isAllow"?: boolean;
  "tiktok.postInfo.isAllow"?: boolean;
}
