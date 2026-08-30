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
  | "retrying"
  | "removing"
  | "removed"
  | "removeFailed";

/**
 * Content type of a post.
 *
 * `longVideo` was added in 4.2.0; `image` and `text` were always returned by
 * the API but missing from this union. Code that switches on this field must
 * handle values it does not recognise — the set grows as the platform does.
 */
export type SocialPublisherPostType = "shortVideo" | "longVideo" | "image" | "text";

export type SocialPublisherPostAccountType = "youtube" | "facebook" | "instagram" | "tiktok";

export type SocialPublisherPostScheduleType = "now" | "schedule";

export type SocialPublisherPostSourceType = "video-file" | "video-url";

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
