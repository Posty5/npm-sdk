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
    | "invalidPostVideoURL";

export type SocialPublisherTaskType = "shortVideo";

export type SocialPublisherTaskAccountType =
    | "youtubeChannel"
    | "facebookPage"
    | "instagramAccount"
    | "tiktokAccount";

export type SocialPublisherTaskScheduleType = "now" | "schedule";

export type SocialPublisherTaskSourceType =
    | "video-file"
    | "video-url"
    | "facebook-video"
    | "youtube-video"
    | "tiktok-video"
    | "instagram-video";
