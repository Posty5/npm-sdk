import { IPaginationResponse } from "@posty5/core";
import { SocialPublisherPostStatusType, SocialPublisherPostSourceType, SocialPublisherAccountStatusType, CommentStatusType } from "../../types/type";

export interface IUploadConfig {
  url: string;
  fields: Record<string, string>;
}

/**
 * One upload destination the API authorized.
 *
 * The same slot is offered two ways. `uploadFileURL` is a signed R2 PUT — one
 * request, no resume. The `tus*` fields describe the same destination as a
 * resumable transfer. Both land the file at `fileURL`, so nothing downstream
 * cares which was used.
 *
 * The resumable fields are optional on purpose: an API not deployed with the
 * resumable service omits them, and clients fall back to the signed PUT.
 */
export interface IUploadTarget {
  /** Public URL of the finished object. Known before the upload starts. */
  fileURL: string | undefined;
  /** Signed URL for a single PUT. */
  uploadFileURL: string | undefined;
  /** Object key inside the bucket. */
  bucketFilePath: string | undefined;
  /**
   * Absolute tus endpoint for this same destination, when resumable uploads
   * are configured.
   */
  tusEndpoint?: string;
  /**
   * Signed capability naming this exact destination, sent as the tus
   * `Upload-Metadata` key `ticket`. Short-lived, and never to be logged or
   * persisted.
   */
  ticket?: string;
  /** When the ticket stops being accepted for creating an upload. */
  ticketExpiresAt?: string;
  /** Maximum accepted size in bytes, so a client can fail fast. */
  maxSize?: number;
}

export interface IGenerateUploadUrlsResponse {
  postId: string;

  thumb: IUploadTarget;

  video: IUploadTarget;
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
  type?: "shortVideo" | "longVideo" | "image" | string;
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

  type: "shortVideo" | "longVideo" | "image";
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

  /** Long-video metadata — only present when `type === "longVideo"`. */
  video?: IVideoDTO;

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
  /** Custom reference id supplied when the post was created. */
  refId?: string;
  /** Custom tag supplied when the post was created. */
  tag?: string;
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

// ─── Long video (up to 60 minutes) ─────────────────────────────────────────

/**
 * Long-video metadata carried on a post. Present only when the post's `type`
 * is `longVideo`.
 */
export interface IVideoDTO {
  /** Duration measured server-side, in seconds. */
  durationSeconds: number;
  /** Charge units billed — one per started 5 minutes. */
  creditUnits?: number;
  container?: string;
  videoCodec?: string;
  audioCodec?: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
}

/** What one platform would do with a video of a given length. */
export interface ILongVideoPlatformVerdict {
  platform: "youtube" | "facebook" | "instagram" | "tiktok";
  accepted: boolean;
  /** The limit that applied, in seconds, when one did. */
  limitSeconds?: number;
  /** Why the platform refused. Present only when `accepted` is false. */
  reason?: string;
}

/**
 * Result of {@link SocialPublisherPostClient.getLongVideoQuote} — what the
 * post will cost, before committing to it.
 */
export interface ILongVideoQuoteResponse {
  /** Duration measured server-side, in seconds, rounded up. */
  durationSeconds: number;
  /** The ceiling the API enforces (3600). */
  maxDurationSeconds: number;
  /** False when the video is over the ceiling; `reason` then says by how much. */
  withinLimit: boolean;
  /** Charge units — one per started 5 minutes. Zero when over the limit. */
  units: number;
  /** This plan's cost per unit (50 by default). */
  creditsPerUnit: number;
  /** Total credits the post will cost. */
  credits: number;
  /** True when the plan does not include long video posting. */
  isGated: boolean;
  container?: string;
  videoCodec?: string;
  width?: number;
  height?: number;
  /** What each platform would do with a video this long. */
  platforms: ILongVideoPlatformVerdict[];
  /** Present only when `withinLimit` is false. */
  reason?: string;
}

/**
 * A connected platform dropped from a workspace post because the video is too
 * long for it. The rest of the post still publishes.
 */
export interface ILongVideoRefusedTarget {
  platform: "youtube" | "facebook" | "instagram" | "tiktok";
  /** Names that platform's limit and this video's length. */
  reason: string;
}

/**
 * Result of publishing a long video. Unlike the short-video helpers, which
 * return just an id, this carries what was measured and what was charged —
 * and which targets, if any, were dropped for exceeding their own limit.
 */
export interface IPublishLongVideoResult {
  /** Created post ID. */
  _id: string;
  /** Duration measured server-side, in seconds. */
  durationSeconds: number;
  /** Charge units billed. */
  creditUnits: number;
  /** Credits actually charged. */
  credits: number;
  /**
   * Targets dropped because the video exceeded their duration limit. Empty
   * when every connected account accepted it. Always empty for account-targeted
   * posts, which are refused outright rather than partially published.
   */
  refusedTargets: ILongVideoRefusedTarget[];
}
