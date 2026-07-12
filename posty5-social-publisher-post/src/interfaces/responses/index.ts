import { IPaginationResponse } from "@posty5/core";
import { SocialPublisherPostStatusType, SocialPublisherPostSourceType, SocialPublisherAccountStatusType, CommentStatusType } from "../../types/type";

export interface IUploadConfig {
  url: string;
  fields: Record<string, string>;
}

export interface IGenerateUploadUrlsResponse {
  postId: string;

  thumb: {
    /**
     * Public URL to access file from Cloud Bucket
     */
    fileURL: string | undefined;
    /**
     * Upload URL to upload file to Cloud Bucket (Signed URL)
     */
    uploadFileURL: string | undefined;
    /**
     * Path in Cloud Bucket
     */
    bucketFilePath: string | undefined;
  };

  video: {
    /**
     * Public URL to access file from Cloud Bucket
     */
    fileURL: string | undefined;
    /**
     * Upload URL to upload file to Cloud Bucket (Signed URL)
     */
    uploadFileURL: string | undefined;
    /**
     * Path in Cloud Bucket
     */
    bucketFilePath: string | undefined;
  };
}

/**
 * Per-platform outcome of a {@link SocialPublisherPostClient.removePost} call.
 * `notSupported` marks platforms (Instagram, TikTok) whose API can't delete a
 * published post; `skipped` marks platforms that had nothing to delete.
 */
export interface IRemovePostPlatformResult {
  success: boolean;
  notSupported?: boolean;
  skipped?: boolean;
  error?: string;
}

export interface IRemovePostResponse {
  _id: string;
  results: Partial<Record<"youtube" | "facebook" | "instagram" | "tiktok", IRemovePostPlatformResult>>;
}

export interface ISocialPublisherPostStatusLog {
  status: SocialPublisherPostStatusType;
  error: string;
  changedAt: Date;
}

export interface ISocialPublisherPostInfo {
  platformAccountId: string;
  currentError: string;
  isAllow: boolean;
  currentStatus: SocialPublisherPostStatusType;
  currentStatusChangedAt: Date;
  publishId: string;
  videoId: string;
  videoURL: string;
  statusHistory: { status: SocialPublisherPostStatusType; changedAt: Date }[];
  socialPublisherAccountId: string | any;
}

/**
 * Image-post metadata on the post status response.
 * Only present when `type === "image"`.
 */
export interface IImageDTO {
  source: "image-file" | "image-url";
  bucketKey?: string;
  externalUrl?: string;
  width?: number;
  height?: number;
  mimeType?: string;
  /** True when the caption was AI-enhanced before publish. */
  aiEnhanced?: boolean;
  /** Set after the bucket cleanup job runs (uploaded files only). */
  deletedFromBucketAt?: Date;
}

/**
 * Per-platform comment status block returned on the post status response.
 * Present only when the post was created with a `comment` payload.
 *
 * TikTok always returns `currentStatus = "notSupported"`.
 */
export interface ICommentInfoDTO {
  /** Whether the caller opted in for this platform (mirrors the request flag). */
  isAllow?: boolean;
  /** Current per-platform comment status. */
  currentStatus?: CommentStatusType;
  /** Last error message (when `currentStatus === "error"`). */
  currentError?: string;
  /** ID of the comment on the platform (when posted). */
  externalCommentId?: string;
  /** Public URL of the comment on the platform (when posted). */
  commentURL?: string;
  /** Timestamp the comment was successfully posted. */
  postedAt?: Date;
  /** Grouped history of status transitions for this platform comment. */
  statusHistoryGrouped?: IBaseStatusHistoryGroupedDay<CommentStatusType>[];
}

export interface ISocialPublisherPostPlatform {
  postInfo: ISocialPublisherPostInfo;
  // Platform specific fields can be added here if needed for public response
}

export interface ISocialPublisherPostResponse {
  _id: string;
  numbering: string;
  caption: string;
  createdAt: Date;
  currentStatus: SocialPublisherPostStatusType;
  isAllow: {
    tiktok: boolean;
    facebookPage: boolean;
    instagram: boolean;
    youtube: boolean;
  };

  workspace: {
    _id: string;
    name: string;
  };

  schedule: {
    type: "schedule" | "now";
    scheduledAt: Date;
    executedAt: Date;
  };

  updatedAt: Date;
  isToWorkspace: boolean;
  account: {
    name: string;
    platform: string;
    thumbnail: string;
  };

  refId: string;
  tag: string;

  // Media descriptors so list cards can preview the post's source upload
  // (image/video), falling back to the stored thumbnail.
  type?: "shortVideo" | "image" | string;
  source?: SocialPublisherPostSourceType | string;
  sourceURLs?: {
    thumbURL?: string;
    videoURL?: string;
    postURL?: string;
    imageURL?: string;
  };
  image?: { externalUrl?: string };
}

export interface ISocialPublisherPostStatusResponse {
  _id: string;
  numbering: string;

  type: "shortVideo" | "image";
  source: SocialPublisherPostSourceType;
  sourceURLs: {
    /**
     * Thumbnail URL, can be null if didn't upload any thumbnail or passed URL
     */
    thumbURL?: string | null;
    /**
     * Video URL, can be null if didn't upload any video or passed URL
     */
    videoURL?: string;
    /**
     * Image URL (image-post type). Returned for posts of `type: "image"`.
     */
    imageURL?: string;
    /**
     * Post URL, can be null if didn't upload any post or passed URL for platforms like facebook, tiktok, youtube
     */
  };

  /** Image-post metadata — only present when `type === "image"`. */
  image?: IImageDTO;

  currentStatus: SocialPublisherPostStatusType;
  currentError: string;
  currentStatusChangedAt: string;

  statusHistoryGrouped: IBaseStatusHistoryGroupedDay<SocialPublisherPostStatusType>[];
  tiktok?: ISocialPublisherPostTikTokPostDetails;
  facebook?: ISocialPublisherPostFacebookPagePostDetails;
  instagram?: ISocialPublisherPostInstagramPostDetails;
  youtube?: ISocialPublisherPostYouTubePostDetails;

  workspace: ISocialPublisherWorkspace;
  createdAt: Date;
  startedAt: Date;
  schedule: {
    type: "schedule" | "now";
    scheduledAt: Date;
    executedAt: Date;
  };
}

export interface ISocialPublisherWorkspace {
  _id: string;
  name: string;
  description: string;
  createdAt: Date;
  account: {
    youtube?: ISocialPublisherAccount;
    tiktok?: ISocialPublisherAccount;
    facebook?: ISocialPublisherAccount;
    instagram?: ISocialPublisherAccount;
  };
}

export interface ISocialPublisherAccount {
  _id: string;
  status: SocialPublisherAccountStatusType;
  link: string;
  name: string;
  thumbnail: string;
  platformAccountId: string;
}

export interface ISocialPublisherPostAccount {
  tags: string[];
  postInfo: {
    isAllow: boolean;
    currentStatus: SocialPublisherPostStatusType;
    statusHistoryGrouped: IBaseStatusHistoryGroupedDay<SocialPublisherPostStatusType>[];
    videoURL: string;
    socialPublisherAccount: ISocialPublisherAccount;
  };
}

export interface ISocialPublisherPostTikTokPostDetails extends ISocialPublisherPostAccount {
  caption: string;
  disable_duet: boolean;
  disable_stitch: boolean;
  disable_comment: boolean;
  privacy_level: string;
  /** Per-platform comment status — TikTok always reports `notSupported`. */
  commentInfo?: ICommentInfoDTO;
}
export interface ISocialPublisherPostFacebookPagePostDetails extends ISocialPublisherPostAccount {
  description: string;
  title: string;
  /** Per-platform comment status (only present when a comment was requested). */
  commentInfo?: ICommentInfoDTO;
}

export interface ISocialPublisherPostInstagramPostDetails extends ISocialPublisherPostAccount {
  description: string;
  share_to_feed: boolean;
  is_published_to_both_feed_and_story: boolean;
  /** Per-platform comment status (only present when a comment was requested). */
  commentInfo?: ICommentInfoDTO;
}

export interface ISocialPublisherPostYouTubePostDetails extends ISocialPublisherPostAccount {
  title: string;
  description: string;
  tags: string[];
  madeForKids: boolean;
  defaultLanguage: string;
  defaultAudioLanguage: string;
  categoryId: string;
  localizationLanguages: string[];
  localizations: any;
  /** Per-platform comment status (only present when a comment was requested). */
  commentInfo?: ICommentInfoDTO;
}

export interface ISocialPublisherPostNextPreviousResponse {
  nextId?: string;
  previousId?: string;
}

export interface IDefaultSettingsResponse {
  // Define default settings structure if needed based on API response
  [key: string]: any;
}

export type ISearchSocialPublisherPostResponse = IPaginationResponse<ISocialPublisherPostResponse>;

export interface IBaseStatusHistoryGroupedDay<StatusType> {
  day: Date;
  history: IBaseStatusHistoryGroupedItem<StatusType>[];
}

export interface IBaseStatusHistoryGroupedItem<StatusType> {
  time: Date;
  status: StatusType;
}
