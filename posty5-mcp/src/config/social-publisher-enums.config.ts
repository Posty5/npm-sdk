import type { SocialPublisherPostAccountType, SocialPublisherPostStatusType } from "@posty5/social-publisher-post";
import type { SocialAccountPlatform, SocialAccountStatus } from "@posty5/social-publisher-workspace";

/**
 * Closed value lists the social-publisher tools accept, mirrored from the SDK
 * unions — `satisfies` fails the build if a value leaves the SDK's union.
 */

export const SOCIAL_ACCOUNT_PLATFORMS = ["youtube", "tiktok", "facebook", "instagram", "threads", "twitter"] as const satisfies readonly SocialAccountPlatform[];

export const SOCIAL_ACCOUNT_STATUSES = ["active", "inactive", "authenticationExpired"] as const satisfies readonly SocialAccountStatus[];

export const SOCIAL_POST_STATUSES = [
  "pending",
  "processing",
  "processingInPlatform",
  "failedByPlatform",
  "done",
  "error",
  "canceled",
  "needsMaintenance",
  "invalidVideoURL",
  "invalidPostVideoURL",
  "retrying",
  "removing",
  "removed",
  "removeFailed",
] as const satisfies readonly SocialPublisherPostStatusType[];

/** Platforms a post carries a block for — the `<platform>.postInfo.isAllow` list filter, and what a removal reports on. */
export const SOCIAL_POST_PLATFORMS = ["youtube", "facebook", "instagram", "tiktok"] as const satisfies readonly SocialPublisherPostAccountType[];

/** The video platform blocks; a video post needs one per platform connected to its target. */
export const VIDEO_PLATFORM_BLOCKS = ["youtube", "tiktok", "facebook", "instagram"] as const;

/** The two ways a post is aimed: every account in a workspace, or one account. Exactly one per call. */
export const SOCIAL_POST_TARGETS = ["workspaceId", "accountId"] as const;

/** TikTok privacy levels, in the order the API falls back through when one is refused. */
export const TIKTOK_PRIVACY_LEVELS = ["PUBLIC_TO_EVERYONE", "FOLLOWER_OF_CREATOR", "MUTUAL_FOLLOW_FRIENDS", "SELF_ONLY"] as const;

/** Who may reply to a Threads post. */
export const THREADS_REPLY_CONTROLS = ["everyone", "accounts_you_follow", "mentioned_only", "parent_post_author_only", "followers_only"] as const;

/** Who may reply to an X post. */
export const TWITTER_REPLY_SETTINGS = ["everyone", "mentionedUsers", "following"] as const;

/** What a story carries. */
export const STORY_KINDS = ["image", "video"] as const;

export type StoryKind = (typeof STORY_KINDS)[number];

/** The tool arguments each story kind cannot do without, checked with `requireFields` before any call. */
export const STORY_REQUIRED_FIELDS: Record<StoryKind, readonly string[]> = {
  image: ["imageUrl"],
  video: ["videoUrl"],
};

/** The value `social_post_reschedule` takes to publish at once instead of at a time. */
export const PUBLISH_NOW = "now" as const;

/** Image source of a post whose image is fetched from a public URL (the only source these tools use). */
export const IMAGE_FROM_URL = "image-url" as const;

/** Video source of a story whose video is fetched from a public URL (the only source these tools use). */
export const VIDEO_FROM_URL = "video-url" as const;
