export type SocialPublisherTaskStatusType =
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

export type SocialPublisherTaskType = "shortVideo";

export type SocialPublisherTaskAccountType = "youtube" | "facebook" | "instagram" | "tiktok";

export type SocialPublisherTaskScheduleType = "now" | "schedule";

export type SocialPublisherTaskSourceType = "video-file" | "video-url" | "facebook-video" | "youtube-video" | "tiktok-video";
// | "instagram-video";

export type SocialPublisherAccountType = "youtube" | "facebook" | "tiktok";
export type SocialPublisherAccountAccountType = "facebook" | "instagram" | "youtube" | "tiktok";

export type SocialPublisherAccountStatusType = "active" | "inactive" | "authenticationExpired";
