# Changelog

## 4.1.0

### Added

- New **image post** type alongside short-video:
  - `ICreateImagePostToWorkspaceRequest` and `ICreateImagePostToAccountRequest`
    request shapes.
  - `client.createImagePostToWorkspace()` and `client.createImagePostToAccount()`
    methods (hitting `POST /api/social-publisher-post/image/{workspace,account}`).
  - `IImageMediaRequest` block + `ImageSourceType` union (`"image-file"`
    / `"image-url"`).
  - `IImageDTO` response shape and `image?` field on
    `ISocialPublisherPostStatusResponse`; `type` widened to `"shortVideo" | "image"`.
- Pricing: image post costs **5 credits**; auto-comment adds **+1** as
  before. YouTube community image posts are always reported as
  `notSupported` (the YouTube Data API doesn't expose them).

## 4.0.0

### Breaking Changes

- **Removed** the four per-platform allow flags
  (`isAllowYouTube`, `isAllowTiktok`, `isAllowFacebookPage`, `isAllowInstagram`)
  from every request / setting interface:
  `ICreateSocialPublisherPostRequest`,
  `ICreateSocialPublisherAccountPostRequest`,
  `IPostSetting`, `IAccountPostSetting`.
- **Removed** `platforms: Array<...>` from `IPublishOptions` and
  `IPublishToAccountOptions`. The server now derives publish targets from
  the workspace's connected accounts (or the account's `platform` field).
  Supply a config block (`youtube` / `tiktok` / `facebook` / `instagram`)
  for each connected platform — that's the only signal the SDK needs.
- The `publish*` helpers no longer validate
  "at least one platform specified"; they instead require at least one
  platform config block.

### Migration

```diff
- await client.publishShortVideoToWorkspace({
-   workspaceId: 'ws',
-   video: file,
-   platforms: ['youtube', 'tiktok'],
-   youtube: {...},
-   tiktok: {...},
- });
+ await client.publishShortVideoToWorkspace({
+   workspaceId: 'ws',
+   video: file,
+   youtube: {...},
+   tiktok: {...},
+ });
```

If your workspace has Facebook + Instagram connected and you previously
sent `isAllowFacebookPage: false` to opt one of them out, you can no
longer do that per-post — disconnect the account at the workspace level
instead.

## 3.1.0

### Added

- Optional post-publish **comment** support on create-post requests
  (`ICommentRequest` with `text` + per-platform booleans
  `postToFacebook` / `postToInstagram` / `postToYoutube` / `postToTiktok`).
- New `comment` field on `ICreateSocialPublisherPostRequest`,
  `ICreateSocialPublisherAccountPostRequest`, `IPostSetting`,
  `IAccountPostSetting`, `IPublishOptions`, `IPublishToAccountOptions`
  and all `IQuickPublish*Options` shapes.
- `CommentStatusType` union: `"pending" | "processing" | "done" | "error" | "skipped" | "notSupported"`.
- `ICommentInfoDTO` response interface, surfaced as the optional
  `commentInfo` field on each per-platform status DTO
  (Facebook / Instagram / YouTube / TikTok).
- README example for posting a comment alongside a short video, with a
  TikTok-not-supported note.

### Notes

- Pricing: comment adds +1 credit on top of the video charge (Pro plan).
- TikTok always reports `notSupported` for `commentInfo.currentStatus`.
