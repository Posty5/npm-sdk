import { HttpClient, IPaginationParams, uploadToR2 } from "@posty5/core";
import { supportsResumableUpload, uploadResumable } from "./resumable-upload";
import {
  ICreateSocialPublisherPostRequest,
  IGenerateUploadUrlsRequest,
  IGenerateUploadUrlsResponse,
  ISearchSocialPublisherPostResponse,
  ISocialPublisherPostNextPreviousResponse,
  ISocialPublisherPostStatusResponse,
  IDefaultSettingsResponse,
  IPostSetting,
  IPublishOptions,
  IListParams,
  ICreateSocialPublisherAccountPostRequest,
  IAccountPostSetting,
  IPublishToAccountOptions,
  ICreateImagePostToWorkspaceRequest,
  ICreateImagePostToAccountRequest,
  IRemovePostResponse,
  ILongVideoUploadControls,
  IPublishLongVideoOptions,
  IPublishLongVideoToAccountOptions,
  IPublishLongVideoResult,
  ILongVideoQuoteResponse,
  IReschedulePostRequest,
  IScheduleConfig,
} from "./interfaces";

/**
 * Social Publisher Post Client
 */
export class SocialPublisherPostClient {
  private http: HttpClient;
  private basePath = "/api/social-publisher-post";
  public readonly maxVideoUploadSizeBytes: number;
  public readonly maxImageUploadSizeBytes: number;

  constructor(http: HttpClient) {
    this.http = http;
    this.maxVideoUploadSizeBytes = 2147483648; //2GB default
    this.maxImageUploadSizeBytes = 1073741824; // 1GB default
  }

  /**
   * Search posts
   * @param params - Search parameters (optional)
   * @param pagination - Pagination parameters
   */
  async list(params?: IListParams, pagination?: IPaginationParams): Promise<ISearchSocialPublisherPostResponse> {
    const response = await this.http.get<ISearchSocialPublisherPostResponse>(this.basePath, {
      params: {
        ...params,
        ...pagination,
      },
    });
    return response.result!;
  }

  /**
   * Get default settings
   */
  async getDefaultSettings(): Promise<IDefaultSettingsResponse> {
    const response = await this.http.get<IDefaultSettingsResponse>(`${this.basePath}/default-settings`);
    return response.result!;
  }

  /**
   * Get post status
   * @param id - Post ID
   */
  async getStatus(id: string): Promise<ISocialPublisherPostStatusResponse> {
    const response = await this.http.get<ISocialPublisherPostStatusResponse>(`${this.basePath}/${id}/status`);
    return response.result!;
  }

  /**
   * Generate upload signed URLs for video and thumbnail
   * @param data - File information
   */
  private async generateUploadUrls(data: IGenerateUploadUrlsRequest): Promise<IGenerateUploadUrlsResponse> {
    const response = await this.http.post<IGenerateUploadUrlsResponse>(`${this.basePath}/generate-upload-urls`, data);
    return response.result!;
  }

  /**
   * Remove (delete) a post's published media directly from the connected
   * platform pages. Runs synchronously on the server — the media is deleted
   * from the platform immediately, not via a background job.
   *
   * Cost: 50 credits, charged ONLY when the removal succeeds (at least one
   * platform cleared and no delete-capable platform failed). Instagram and
   * TikTok expose no delete API, so a post published only to those platforms
   * cannot be removed programmatically and no credits are charged.
   *
   * @param id - Post ID
   * @returns Per-platform removal results
   *
   * @example
   * ```ts
   * const { results } = await client.removePost("post_123");
   * // results.youtube?.success === true
   * ```
   */
  async removePost(id: string): Promise<IRemovePostResponse> {
    const response = await this.http.post<IRemovePostResponse>(`${this.basePath}/${id}/remove`, {});
    return response.result!;
  }

  /**
   * Get next and previous post IDs
   * @param id - Current Post ID
   */
  async getNextAndPrevious(id: string): Promise<ISocialPublisherPostNextPreviousResponse> {
    const response = await this.http.get<ISocialPublisherPostNextPreviousResponse>(`${this.basePath}/${id}/next-previous`);
    return response.result!;
  }

  /**
   * Create a new post (publish video)
   * @param data - Post creation data
   * @param id - Optional ID for updating/retrying? (Based on route :id?)
   */
  private async createToWorkspaceByFile(data: ICreateSocialPublisherPostRequest, id?: string): Promise<string> {
    const url = id ? `${this.basePath}/short-video/workspace/by-file/${id}` : `${this.basePath}/short-video/workspace/by-file`;
    const response = await this.http.post<{ _id: string }>(url, {
      ...data,
      createdFrom: "npmPackage",
    });
    return response.result?._id!;
  }

  /**
   * Create a new post (publish video)
   * @param data - Post creation data
   * @param id - Optional ID for updating/retrying? (Based on route :id?)
   */
  private async createToWorkspaceByURL(data: ICreateSocialPublisherPostRequest, id?: string): Promise<string> {
    const url = id ? `${this.basePath}/short-video/workspace/by-url/${id}` : `${this.basePath}/short-video/workspace/by-url`;
    const response = await this.http.post<{ _id: string }>(url, {
      ...data,
      createdFrom: "npmPackage",
    });
    return response.result?._id!;
  }

  /**
   * Create a new post (publish video to account)
   * @param data - Post creation data
   * @param id - Optional ID for updating/retrying?
   */
  private async createToAccountByFile(data: ICreateSocialPublisherAccountPostRequest, id?: string): Promise<string> {
    const url = id ? `${this.basePath}/short-video/account/by-file/${id}` : `${this.basePath}/short-video/account/by-file`;
    const response = await this.http.post<{ _id: string }>(url, {
      ...data,
      createdFrom: "npmPackage",
    });
    return response.result?._id!;
  }

  /**
   * Create a new post (publish video to account)
   * @param data - Post creation data
   * @param id - Optional ID for updating/retrying?
   */
  private async createToAccountByURL(data: ICreateSocialPublisherAccountPostRequest, id?: string): Promise<string> {
    const url = id ? `${this.basePath}/short-video/account/by-url/${id}` : `${this.basePath}/short-video/account/by-url`;
    const response = await this.http.post<{ _id: string }>(url, {
      ...data,
      createdFrom: "npmPackage",
    });
    return response.result?._id!;
  }

  /**
   * Create an image post targeting a workspace. The image is published to
   * every account connected to the workspace (Facebook / Instagram / TikTok
   * photo). YouTube community posts are always reported as `notSupported`
   * on the status response — the YouTube Data API doesn't expose them to
   * third-party apps. Cost: 5 credits + 1 if `comment` is provided.
   *
   * @example
   * ```ts
   * const postId = await client.createImagePostToWorkspace({
   *   workspaceId: "ws_123",
   *   image: { source: "image-url", externalUrl: "https://cdn.example.com/launch.jpg" },
   *   caption: "We shipped!",
   * });
   * ```
   */
  async createImagePostToWorkspace(data: ICreateImagePostToWorkspaceRequest, id?: string): Promise<string> {
    const url = id ? `${this.basePath}/image/workspace/${id}` : `${this.basePath}/image/workspace`;
    const response = await this.http.post<{ _id: string }>(url, {
      ...data,
      createdFrom: "npmPackage",
    });
    return response.result?._id!;
  }

  /**
   * Create an image post targeting a single account. The server derives the
   * target platform from `account.platform`; image config blocks for other
   * platforms in the request are ignored.
   */
  async createImagePostToAccount(data: ICreateImagePostToAccountRequest, id?: string): Promise<string> {
    const url = id ? `${this.basePath}/image/account/${id}` : `${this.basePath}/image/account`;
    const response = await this.http.post<{ _id: string }>(url, {
      ...data,
      createdFrom: "npmPackage",
    });
    return response.result?._id!;
  }

  /**
   * Handle thumbnail upload - accepts either File or URL string
   * @param thumb - Thumbnail as File (will be uploaded) or URL string (will be passed directly)
   * @returns Thumbnail URL or undefined
   */
  private async handleThumbnailUpload(thumb?: File | string, uploadUrlsResponse?: IGenerateUploadUrlsResponse) {
    if (!thumb) {
      return undefined;
    }

    // If thumb is a string (URL), validate and return it directly
    if (typeof thumb === "string") {
      const urlPattern = /(http:\/\/)..*|(https:\/\/)..*/gi;
      if (!urlPattern.test(thumb)) {
        throw new Error("Invalid thumbnail URL format");
      }
      return { thumbFileURL: thumb, postId: undefined };
    }

    // If thumb is a File, upload it
    if (thumb instanceof File) {
      // Validate thumbnail file size
      if (thumb.size > this.maxImageUploadSizeBytes) {
        throw new Error(`Thumbnail file size (${thumb.size} bytes) exceeds maximum allowed size (${this.maxImageUploadSizeBytes} bytes)`);
      }

      // Generate upload URL
      if (!uploadUrlsResponse) {
        uploadUrlsResponse = await this.generateUploadUrls({
          thumbFileType: thumb.type,
        });
      }

      if (uploadUrlsResponse.thumb.uploadFileURL) {
        // Upload to R2 using uploadToR2 utility
        await uploadToR2(uploadUrlsResponse.thumb.uploadFileURL, thumb, {
          contentType: thumb.type,
        });

        return { thumbFileURL: uploadUrlsResponse.thumb.fileURL, postId: uploadUrlsResponse.postId };
      }
    }

    return undefined;
  }

  /**
   * Publish a short video by uploading a video file and optional thumbnail
   * @param settings - Post creation settings
   * @param video - Video file to upload (.mp4, .mov, .avi, .mkv, .webm)
   * @param thumb - Optional thumbnail image file or URL string
   * @returns Created post response
   */
  private async publishShortVideoToWorkspaceByFile(settings: IPostSetting, video: File, thumb?: File | string): Promise<string> {
    // Validate video size
    if (video.size > this.maxVideoUploadSizeBytes) {
      throw new Error(`Video file size (${video.size} bytes) exceeds maximum allowed size (${this.maxVideoUploadSizeBytes} bytes)`);
    }

    // Validate video file type
    const allowedVideoTypes = [".mp4", ".mov", ".avi", ".mkv", ".webm"];
    const videoExtension = "." + video.name.split(".").pop()?.toLowerCase();
    if (!allowedVideoTypes.includes(videoExtension)) {
      throw new Error(`Invalid video file type. Allowed types: ${allowedVideoTypes.join(", ")}`);
    }

    // Step 1: Generate upload URLs for video
    const uploadUrlsResponse = await this.generateUploadUrls({
      videoFileType: video.type,
      thumbFileType: thumb instanceof File ? thumb.type : undefined,
    });

    // Step 2: Upload video using uploadToR2 utility
    await uploadToR2(uploadUrlsResponse.video.uploadFileURL!, video, {
      contentType: video.type,
    });

    // Step 3: Handle thumbnail upload (File or URL)
    const uploadThumb = await this.handleThumbnailUpload(thumb, uploadUrlsResponse);

    // Step 4: Create post with uploaded file URLs
    const postSettings: ICreateSocialPublisherPostRequest = {
      ...settings,
      source: "video-file",
      videoURL: uploadUrlsResponse.video.fileURL,
      thumbURL: uploadThumb?.thumbFileURL,
    };

    return await this.createToWorkspaceByFile(postSettings, uploadUrlsResponse.postId);
  }

  /**
   * Publish a short video by providing a video URL and optional thumbnail
   * @param settings - Post creation settings
   * @param videoURL - Video URL (.mp4, .mov, .avi, .mkv, .webm)
   * @param thumb - Optional thumbnail image file or URL string
   * @returns Created post response
   */
  private async publishShortVideoToWorkspaceByURL(settings: IPostSetting, videoURL: string, thumb?: File | string): Promise<string> {
    // Handle thumbnail upload (File or URL)
    const uploadThumb = await this.handleThumbnailUpload(thumb);

    // Create post with video URL
    const postSettings: ICreateSocialPublisherPostRequest = {
      ...settings,
      source: "video-url",
      videoURL,
      thumbURL: uploadThumb?.thumbFileURL,
    };

    return await this.createToWorkspaceByURL(postSettings, uploadThumb?.postId);
  }

  /**
   * Publish a short video to account by uploading a video file
   */
  private async publishShortVideoToAccountByFile(settings: IAccountPostSetting, video: File, thumb?: File | string): Promise<string> {
    // Validate video size
    if (video.size > this.maxVideoUploadSizeBytes) {
      throw new Error(`Video file size (${video.size} bytes) exceeds maximum allowed size (${this.maxVideoUploadSizeBytes} bytes)`);
    }

    // Validate video file type
    const allowedVideoTypes = [".mp4", ".mov", ".avi", ".mkv", ".webm"];
    const videoExtension = "." + video.name.split(".").pop()?.toLowerCase();
    if (!allowedVideoTypes.includes(videoExtension)) {
      throw new Error(`Invalid video file type. Allowed types: ${allowedVideoTypes.join(", ")}`);
    }

    // Step 1: Generate upload URLs for video
    const uploadUrlsResponse = await this.generateUploadUrls({
      videoFileType: video.type,
      thumbFileType: thumb instanceof File ? thumb.type : undefined,
    });

    // Step 2: Upload video using uploadToR2 utility
    await uploadToR2(uploadUrlsResponse.video.uploadFileURL!, video, {
      contentType: video.type,
    });

    // Step 3: Handle thumbnail upload (File or URL)
    const uploadThumb = await this.handleThumbnailUpload(thumb, uploadUrlsResponse);

    // Step 4: Create post with uploaded file URLs
    const postSettings: ICreateSocialPublisherAccountPostRequest = {
      ...settings,
      source: "video-file",
      videoURL: uploadUrlsResponse.video.fileURL,
      thumbURL: uploadThumb?.thumbFileURL,
    };

    return await this.createToAccountByFile(postSettings, uploadUrlsResponse.postId);
  }

  /**
   * Publish a short video to account by URL
   */
  private async publishShortVideoToAccountByURL(settings: IAccountPostSetting, videoURL: string, thumb?: File | string): Promise<string> {
    // Handle thumbnail upload (File or URL)
    const uploadThumb = await this.handleThumbnailUpload(thumb);

    // Create post with video URL
    const postSettings: ICreateSocialPublisherAccountPostRequest = {
      ...settings,
      source: "video-url",
      videoURL,
      thumbURL: uploadThumb?.thumbFileURL,
    };

    return await this.createToAccountByURL(postSettings, uploadThumb?.postId);
  }

  /**
   * Publish a video to connected social media accounts.
   * Use original or authorized content only. TikTok Direct Post requires
   * the creator-controlled Posty5 review and confirmation flow.
   *
   * @param options - Simplified publishing options
   * @returns Created post response
   *
   * The workspace's connected accounts (set up via the Posty5 dashboard)
   * determine which platforms this post lands on — supply a config block
   * for each connected platform.
   *
   * @example
   * ```typescript
   * // Workspace has a YouTube account connected → just supply youtube config
   * await client.publishShortVideoToWorkspace({
   *     workspaceId: 'workspace-123',
   *     video: videoFile,
   *     thumbnail: thumbFile,
   *     youtube: {
   *         title: 'My Video',
   *         description: 'Description',
   *         tags: ['tag1', 'tag2']
   *     }
   * });
   *
   * // Workspace has YouTube + TikTok connected → supply both configs
   * await client.publishShortVideoToWorkspace({
   *     workspaceId: 'workspace-123',
   *     video: 'https://example.com/video.mp4',
   *     thumbnail: 'https://example.com/thumb.jpg',
   *     youtube: { title: 'Video', description: 'Desc', tags: [] },
   *     tiktok: { caption: 'Caption', privacy_level: 'public', disable_duet: false, disable_stitch: false, disable_comment: false }
   * });
   *
   * ```
   */
  async publishShortVideoToWorkspace(options: IPublishOptions): Promise<string> {
    // Validate required fields
    if (!options.workspaceId) {
      throw new Error("workspaceId is required");
    }
    if (!options.video) {
      throw new Error("video is required");
    }
    if (!options.youtube && !options.tiktok && !options.facebook && !options.instagram) {
      throw new Error("Provide at least one platform configuration (youtube / tiktok / facebook / instagram)");
    }

    // Build IPostSetting from simplified options.
    // The server derives which platforms to publish to from the workspace's
    // connected accounts; the SDK just forwards whichever config blocks the
    // caller supplied.
    const settings: IPostSetting = {
      workspaceId: options.workspaceId,
      youtube: options.youtube,
      tiktok: options.tiktok,
      facebook: options.facebook,
      instagram: options.instagram,
      schedule: options.schedule
        ? {
            type: options.schedule === "now" ? "now" : "schedule",
            scheduledAt: options.schedule instanceof Date ? options.schedule : undefined,
          }
        : undefined,
      source: "video-file",
      tag: options.tag,
      refId: options.refId,
      comment: options.comment,
    };

    // Auto-detect video source type
    const source = this.detectVideoSource(options.video);

    // Route to appropriate method based on detected source
    switch (source) {
      case "file": {
        return this.publishShortVideoToWorkspaceByFile(settings, options.video as File, options.thumbnail);
      }

      case "url": {
        return this.publishShortVideoToWorkspaceByURL(settings, options.video as string, options.thumbnail);
      }
      default:
        throw new Error(`Unknown video source type: ${source}`);
    }
  }

  /**
   * Publish a video to a connected social media account.
   * Use original or authorized content only.
   *
   * @param options - Simplified publishing options for account
   * @returns Created post response
   */
  async publishShortVideoToAccount(options: IPublishToAccountOptions): Promise<string> {
    // Validate required fields
    if (!options.accountId) {
      throw new Error("accountId is required");
    }
    if (!options.video) {
      throw new Error("video is required");
    }
    if (!options.youtube && !options.tiktok && !options.facebook && !options.instagram) {
      throw new Error("Provide the platform configuration matching the account (youtube / tiktok / facebook / instagram)");
    }

    // Auto-detect video source type
    const source = this.detectVideoSource(options.video);

    // Build IAccountPostSetting from simplified options.
    // The server derives the publish target from the account's platform field;
    // the SDK forwards whichever config block matches.
    const settings: IAccountPostSetting = {
      accountId: options.accountId,
      youtube: options.youtube,
      tiktok: options.tiktok,
      facebook: options.facebook,
      instagram: options.instagram,
      schedule: options.schedule
        ? {
            type: options.schedule === "now" ? "now" : "schedule",
            scheduledAt: options.schedule instanceof Date ? options.schedule : undefined,
          }
        : undefined,
      source: "video-file",
      tag: options.tag,
      refId: options.refId,
      comment: options.comment,
    };

    // Route to appropriate method based on detected source
    switch (source) {
      case "file": {
        return this.publishShortVideoToAccountByFile(settings, options.video as File, options.thumbnail);
      }

      case "url": {
        return this.publishShortVideoToAccountByURL(settings, options.video as string, options.thumbnail);
      }
      default:
        throw new Error(`Unknown video source type: ${source}`);
    }
  }

  /**
   * @deprecated Use publishShortVideoToWorkspace instead
   */
  async publishShortVideo(options: IPublishOptions): Promise<string> {
    return this.publishShortVideoToWorkspace(options);
  }


  // ─── Long video (up to 60 minutes) ───────────────────────────────────────

  /**
   * Price a long video before publishing it. Neither creates nor charges
   * anything.
   *
   * The server reads the video, measures its duration, and returns the exact
   * cost plus what each platform would do with a video that long. Show this
   * before the user commits — the units come from the same function the create
   * call charges with, so the quote and the bill cannot disagree.
   *
   * @param videoURL - URL of an uploaded or externally hosted video
   *
   * @example
   * ```ts
   * const quote = await client.getLongVideoQuote(fileURL);
   * if (!quote.withinLimit) throw new Error(quote.reason);
   * console.log(`${quote.durationSeconds}s costs ${quote.credits} credits`);
   * const blocked = quote.platforms.filter((p) => !p.accepted);
   * ```
   */
  async getLongVideoQuote(videoURL: string): Promise<ILongVideoQuoteResponse> {
    if (!videoURL) {
      throw new Error("videoURL is required");
    }
    const response = await this.http.post<ILongVideoQuoteResponse>(`${this.basePath}/long-video/quote`, { videoURL });
    return response.result!;
  }

  /**
   * Publish a video of up to 60 minutes to every account connected to a
   * workspace.
   *
   * Handles the whole sequence for an uploaded file: request an upload
   * destination, push the bytes, then create the post. Pass a URL instead of a
   * `File` to publish something already hosted elsewhere.
   *
   * Cost is duration-based — 50 credits per started 5 minutes — so a 12-minute
   * video costs 150. Call {@link getLongVideoQuote} first if you need to show
   * the price. The duration is measured server-side; there is no duration
   * option here because a client-supplied one would be a client-supplied price.
   *
   * Platforms differ on what they accept: a 40-minute video publishes to
   * YouTube and Facebook but is refused by Instagram, whose Reels cap at 15
   * minutes. Those targets come back in `refusedTargets` — the post still
   * publishes to the rest.
   *
   * @example
   * ```ts
   * const result = await client.publishLongVideoToWorkspace({
   *   workspaceId: "ws_123",
   *   video: recordingFile,
   *   youtube: { title: "Full session", description: "...", tags: ["workshop"] },
   *   onProgress: (p) => console.log(`${p}%`),
   * });
   * console.log(`Charged ${result.credits} credits for ${result.durationSeconds}s`);
   * for (const t of result.refusedTargets) console.warn(t.reason);
   * ```
   */
  async publishLongVideoToWorkspace(options: IPublishLongVideoOptions): Promise<IPublishLongVideoResult> {
    if (!options.workspaceId) {
      throw new Error("workspaceId is required");
    }
    if (!options.video) {
      throw new Error("video is required");
    }
    if (!options.youtube && !options.tiktok && !options.facebook && !options.instagram) {
      throw new Error("Provide at least one platform configuration (youtube / tiktok / facebook / instagram)");
    }

    const isFile = this.detectVideoSource(options.video) === "file";
    const upload = isFile ? await this.uploadLongVideo(
          options.video as File,
          options.thumbnail,
          {
            onProgress: options.onProgress,
            onUploadUrl: options.onUploadUrl,
            resumeFrom: options.resumeFrom,
            signal: options.signal,
            terminateOnAbort: options.terminateOnAbort,
          },
        ) : undefined;
    const videoURL = upload ? upload.videoURL : (options.video as string);
    const postId = upload?.postId;

    const thumb = await this.handleThumbnailUpload(options.thumbnail, upload?.uploadUrls);

    const body: ICreateSocialPublisherPostRequest = {
      workspaceId: options.workspaceId,
      youtube: options.youtube,
      tiktok: options.tiktok,
      facebook: options.facebook,
      instagram: options.instagram,
      schedule: this.buildSchedule(options.schedule),
      source: isFile ? "video-file" : "video-url",
      videoURL,
      thumbURL: thumb?.thumbFileURL,
      tag: options.tag,
      refId: options.refId,
      comment: options.comment,
    };

    const target = isFile ? "by-file" : "by-url";
    const id = postId ?? thumb?.postId;
    const url = id
      ? `${this.basePath}/long-video/workspace/${target}/${id}`
      : `${this.basePath}/long-video/workspace/${target}`;

    const response = await this.http.post<IPublishLongVideoResult>(url, { ...body, createdFrom: "npmPackage" });
    return this.normaliseLongVideoResult(response.result);
  }

  /**
   * Publish a video of up to 60 minutes to a single connected account.
   *
   * With one target there is no partial success: if that platform will not take
   * a video this long, the whole call is refused and nothing is charged. See
   * {@link publishLongVideoToWorkspace} for the cost model.
   */
  async publishLongVideoToAccount(options: IPublishLongVideoToAccountOptions): Promise<IPublishLongVideoResult> {
    if (!options.accountId) {
      throw new Error("accountId is required");
    }
    if (!options.video) {
      throw new Error("video is required");
    }
    if (!options.youtube && !options.tiktok && !options.facebook && !options.instagram) {
      throw new Error("Provide the platform configuration matching the account (youtube / tiktok / facebook / instagram)");
    }

    const isFile = this.detectVideoSource(options.video) === "file";
    const upload = isFile ? await this.uploadLongVideo(
          options.video as File,
          options.thumbnail,
          {
            onProgress: options.onProgress,
            onUploadUrl: options.onUploadUrl,
            resumeFrom: options.resumeFrom,
            signal: options.signal,
            terminateOnAbort: options.terminateOnAbort,
          },
        ) : undefined;
    const videoURL = upload ? upload.videoURL : (options.video as string);
    const postId = upload?.postId;

    const thumb = await this.handleThumbnailUpload(options.thumbnail, upload?.uploadUrls);

    const body: ICreateSocialPublisherAccountPostRequest = {
      accountId: options.accountId,
      youtube: options.youtube,
      tiktok: options.tiktok,
      facebook: options.facebook,
      instagram: options.instagram,
      schedule: this.buildSchedule(options.schedule),
      source: isFile ? "video-file" : "video-url",
      videoURL,
      thumbURL: thumb?.thumbFileURL,
      tag: options.tag,
      refId: options.refId,
      comment: options.comment,
    };

    const target = isFile ? "by-file" : "by-url";
    const id = postId ?? thumb?.postId;
    const url = id
      ? `${this.basePath}/long-video/account/${target}/${id}`
      : `${this.basePath}/long-video/account/${target}`;

    const response = await this.http.post<IPublishLongVideoResult>(url, { ...body, createdFrom: "npmPackage" });
    return this.normaliseLongVideoResult(response.result);
  }

  /**
   * Re-schedule a post that has not published yet, or send it out now.
   *
   * Free — this costs no credits. Only posts still pending with a future
   * publish time are eligible; anything that has started publishing is refused
   * by the server with a reason.
   *
   * @example
   * ```ts
   * await client.reschedulePost("post_123", { schedule: new Date("2026-09-01T09:00:00Z") });
   * await client.reschedulePost("post_123", { schedule: "now" });
   * ```
   */
  async reschedulePost(id: string, data: IReschedulePostRequest): Promise<void> {
    if (!id) {
      throw new Error("id is required");
    }
    await this.http.put(`${this.basePath}/${id}`, {
      schedule: this.buildSchedule(data.schedule),
      ...(data.caption !== undefined ? { caption: data.caption } : {}),
    });
  }

  /**
   * Delete a post that has not published yet, releasing its uploaded media in
   * the same request.
   *
   * Free, and nothing is refunded — nothing was charged for a post that never
   * went out. A post that HAS published is refused; use {@link removePost} to
   * take down media that is already live.
   *
   * @example
   * ```ts
   * await client.deletePost("post_123");
   * ```
   */
  async deletePost(id: string): Promise<void> {
    if (!id) {
      throw new Error("id is required");
    }
    await this.http.delete(`${this.basePath}/${id}`);
  }

  /**
   * Upload a long video and return the URL to publish from.
   *
   * Declares `postType: "longVideo"` so the server refuses now — on plan gating
   * or an empty balance — rather than after an hour of transfer.
   */
  private async uploadLongVideo(
    video: File,
    thumb: File | string | undefined,
    controls: ILongVideoUploadControls & { onProgress?: (progress: number) => void } = {},
  ): Promise<{ videoURL: string; postId: string; uploadUrls: IGenerateUploadUrlsResponse }> {
    const { onProgress, onUploadUrl, resumeFrom, signal, terminateOnAbort } = controls;
    if (video.size > this.maxVideoUploadSizeBytes) {
      throw new Error(`Video file size (${video.size} bytes) exceeds maximum allowed size (${this.maxVideoUploadSizeBytes} bytes)`);
    }

    const allowedVideoTypes = [".mp4", ".mov", ".avi", ".mkv", ".webm"];
    const videoExtension = "." + video.name.split(".").pop()?.toLowerCase();
    if (!allowedVideoTypes.includes(videoExtension)) {
      throw new Error(`Invalid video file type. Allowed types: ${allowedVideoTypes.join(", ")}`);
    }

    // Ask for the thumbnail slot in the SAME call, so both files land in this
    // post's folder. Requesting it separately would allocate a second postId
    // and scatter the media across two folders.
    const uploadUrls = await this.generateUploadUrls({
      videoFileType: video.type,
      thumbFileType: thumb instanceof File ? thumb.type : undefined,
      postType: "longVideo",
    });

    // Prefer the resumable transfer for a long video — this is the case a
    // single PUT handles worst, since a dropped connection at 90% of an hour
    // of footage otherwise starts again from zero. Servers without the
    // resumable service omit the tus fields, and the signed PUT still works.
    if (supportsResumableUpload(uploadUrls.video)) {
      await uploadResumable(uploadUrls.video, video, {
        onProgress,
        onUploadUrl,
        uploadUrl: resumeFrom,
        signal,
        terminateOnAbort,
      });
    } else {
      await uploadToR2(uploadUrls.video.uploadFileURL!, video, {
        contentType: video.type,
        onProgress,
      });
    }

    return { videoURL: uploadUrls.video.fileURL!, postId: uploadUrls.postId, uploadUrls };
  }

  /** Translate the friendly `"now" | Date` form into the wire shape. */
  private buildSchedule(schedule?: "now" | Date): IScheduleConfig | undefined {
    if (!schedule) return undefined;
    return {
      type: schedule === "now" ? "now" : "schedule",
      scheduledAt: schedule instanceof Date ? schedule : undefined,
    };
  }

  /**
   * Guarantee the shape callers destructure. An older server that does not yet
   * return the duration fields would otherwise hand back `undefined` where the
   * types promise numbers.
   */
  private normaliseLongVideoResult(result?: Partial<IPublishLongVideoResult>): IPublishLongVideoResult {
    return {
      _id: result?._id!,
      durationSeconds: result?.durationSeconds ?? 0,
      creditUnits: result?.creditUnits ?? 0,
      credits: result?.credits ?? 0,
      refusedTargets: result?.refusedTargets ?? [],
    };
  }

  /**
   * Auto-detect video source type.
   *
   * @param video - File or URL string
   * @returns Detected source type and video
   */
  private detectVideoSource(video: File | string): "file" | "url" {
    // Check if it's a File object
    if (video instanceof File) {
      return "file";
    }

    if (typeof video === "string") {
      return "url";
    }

    throw new Error("Invalid video type. Must be File or string URL");
  }
}
