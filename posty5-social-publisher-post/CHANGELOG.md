# Changelog

## 4.6.0

- **Text posts** — `createTextPostToWorkspace`, `createTextPostToAccount` (Facebook, Threads, X overrides; comments, hashtags, tracked links).
- **Stories** — `createStoryPostToWorkspace`, `createStoryPostToAccount` (media by URL; the account form requires `platform`).
- Create methods stamp `createdFrom` from `HttpClient.createdFrom` instead of a fixed `"npmPackage"`.
- **Packaging fix:** `@posty5/core` is now a peer dependency (`^4.3.0`). 4.2.0 was published with `"dependencies": { "@posty5/core": "file:../posty5-core" }`, which cannot resolve outside this repository.
- `package.json` was left at 4.2.0 through the 4.3.0–4.5.0 entries below (none of them reached npm); this release realigns it.

## 4.5.0

### Added

- **Up to five comments per post.** `comments?: ICommentRequest[]` on every
  create-post request that took a single `comment`, each with its own
  `delayMinutes`, its own optional image and its own per-platform flags.
  `MAX_POST_COMMENTS`, `MAX_COMMENT_LENGTH` and `MAX_COMMENT_DELAY_MINUTES` are
  exported so a caller can validate before sending rather than after a 400.
- **An image per comment**, as `imageUrl` (any plan, costs us no storage) or
  `imageStorageKey` (uploaded through the account's
  `default-comments/upload-urls`, plan-gated). They are not interchangeable: the
  key is what tells the API the object is ours, and therefore what its cleanup
  path uses when the post or the comment is deleted. A public URL sent in the
  key field makes the image read as external and it is never cleaned up.
- **Per-comment status.** `ICommentStatusDTO[]` on `comments` for each platform,
  carrying the order, the text, the delay and the outcome.

### Deprecated

- `comment?` on every create-post request, in favour of `comments`. It still
  compiles and will for one major version. Send one or the other - the API
  refuses a request carrying both. `commentInfo` on each platform's status stays
  alongside `comments`, mirroring the first entry.

### Fixed

- **The documented credit cost was wrong, on both halves.** A comment is **25
  credits**, not "+1" - the API charges `socialMediaPublisher.commentOnPost`,
  which its plan data prices at 25. And an image post is **50 credits**, not 5.
  Both numbers now come from the API's plan data rather than from memory, and
  both are stated on the interfaces and in the README.

### Documentation

- The comment JSDoc now states the two caveats a caller has no UI to learn from:
  **TikTok is not supported** (it exposes no public comment-posting endpoint, so
  a comment aimed at it reports `notSupported` rather than failing), and **an
  image is Facebook only** (Instagram's and YouTube's comment endpoints are
  text-only, so an image bound for either is dropped with a reason).

## 4.4.0

### Added

- **Explicit upload termination (tus Termination extension).** Aborting still
  leaves the partial upload resumable, which is the right default — in most
  interfaces "pause" and "cancel" are the same button. Where the abort really is
  final, two ways to say so:
  - `terminateOnAbort: true` on both long-video publish helpers sends a `DELETE`
    for the partial upload when `signal` fires.
  - `terminateUpload(uploadUrl)` discards an upload URL you persisted earlier
    and decided not to resume. It never throws — a cleanup that fails is not
    worth an error, since the server expires abandoned uploads after 24 hours.

### Documentation

- README now states the file boundary the long-video helpers have always had:
  browser `File`/`Blob` or a hosted URL, **not** a Node `ReadStream` or a
  filesystem path — with the `readFile` -> `File` bridge for Node callers and a
  note on why the streaming variant does not exist.
- `onProgress` no longer claims to report only 0 and 100. That has been per-chunk
  since resumable uploads landed in 4.3.0; the 0/100 behaviour survives only on a
  server without the resumable service.

## 4.3.0

### Added

- **Resumable uploads (tus 1.0.0).** A long video now transfers in 8MiB chunks
  to the API's resumable endpoint, so a dropped connection costs one chunk
  rather than the whole file. Falls back to the signed PUT automatically when
  the server does not offer the resumable service.
  - `uploadResumable(target, file, options)` and `supportsResumableUpload(target)`
    are exported for callers driving their own uploads.
  - `onUploadUrl` and `resumeFrom` on both long-video publish helpers: keep the
    URL from the first and pass it to the second to continue an interrupted
    transfer, including after a page reload. The ticket expires in minutes, but
    an upload that already exists resumes by its own URL and is unaffected.
  - `signal` on both helpers aborts the transfer. Uploaded bytes stay on the
    server and can be resumed; no post is created, so nothing is charged.

### Fixed

- **The resumable fields on `IGenerateUploadUrlsResponse` had the wrong names.**
  4.2.0 declared `uploadEndpoint` / `uploadTicket`; the API sends `tusEndpoint`,
  `ticket`, `ticketExpiresAt` and `maxSize`. The old names always read
  `undefined`. Anyone who wrote code against them in 4.2.0 must rename.
- `SocialPublisherPostType` on the two post response shapes still omitted
  `longVideo`; both now include it.

### Changed

- The two upload slots are typed as a shared `IUploadTarget` rather than two
  inline shapes, so the resumable client and the response describe one thing.

## 4.2.0

### Added

- **Long video posts** (up to 60 minutes):
  - `client.publishLongVideoToWorkspace()` and `client.publishLongVideoToAccount()`,
    accepting a `File` or a direct URL and handling upload + create in one call.
  - `client.getLongVideoQuote(videoURL)` → `ILongVideoQuoteResponse`: the
    server-measured duration, the exact credit cost, and a per-platform verdict,
    so the price can be shown before the user commits.
  - `onProgress` on both publish helpers. Note the underlying uploader reports
    0 then 100 rather than continuous progress; intermediate values need
    `XMLHttpRequest`, which is not available in Node.
  - `IPublishLongVideoResult` carries `durationSeconds`, `creditUnits`,
    `credits` and `refusedTargets` — targets dropped because the video exceeds
    that platform's own limit. The post still publishes to the rest.
- `client.reschedulePost(id, { schedule, caption? })` — move a not-yet-published
  post to another time, or send it now. Costs no credits.
- `postType` on `IGenerateUploadUrlsRequest`. Passing `"longVideo"` makes the
  server check plan gating and affordability BEFORE the upload starts.
- `uploadEndpoint` / `uploadTicket` on `IGenerateUploadUrlsResponse` — the
  resumable (tus) destination, which survives a dropped connection where a
  single PUT does not.
- `IVideoDTO` response shape and `video?` on the post responses.
- `LONG_VIDEO_MAX_DURATION_SECONDS` (3600) and `LONG_VIDEO_CREDIT_UNIT_SECONDS`
  (300) exported for client-side pre-checks. The server remains the authority.

### Changed

- `SocialPublisherPostType` widened from `"shortVideo"` to
  `"shortVideo" | "longVideo" | "image" | "text"`. **Code switching on a post's
  `type` must tolerate values it does not recognise** — `image` and `text` were
  already returned by the API and simply missing from this union.

### Pricing

- Long video costs **50 credits per started 5 minutes**
  (`units = ceil(durationSeconds / 300)`). A 12-minute video costs 150; so does
  a 15-minute one. The duration is measured server-side and cannot be supplied
  by the caller.
- Requires the `socialMediaPublisher.longVideoPost` plan feature.

### Not included

- `deletePost()` is **not** in this release. The API has no
  `DELETE /api/social-publisher-post/:id` route yet. `removePost()` remains the
  way to take down media that has already published (50 credits).

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
