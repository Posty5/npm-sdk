import type { ICreateStoryPostBase, IListParams, IPublishOptions, IScheduleConfig, ISocialPublisherPostStatusResponse } from "@posty5/social-publisher-post";
import { IMAGE_FROM_URL, PUBLISH_NOW, SOCIAL_POST_PLATFORMS, VIDEO_FROM_URL, VIDEO_PLATFORM_BLOCKS } from "../config/social-publisher-enums.config";
import type { ISocialPostListFilters, IStoryPostArgs, IVideoPostArgs } from "../interfaces/social-publisher.interface";
import { ToolInputError } from "./tool-input.error";

/** `scheduledAt` (ISO 8601) as the `IScheduleConfig` the image, text and story methods take; none publishes now. */
export function toScheduleConfig(scheduledAt?: string): IScheduleConfig | undefined {
  return scheduledAt ? { type: "schedule", scheduledAt: new Date(scheduledAt) } : undefined;
}

/** `"now"` or an ISO 8601 time, as the `"now" | Date` that `reschedulePost` takes. */
export function toRescheduleValue(schedule: string): "now" | Date {
  return schedule === PUBLISH_NOW ? PUBLISH_NOW : new Date(schedule);
}

/** Throws a `ToolInputError` unless the video post carries at least one platform block (the SDK refuses none). */
export function requireVideoPlatformBlock(args: IVideoPostArgs): void {
  if (VIDEO_PLATFORM_BLOCKS.some((platform) => args[platform] !== undefined)) return;
  throw new ToolInputError(
    `Give a platform block (${VIDEO_PLATFORM_BLOCKS.join(", ")}) for each platform connected to the target — social_workspace_get_for_new_post or social_account_get shows them.`,
  );
}

/** A video tool's arguments as the SDK's publish options, minus the target id. URL only: the video and thumbnail are never uploaded from here. */
export function videoPublishOptions(args: IVideoPostArgs): Omit<IPublishOptions, "workspaceId"> {
  return {
    video: args.videoUrl,
    thumbnail: args.thumbnailUrl,
    youtube: args.youtube,
    tiktok: args.tiktok,
    facebook: args.facebook,
    instagram: args.instagram,
    comment: args.comment,
    schedule: args.scheduledAt ? new Date(args.scheduledAt) : undefined,
    tag: args.tag,
    refId: args.refId,
  };
}

/** A story tool's arguments as the SDK's story body, minus the target. Media by URL only. Check the kind's field with `requireFields` first. */
export function storyPostBody(args: IStoryPostArgs): ICreateStoryPostBase {
  const media = args.kind === "image" ? { image: { source: IMAGE_FROM_URL, externalUrl: args.imageUrl } } : { source: VIDEO_FROM_URL, videoURL: args.videoUrl };
  return { kind: args.kind, ...media, schedule: toScheduleConfig(args.scheduledAt), tag: args.tag, refId: args.refId };
}

/** `social_post_list`'s filters as the SDK's `IListParams`: `platform` becomes `<platform>.postInfo.isAllow: true`. */
export function postListParams({ platform, ...filters }: ISocialPostListFilters): IListParams {
  const params: IListParams = { ...filters };
  if (platform) params[`${platform}.postInfo.isAllow`] = true;
  return params;
}

/** The platforms a post was sent to, from its status. */
export function postPlatforms(status: ISocialPublisherPostStatusResponse): string[] {
  return SOCIAL_POST_PLATFORMS.filter((platform) => status[platform]?.postInfo?.isAllow);
}
