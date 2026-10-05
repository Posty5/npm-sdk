import { ToolInputError } from "../../posty5-mcp/src/core/tool-input.error";
import type { IConfirmationDescription } from "../../posty5-mcp/src/interfaces/tool.interface";
import { SOCIAL_PUBLISHER_TOOLS } from "../../posty5-mcp/src/toolsets/social-publisher.tools";
import { findTool, previewTool, route, runTool } from "./mcp-test.helper";

/**
 * The social-publisher toolset (mcp-tool-catalogue-package): workspaces,
 * connected accounts and posts, every tool pinned to the SDK route it calls.
 * Offline — a stub HttpClient records the requests. Media is by URL only, so
 * nothing is uploaded.
 */

const WORKSPACE = { _id: "w1", name: "Brand", description: "Main brand", account: {} };
const ACCOUNT = { _id: "a1", platform: "instagram", status: "active", name: "@brand" };
const POST_STATUS = {
  _id: "post1",
  numbering: "0042",
  type: "shortVideo",
  currentStatus: "done",
  schedule: { type: "now" },
  youtube: { postInfo: { isAllow: true } },
  facebook: { postInfo: { isAllow: true } },
  instagram: { postInfo: { isAllow: false } },
};
const QUOTE = { durationSeconds: 700, maxDurationSeconds: 3600, withinLimit: true, units: 3, creditsPerUnit: 25, credits: 75, isGated: false, platforms: [] };
const VIDEO_URL = "https://cdn.example/clip.mp4";
const IMAGE_URL = "https://cdn.example/photo.jpg";
const AT = "2026-11-01T09:00:00Z";
const YOUTUBE = { title: "Launch", description: "We shipped" };

describe("mcp social-publisher toolset — workspaces and accounts", () => {
  it("holds the catalogue's twenty-one tools, in its order", () => {
    expect(SOCIAL_PUBLISHER_TOOLS.map((tool) => tool.name)).toEqual([
      "social_workspace_list",
      "social_workspace_get",
      "social_workspace_get_for_new_post",
      "social_account_list",
      "social_account_get",
      "social_workspace_create",
      "social_workspace_update",
      "social_workspace_delete",
      "social_post_list",
      "social_post_get_status",
      "social_post_get_default_settings",
      "social_post_get_adjacent",
      "social_post_publish_image",
      "social_post_publish_short_video",
      "social_post_quote_long_video",
      "social_post_publish_long_video",
      "social_post_publish_text",
      "social_post_publish_story",
      "social_post_reschedule",
      "social_post_delete",
      "social_post_remove_from_platforms",
    ]);
  });

  it("social_workspace_list sends its filters and paging as query params", async () => {
    const { calls } = await runTool("social_workspace_list", { name: "Brand", page: 1, pageSize: 10 });
    expect(route(calls[0])).toBe("GET /api/social-publisher-workspace");
    expect(calls[0].params).toEqual({ name: "Brand", page: 1, pageSize: 10 });
  });

  it("social_workspace_get reads one workspace", async () => {
    const { calls } = await runTool("social_workspace_get", { id: "w1" }, WORKSPACE);
    expect(route(calls[0])).toBe("GET /api/social-publisher-workspace/w1");
  });

  it("social_workspace_get_for_new_post reads the workspace as a new post sees it", async () => {
    const { calls } = await runTool("social_workspace_get_for_new_post", { id: "w1" }, WORKSPACE);
    expect(route(calls[0])).toBe("GET /api/social-publisher-workspace/w1/for-new-post");
  });

  it("social_account_list sends its filters and paging as query params", async () => {
    const { calls } = await runTool("social_account_list", { platform: "youtube", status: "active", page: 1 });
    expect(route(calls[0])).toBe("GET /api/social-publisher-account");
    expect(calls[0].params).toEqual({ platform: "youtube", status: "active", page: 1 });
  });

  it("social_account_get reads one account", async () => {
    const { calls } = await runTool("social_account_get", { id: "a1" }, ACCOUNT);
    expect(route(calls[0])).toBe("GET /api/social-publisher-account/a1");
  });

  it("social_workspace_create creates without a logo and returns the workspaceId", async () => {
    const { calls, value } = await runTool("social_workspace_create", { name: "Brand", tag: "main" }, { workspaceId: "w9", uploadImageConfig: null });
    expect(route(calls[0])).toBe("POST /api/social-publisher-workspace");
    expect(calls[0].body).toEqual({ name: "Brand", tag: "main", description: "", hasImage: false, createdFrom: "mcp" });
    expect(value).toEqual({ workspaceId: "w9" });
    expect(findTool("social_workspace_create").entity?.(value, {})).toEqual({ entityType: "socialWorkspace", entityId: "w9" });
  });

  it("social_workspace_update keeps the current description and sends no logo", async () => {
    const { calls } = await runTool("social_workspace_update", { id: "w1", name: "Brand EU" }, undefined, [WORKSPACE, { workspaceId: "w1" }]);
    expect(calls.map(route)).toEqual(["GET /api/social-publisher-workspace/w1", "PUT /api/social-publisher-workspace/w1"]);
    expect(calls[1].body).toEqual({ name: "Brand EU", description: "Main brand", hasImage: false });
  });

  it("social_workspace_delete deletes by id", async () => {
    const { calls } = await runTool("social_workspace_delete", { id: "w1" });
    expect(route(calls[0])).toBe("DELETE /api/social-publisher-workspace/w1");
  });

  it("social_workspace_delete's confirmation only reads and names the workspace", async () => {
    const { text, calls } = await previewTool("social_workspace_delete", { id: "w1" }, WORKSPACE);
    expect(calls.every((call) => call.method === "GET")).toBe(true);
    expect(text).toContain("Brand");
    expect(text).toContain("cannot be undone");
  });
});

describe("mcp social-publisher toolset — reading posts", () => {
  it("social_post_list turns platform into the SDK's isAllow filter and is marked open-world", async () => {
    const { calls } = await runTool("social_post_list", { workspaceId: "w1", currentStatus: "done", platform: "youtube", page: 1 });
    expect(route(calls[0])).toBe("GET /api/social-publisher-post");
    expect(calls[0].params).toEqual({ workspaceId: "w1", currentStatus: "done", "youtube.postInfo.isAllow": true, page: 1 });
    expect(findTool("social_post_list").annotations?.openWorld).toBe(true);
  });

  it("social_post_get_status reads one post's status and is marked open-world", async () => {
    const { calls } = await runTool("social_post_get_status", { id: "post1" }, POST_STATUS);
    expect(route(calls[0])).toBe("GET /api/social-publisher-post/post1/status");
    expect(findTool("social_post_get_status").annotations?.openWorld).toBe(true);
  });

  it("social_post_get_default_settings reads the defaults", async () => {
    const { calls } = await runTool("social_post_get_default_settings", {});
    expect(route(calls[0])).toBe("GET /api/social-publisher-post/default-settings");
  });

  it("social_post_get_adjacent reads the neighbours", async () => {
    const { calls } = await runTool("social_post_get_adjacent", { id: "post1" });
    expect(route(calls[0])).toBe("GET /api/social-publisher-post/post1/next-previous");
  });
});

describe("mcp social-publisher toolset — publishing", () => {
  it("social_post_publish_image goes to the workspace or the account route, image by URL", async () => {
    const toWorkspace = await runTool("social_post_publish_image", { workspaceId: "w1", imageUrl: IMAGE_URL, caption: "New in", scheduledAt: AT }, { _id: "post1" });
    expect(route(toWorkspace.calls[0])).toBe("POST /api/social-publisher-post/image/workspace");
    expect(toWorkspace.calls[0].body).toMatchObject({
      workspaceId: "w1",
      caption: "New in",
      image: { source: "image-url", externalUrl: IMAGE_URL },
      schedule: { type: "schedule", scheduledAt: new Date(AT) },
      createdFrom: "mcp",
    });
    expect(toWorkspace.value).toEqual({ _id: "post1" });

    const toAccount = await runTool("social_post_publish_image", { accountId: "a1", imageUrl: IMAGE_URL, caption: "New in" }, { _id: "post2" });
    expect(route(toAccount.calls[0])).toBe("POST /api/social-publisher-post/image/account");
    expect(toAccount.calls[0].body).toMatchObject({ accountId: "a1" });
    expect(toAccount.calls[0].body.workspaceId).toBeUndefined();
  });

  it("a post with both or neither of workspaceId and accountId is refused before any request", async () => {
    await expect(runTool("social_post_publish_image", { workspaceId: "w1", accountId: "a1", imageUrl: IMAGE_URL, caption: "x" })).rejects.toBeInstanceOf(ToolInputError);
    await expect(runTool("social_post_publish_image", { imageUrl: IMAGE_URL, caption: "x" })).rejects.toBeInstanceOf(ToolInputError);
    await expect(runTool("social_post_publish_text", { caption: "x" })).rejects.toBeInstanceOf(ToolInputError);
    await expect(runTool("social_post_publish_short_video", { workspaceId: "w1", accountId: "a1", videoUrl: VIDEO_URL, youtube: YOUTUBE })).rejects.toBeInstanceOf(ToolInputError);
  });

  it("social_post_publish_short_video publishes by URL to the workspace or the account", async () => {
    const toWorkspace = await runTool(
      "social_post_publish_short_video",
      { workspaceId: "w1", videoUrl: VIDEO_URL, thumbnailUrl: IMAGE_URL, youtube: YOUTUBE, tiktok: { caption: "Launch", privacy_level: "SELF_ONLY" } },
      { _id: "post1" },
    );
    expect(route(toWorkspace.calls[0])).toBe("POST /api/social-publisher-post/short-video/workspace/by-url");
    expect(toWorkspace.calls[0].body).toMatchObject({
      workspaceId: "w1",
      source: "video-url",
      videoURL: VIDEO_URL,
      thumbURL: IMAGE_URL,
      youtube: { title: "Launch", description: "We shipped", tags: [] },
      tiktok: { caption: "Launch", privacy_level: "SELF_ONLY", disable_duet: true, disable_stitch: true, disable_comment: true },
    });
    expect(toWorkspace.value).toEqual({ _id: "post1" });

    const toAccount = await runTool("social_post_publish_short_video", { accountId: "a1", videoUrl: VIDEO_URL, youtube: YOUTUBE }, { _id: "post2" });
    expect(route(toAccount.calls[0])).toBe("POST /api/social-publisher-post/short-video/account/by-url");
    expect(toAccount.calls[0].body).toMatchObject({ accountId: "a1", source: "video-url", videoURL: VIDEO_URL });
  });

  it("social_post_publish_short_video refuses a post with no platform block", async () => {
    await expect(runTool("social_post_publish_short_video", { workspaceId: "w1", videoUrl: VIDEO_URL })).rejects.toBeInstanceOf(ToolInputError);
  });

  it("social_post_quote_long_video asks the quote route for the URL", async () => {
    const { calls, value } = await runTool("social_post_quote_long_video", { videoUrl: VIDEO_URL }, QUOTE);
    expect(route(calls[0])).toBe("POST /api/social-publisher-post/long-video/quote");
    expect(calls[0].body).toEqual({ videoURL: VIDEO_URL });
    expect(value).toEqual(QUOTE);
  });

  it("social_post_publish_long_video publishes by URL and returns what was charged", async () => {
    const charged = { _id: "post3", durationSeconds: 700, creditUnits: 3, credits: 75, refusedTargets: [] };
    const { calls, value } = await runTool("social_post_publish_long_video", { workspaceId: "w1", videoUrl: VIDEO_URL, youtube: YOUTUBE }, charged);
    expect(route(calls[0])).toBe("POST /api/social-publisher-post/long-video/workspace/by-url");
    expect(calls[0].body).toMatchObject({ workspaceId: "w1", source: "video-url", videoURL: VIDEO_URL });
    expect(value).toEqual(charged);
  });

  it("social_post_publish_long_video's confirmation returns the quote and publishes nothing", async () => {
    const { text, calls } = await previewTool("social_post_publish_long_video", { workspaceId: "w1", videoUrl: VIDEO_URL, youtube: YOUTUBE }, QUOTE);
    // The quote route is a POST, but it neither creates nor charges anything.
    expect(calls.map(route)).toEqual(["POST /api/social-publisher-post/long-video/quote"]);
    const described = text as IConfirmationDescription;
    expect(described.details).toEqual(QUOTE);
    expect(described.action).toContain("workspace w1");
  });

  it("social_post_publish_text publishes to the account with per-platform overrides", async () => {
    const { calls } = await runTool("social_post_publish_text", { accountId: "a1", caption: "Hello", twitter: { text: "Hello X" } }, { _id: "post4" });
    expect(route(calls[0])).toBe("POST /api/social-publisher-post/text/account");
    expect(calls[0].body).toMatchObject({ accountId: "a1", caption: "Hello", twitter: { text: "Hello X" }, createdFrom: "mcp" });
  });

  it("social_post_publish_story sends the kind's media by URL; to one account it names the account's platform", async () => {
    const toWorkspace = await runTool("social_post_publish_story", { workspaceId: "w1", kind: "image", imageUrl: IMAGE_URL }, { _id: "post5" });
    expect(route(toWorkspace.calls[0])).toBe("POST /api/social-publisher-post/story/workspace");
    expect(toWorkspace.calls[0].body).toMatchObject({ workspaceId: "w1", kind: "image", image: { source: "image-url", externalUrl: IMAGE_URL } });

    const toAccount = await runTool("social_post_publish_story", { accountId: "a1", kind: "video", videoUrl: VIDEO_URL }, undefined, [ACCOUNT, { _id: "post6" }]);
    expect(toAccount.calls.map(route)).toEqual(["GET /api/social-publisher-account/a1", "POST /api/social-publisher-post/story/account"]);
    expect(toAccount.calls[1].body).toMatchObject({ accountId: "a1", platform: "instagram", kind: "video", source: "video-url", videoURL: VIDEO_URL });
  });

  it("social_post_publish_story refuses a kind whose media URL is missing", async () => {
    await expect(runTool("social_post_publish_story", { workspaceId: "w1", kind: "image", videoUrl: VIDEO_URL })).rejects.toThrow(/imageUrl/);
  });
});

describe("mcp social-publisher toolset — changing posts", () => {
  // The edit route (updatePostSchema) takes the schedule flat and refuses scheduledAt with "now".
  it("social_post_reschedule sends a new time, or now", async () => {
    const later = await runTool("social_post_reschedule", { id: "post1", schedule: AT, caption: "Moved" });
    expect(route(later.calls[0])).toBe("PUT /api/social-publisher-post/post1");
    expect(later.calls[0].body).toEqual({ scheduleType: "schedule", scheduledAt: new Date(AT).toISOString(), caption: "Moved" });

    const now = await runTool("social_post_reschedule", { id: "post1", schedule: "now" });
    expect(now.calls[0].body).toEqual({ scheduleType: "now" });
  });

  it("social_post_delete deletes the unpublished post", async () => {
    const { calls } = await runTool("social_post_delete", { id: "post1" });
    expect(route(calls[0])).toBe("DELETE /api/social-publisher-post/post1");
  });

  it("social_post_delete's confirmation only reads and names the post", async () => {
    const { text, calls } = await previewTool("social_post_delete", { id: "post1" }, POST_STATUS);
    expect(calls.every((call) => call.method === "GET")).toBe(true);
    expect(text).toContain("#0042");
    expect(text).toContain("cannot be undone");
  });

  it("social_post_remove_from_platforms calls the remove route", async () => {
    const removed = { _id: "post1", results: { youtube: { success: true } } };
    const { calls, value } = await runTool("social_post_remove_from_platforms", { id: "post1" }, removed);
    expect(route(calls[0])).toBe("POST /api/social-publisher-post/post1/remove");
    expect(value).toEqual(removed);
  });

  it("social_post_remove_from_platforms's confirmation only reads, says it is irreversible and quotes the removal price", async () => {
    const { text, calls } = await previewTool("social_post_remove_from_platforms", { id: "post1" }, POST_STATUS);
    expect(calls.every((call) => call.method === "GET")).toBe(true);
    expect(text).toContain("youtube, facebook");
    expect(text).toContain("irreversible");
    expect(findTool("social_post_remove_from_platforms").confirm?.costFeaturePath).toBe("socialMediaPublisher.removePost");
  });
});
