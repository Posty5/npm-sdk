import { HttpClient, IPaginationParams, uploadToR2 } from "@posty5/core";
import {
  ICreateSocialPublisherTaskRequest,
  IGenerateUploadUrlsRequest,
  IGenerateUploadUrlsResponse,
  ISearchSocialPublisherTaskResponse,
  ISocialPublisherTaskNextPreviousResponse,
  ISocialPublisherTaskStatusResponse,
  IDefaultSettingsResponse,
  ITaskSetting,
  IPublishOptions,
  IListParams,
} from "./interfaces";

/**
 * Social Publisher Task Client
 */
export class SocialPublisherTaskClient {
  private http: HttpClient;
  private basePath = "/api/social-publisher-task";
  public readonly maxVideoUploadSizeBytes: number;
  public readonly maxImageUploadSizeBytes: number;

  constructor(http: HttpClient) {
    this.http = http;
    this.maxVideoUploadSizeBytes = 2147483648; //2GB default
    this.maxImageUploadSizeBytes = 1073741824; // 1GB default
  }

  /**
   * Search tasks
   * @param params - Search parameters (optional)
   * @param pagination - Pagination parameters
   */
  async list(params?: IListParams, pagination?: IPaginationParams): Promise<ISearchSocialPublisherTaskResponse> {
    const response = await this.http.get<ISearchSocialPublisherTaskResponse>(this.basePath, {
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
   * Get task status
   * @param id - Task ID
   */
  async getStatus(id: string): Promise<ISocialPublisherTaskStatusResponse> {
    const response = await this.http.get<ISocialPublisherTaskStatusResponse>(`${this.basePath}/${id}/status`);
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
   * Get next and previous task IDs
   * @param id - Current Task ID
   */
  async getNextAndPrevious(id: string): Promise<ISocialPublisherTaskNextPreviousResponse> {
    const response = await this.http.get<ISocialPublisherTaskNextPreviousResponse>(`${this.basePath}/${id}/next-previous`);
    return response.result!;
  }

  /**
   * Create a new task (publish video)
   * @param data - Task creation data
   * @param id - Optional ID for updating/retrying? (Based on route :id?)
   */
  private async createByFile(data: ICreateSocialPublisherTaskRequest, id?: string): Promise<string> {
    const url = id ? `${this.basePath}/short-video/by-file/${id}` : `${this.basePath}/short-video/by-file`;
    const response = await this.http.post<{ _id: string }>(url, {
      ...data,
      createdFrom: "npmPackage",
    });
    return response.result?._id!;
  }

  /**
   * Create a new task (publish video)
   * @param data - Task creation data
   * @param id - Optional ID for updating/retrying? (Based on route :id?)
   */
  private async createByURL(data: ICreateSocialPublisherTaskRequest, id?: string): Promise<string> {
    const url = id ? `${this.basePath}/short-video/by-url/${id}` : `${this.basePath}/short-video/by-url`;
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
      return { thumbFileURL: thumb, taskId: undefined };
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

        return { thumbFileURL: uploadUrlsResponse.thumb.fileURL, taskId: uploadUrlsResponse.taskId };
      }
    }

    return undefined;
  }

  /**
   * Publish a short video by uploading a video file and optional thumbnail
   * @param settings - Task creation settings
   * @param video - Video file to upload (.mp4, .mov, .avi, .mkv, .webm)
   * @param thumb - Optional thumbnail image file or URL string
   * @returns Created task response
   */
  private async publishShortVideoByFile(settings: ITaskSetting, video: File, thumb?: File | string): Promise<string> {
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

    // Step 4: Create task with uploaded file URLs
    const taskSettings: ICreateSocialPublisherTaskRequest = {
      ...settings,
      videoURL: uploadUrlsResponse.video.fileURL,
      thumbURL: uploadThumb?.thumbFileURL,
    };

    return await this.createByFile(taskSettings, uploadUrlsResponse.taskId);
  }

  /**
   * Publish a short video by providing a video URL and optional thumbnail
   * @param settings - Task creation settings
   * @param videoURL - Video URL (.mp4, .mov, .avi, .mkv, .webm)
   * @param thumb - Optional thumbnail image file or URL string
   * @returns Created task response
   */
  private async publishShortVideoByURL(settings: ITaskSetting, videoURL: string, thumb?: File | string): Promise<string> {
    // Handle thumbnail upload (File or URL)
    const uploadThumb = await this.handleThumbnailUpload(thumb);

    // Create task with video URL
    const taskSettings: ICreateSocialPublisherTaskRequest = {
      ...settings,
      videoURL,
      thumbURL: uploadThumb?.thumbFileURL,
    };

    return await this.createByURL(taskSettings, uploadThumb?.taskId);
  }

  /**
   * Publish a repost video from TikTok
   * @param settings - Task creation settings
   * @param videoURL - TikTok video URL (tiktok.com, vm.tiktok.com)
   * @param thumb - Optional thumbnail image file or URL string
   * @returns Created task response
   */
  private async publishRepostVideo(settings: ITaskSetting, videoURL: string, thumb?: File | string): Promise<string> {
    // Handle thumbnail upload (File or URL)
    const uploadThumb = await this.handleThumbnailUpload(thumb);

    // Create task with TikTok video URL
    const taskSettings: ICreateSocialPublisherTaskRequest = {
      ...settings,
      postURL: videoURL,
      thumbURL: uploadThumb?.thumbFileURL,
    };

    return await this.createByURL(taskSettings, uploadThumb?.taskId);
  }

  /**
   * Publish a video to multiple social media platforms with auto-detection
   * This is the recommended method for most use cases.
   *
   * @param options - Simplified publishing options
   * @returns Created task response
   *
   * @example
   * ```typescript
   * // Publish video file to YouTube
   * await client.publish({
   *     workspaceId: 'workspace-123',
   *     video: videoFile,
   *     thumbnail: thumbFile,
   *     platforms: ['youtube'],
   *     youtube: {
   *         title: 'My Video',
   *         description: 'Description',
   *         tags: ['tag1', 'tag2']
   *     }
   * });
   *
   * // Publish to multiple platforms
   * await client.publish({
   *     workspaceId: 'workspace-123',
   *     video: 'https://example.com/video.mp4',
   *     thumbnail: 'https://example.com/thumb.jpg',
   *     platforms: ['youtube', 'tiktok'],
   *     youtube: { title: 'Video', description: 'Desc', tags: [] },
   *     tiktok: { caption: 'Caption', privacy_level: 'public', disable_duet: false, disable_stitch: false, disable_comment: false }
   * });
   *
   * // Repost from Facebook (auto-detected)
   * await client.publish({
   *     workspaceId: 'workspace-123',
   *     video: 'https://facebook.com/video/12345',
   *     platforms: ['youtube'],
   *     youtube: { title: 'Reposted', description: 'From FB', tags: [] }
   * });
   * ```
   */
  async publishShortVideo(options: IPublishOptions): Promise<string> {
    // Validate required fields
    if (!options.workspaceId) {
      throw new Error("workspaceId is required");
    }
    if (!options.video) {
      throw new Error("video is required");
    }
    if (!options.platforms || options.platforms.length === 0) {
      throw new Error("At least one platform must be specified");
    }

    // Validate platform configurations
    if (options.platforms.includes("youtube") && !options.youtube) {
      throw new Error("YouTube configuration is required when publishing to YouTube");
    }
    if (options.platforms.includes("tiktok") && !options.tiktok) {
      throw new Error("TikTok configuration is required when publishing to TikTok");
    }
    if (options.platforms.includes("facebook") && !options.facebook) {
      throw new Error("Facebook configuration is required when publishing to Facebook");
    }
    if (options.platforms.includes("instagram") && !options.instagram) {
      throw new Error("Instagram configuration is required when publishing to Instagram");
    }

    // Build ITaskSetting from simplified options
    const settings: ITaskSetting = {
      workspaceId: options.workspaceId,
      isAllowYouTube: options.platforms.includes("youtube"),
      isAllowTiktok: options.platforms.includes("tiktok"),
      isAllowFacebookPage: options.platforms.includes("facebook"),
      isAllowInstagram: options.platforms.includes("instagram"),
      youTube: options.youtube,
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
    };

    // Auto-detect video source type
    const source = this.detectVideoSource(options.video);

    // Route to appropriate method based on detected source
    switch (source) {
      case "file": {
        return this.publishShortVideoByFile(settings, options.video as File, options.thumbnail);
      }

      case "url": {
        return this.publishShortVideoByURL(settings, options.video as string, options.thumbnail);
      }
      case "repost": {
        return this.publishRepostVideo(settings, options.video as string, options.thumbnail);
      }
      default:
        throw new Error(`Unknown video source type: ${source}`);
    }
  }

  /**
   * Auto-detect video source type
   * @param video - File or URL string
   * @returns Detected source type and video
   */
  private detectVideoSource(video: File | string): "file" | "url" | "repost" {
    // Check if it's a File object
    if (video instanceof File) {
      return "file";
    }

    // Check for platform-specific URLs
    if (typeof video === "string") {
      // Facebook video URL
      if (/^https?:\/\/(www\.)?(facebook\.com|fb\.watch)\/(reel|watch|.*\/videos)\/.*/i.test(video)) {
        return "repost";
      }

      // TikTok video URL
      if (/^https?:\/\/(www\.)?(tiktok\.com\/@[^\/]+\/video\/\d+|vm\.tiktok\.com\/\w+|vt\.tiktok\.com\/\w+)/i.test(video)) {
        return "repost";
      }

      // YouTube Shorts URL
      if (/^https?:\/\/(www\.)?(youtube\.com\/shorts\/|youtu\.be\/)[A-Za-z0-9_-]+/i.test(video)) {
        return "repost";
      }

      // Generic video URL
      return "url";
    }

    throw new Error("Invalid video type. Must be File or string URL");
  }
}
