import { IPaginationResponse } from "@posty5/core";
import { SocialPublisherTaskStatusType, SocialPublisherTaskSourceType, SocialPublisherAccountStatusType } from "../../types/type";

export interface IUploadConfig {
  url: string;
  fields: Record<string, string>;
}

export interface IGenerateUploadUrlsResponse {
  taskId: string;

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

export interface ISocialPublisherTaskStatusLog {
  status: SocialPublisherTaskStatusType;
  error: string;
  changedAt: Date;
}

export interface ISocialPublisherTaskPostInfo {
  platformAccountId: string;
  currentError: string;
  isAllow: boolean;
  currentStatus: SocialPublisherTaskStatusType;
  currentStatusChangedAt: Date;
  publishId: string;
  videoId: string;
  videoURL: string;
  statusHistory: { status: SocialPublisherTaskStatusType; changedAt: Date }[];
  socialPublisherAccountId: string | any;
}

export interface ISocialPublisherTaskPlatform {
  postInfo: ISocialPublisherTaskPostInfo;
  // Platform specific fields can be added here if needed for public response
}

export interface ISocialPublisherTaskResponse {
  _id: string;
  numbering: string;
  caption: string;
  createdAt: Date;
  currentStatus: SocialPublisherTaskStatusType;
  isAllowYoutubeChannel: boolean;
  isAllowFacebookPage: boolean;
  isAllowInstagramAccount: boolean;
  isAllowTiktokAccount: boolean;
  workspaceName: string;
  scheduleType: "schedule" | "now";
  scheduleScheduledAt: Date | null;
  scheduleExecutedAt: Date | null;
}

export interface ISocialPublisherTaskStatusResponse {
  _id: string;
  numbering: string;

  type: "shortVideo";
  source: SocialPublisherTaskSourceType;
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
     * Post URL, can be null if didn't upload any post or passed URL for platforms like facebook, tiktok, youtube
     */
    postURL?: string;
  };

  currentStatus: SocialPublisherTaskStatusType;
  currentError: string;
  currentStatusChangedAt: string;

  statusHistoryGrouped: IBaseStatusHistoryGroupedDay<SocialPublisherTaskStatusType>[];
  tiktokAccount?: ISocialPublisherTaskTikTokPostDetails;
  facebookPage?: ISocialPublisherTaskFacebookPagePostDetails;
  instagramAccount?: ISocialPublisherTaskInstagramAccountPostDetails;
  youtubeChannel?: ISocialPublisherTaskYouTubePostDetails;

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
    youtubeChannel?: ISocialPublisherAccount;
    tiktokAccount?: ISocialPublisherAccount;
    facebookPage?: ISocialPublisherAccount;
    instagramAccount?: ISocialPublisherAccount;
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

export interface ISocialPublisherTaskAccount {
  tags: string[];
  postInfo: {
    isAllow: boolean;
    currentStatus: SocialPublisherTaskStatusType;
    statusHistoryGrouped: IBaseStatusHistoryGroupedDay<SocialPublisherTaskStatusType>[];
    videoURL: string;
    socialPublisherAccount: ISocialPublisherAccount;
  };
}

export interface ISocialPublisherTaskTikTokPostDetails extends ISocialPublisherTaskAccount {
  caption: string;
  disable_duet: boolean;
  disable_stitch: boolean;
  disable_comment: boolean;
  privacy_level: string;
}
export interface ISocialPublisherTaskFacebookPagePostDetails extends ISocialPublisherTaskAccount {
  description: string;
  title: string;
}

export interface ISocialPublisherTaskInstagramAccountPostDetails extends ISocialPublisherTaskAccount {
  description: string;
  share_to_feed: boolean;
  is_published_to_both_feed_and_story: boolean;
}

export interface ISocialPublisherTaskYouTubePostDetails extends ISocialPublisherTaskAccount {
  title: string;
  description: string;
  tags: string[];
  madeForKids: boolean;
  defaultLanguage: string;
  defaultAudioLanguage: string;
  categoryId: string;
  localizationLanguages: string[];
  localizations: any;
}

export interface ISocialPublisherTaskNextPreviousResponse {
  nextId?: string;
  previousId?: string;
}

export interface IDefaultSettingsResponse {
  // Define default settings structure if needed based on API response
  [key: string]: any;
}

export type ISearchSocialPublisherTaskResponse = IPaginationResponse<ISocialPublisherTaskResponse>;

export interface IBaseStatusHistoryGroupedDay<StatusType> {
  day: Date;
  history: IBaseStatusHistoryGroupedItem<StatusType>[];
}

export interface IBaseStatusHistoryGroupedItem<StatusType> {
  time: Date;
  status: StatusType;
}
