import type { ICommentRequest, IFacebookPageConfig, IInstagramConfig, ITikTokConfig, IYouTubeConfig } from "@posty5/social-publisher-post";
import type { SOCIAL_POST_PLATFORMS, StoryKind } from "../config/social-publisher-enums.config";

/** Where a post goes: exactly one of the two (checked with `requireExactlyOne`). */
export interface ISocialPostTargetArgs {
  workspaceId?: string;
  accountId?: string;
}

/** The arguments `social_post_publish_short_video` and `social_post_publish_long_video` share. */
export interface IVideoPostArgs extends ISocialPostTargetArgs {
  videoUrl: string;
  thumbnailUrl?: string;
  youtube?: IYouTubeConfig;
  tiktok?: ITikTokConfig;
  facebook?: IFacebookPageConfig;
  instagram?: IInstagramConfig;
  comment?: ICommentRequest;
  scheduledAt?: string;
  tag?: string;
  refId?: string;
}

/** The arguments of `social_post_publish_story`; `kind` says which media URL applies. */
export interface IStoryPostArgs extends ISocialPostTargetArgs {
  kind: StoryKind;
  imageUrl?: string;
  videoUrl?: string;
  scheduledAt?: string;
  tag?: string;
  refId?: string;
}

/** The filters of `social_post_list`, before `platform` becomes the SDK's `<platform>.postInfo.isAllow` flag. */
export interface ISocialPostListFilters {
  workspaceId?: string;
  currentStatus?: string;
  caption?: string;
  numbering?: string;
  tag?: string;
  refId?: string;
  platform?: (typeof SOCIAL_POST_PLATFORMS)[number];
}
