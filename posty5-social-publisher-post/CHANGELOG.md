# Changelog

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
