import type { ICommentRequest, IImageMediaRequest, IScheduleConfig } from "./index";

/** Facebook's override for a text post. Without it the shared caption is used. */
export interface IFacebookTextConfig {
  /** The status text. */
  description?: string;
  /** Kept for other surfaces; Facebook ignores it. */
  title?: string;
  /** An http(s) link Facebook previews. Posty5 never requests it. */
  link?: string;
}

/** Threads' override for a text post — at most 500 characters. */
export interface IThreadsTextConfig {
  text?: string;
  reply_control?: "everyone" | "accounts_you_follow" | "mentioned_only" | "parent_post_author_only" | "followers_only";
  /** The ONE topic Threads links (letters, digits, `_`). */
  topic_tag?: string;
  /** An http(s) link shown as a preview card. */
  link?: string;
}

/** X's settings for a text post (requires the Pro plan or higher on the API side). */
export interface ITwitterTextConfig {
  /** At most 280 weighted characters. */
  text?: string;
  reply_settings?: "everyone" | "mentionedUsers" | "following";
  /** 2–4 options of up to 25 characters; 5–10080 minutes. Not with `quote_tweet_id`. */
  poll?: { options: string[]; duration_minutes?: number };
  quote_tweet_id?: string;
}

/** UTM parameters added to tracked links. */
export interface IPostUtmConfig {
  medium?: string;
  campaign?: string;
}

/** Fields every text post takes, whichever target. */
export interface ICreateTextPostBase {
  /** The post's text. */
  caption: string;
  facebook?: IFacebookTextConfig;
  threads?: IThreadsTextConfig;
  twitter?: ITwitterTextConfig;
  schedule?: IScheduleConfig;
  comments?: ICommentRequest[];
  /** Saved hashtag groups merged into the caption (at most 5). */
  hashtagGroupIds?: string[];
  /** At most 30. */
  hashtags?: string[];
  /** Turn links in the caption into tracked short links. */
  trackLinks?: boolean;
  utm?: IPostUtmConfig;
  refId?: string;
  tag?: string;
}

/** A text post to every text-capable account in a workspace. */
export interface ICreateTextPostToWorkspaceRequest extends ICreateTextPostBase {
  workspaceId: string;
}

/** A text post to one account. */
export interface ICreateTextPostToAccountRequest extends ICreateTextPostBase {
  accountId: string;
}

/**
 * A story. Media by URL only in this SDK release: an image as
 * `image: { source: "image-url", externalUrl }`, a video as
 * `source: "video-url"` + `videoURL`.
 */
export interface ICreateStoryPostBase {
  kind: "image" | "video";
  /** For `kind: "image"`. */
  image?: IImageMediaRequest;
  /** For `kind: "video"`. */
  source?: "video-url";
  /** For `kind: "video"`: a direct, public video URL. */
  videoURL?: string;
  schedule?: IScheduleConfig;
  refId?: string;
  tag?: string;
}

/** A story to every story-capable account in a workspace. */
export interface ICreateStoryPostToWorkspaceRequest extends ICreateStoryPostBase {
  workspaceId: string;
}

/** A story to one account. */
export interface ICreateStoryPostToAccountRequest extends ICreateStoryPostBase {
  accountId: string;
  /** The account's platform — required by the API for a story to one account. */
  platform: "youtube" | "tiktok" | "facebook" | "instagram" | "threads" | "twitter";
}
