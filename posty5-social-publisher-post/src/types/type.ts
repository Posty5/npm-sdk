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

export type SocialPublisherAccountPlatformType = "youtube" | "facebook" | "tiktok";
export type SocialPublisherAccountAccountType = "facebook" | "instagram" | "youtube" | "tiktok";

export type SocialPublisherAccountStatusType = "active" | "inactive" | "authenticationExpired";
