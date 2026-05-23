export type SocialPublisherPostStatusType =
  | "pending"
  | "processing"
  | "processingInPlatform"
  | "failedByPlatform"
  | "done"
  | "error"
  | "canceled"
  | "needsMaintenance"
  | "invalidVideoURL"
  | "invalidPostVideoURL"
  | "retrying";

export type SocialPublisherPostType = "shortVideo";

export type SocialPublisherPostAccountType = "youtube" | "facebook" | "instagram" | "tiktok";

export type SocialPublisherPostScheduleType = "now" | "schedule";

export type SocialPublisherPostSourceType = "video-file" | "video-url" | "facebook-video" | "youtube-video" | "tiktok-video";
// | "instagram-video";

/**
 * Status of the optional post-publish comment, reported per-platform.
 * - `pending`: queued, waiting for the parent post to be published
 * - `processing`: comment request is in flight
 * - `done`: comment posted successfully
 * - `error`: comment failed (see `currentError`)
 * - `skipped`: caller opted out for this platform (e.g. postToFacebook=false)
 * - `notSupported`: platform does not allow programmatic comments (TikTok)
 */
export type CommentStatusType = "pending" | "processing" | "done" | "error" | "skipped" | "notSupported";

export type SocialPublisherAccountPlatformType = "youtube" | "facebook" | "tiktok";
export type SocialPublisherAccountAccountType = "facebook" | "instagram" | "youtube" | "tiktok";

export type SocialPublisherAccountStatusType = "active" | "inactive" | "authenticationExpired";
