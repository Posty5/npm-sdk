import { HttpClient, IPaginationParams } from '@posty5/core';
import {
    ICreateSocialPublisherTaskRequest,
    IGenerateUploadUrlsRequest,
    IGenerateUploadUrlsResponse,
    ICreateSocialPublisherTaskResponse,
    ISearchSocialPublisherTaskResponse,
    ISocialPublisherTaskNextPreviousResponse,
    ISocialPublisherTaskStatusResponse,
    IDefaultSettingsResponse,
    ITaskSetting,
    IPublishOptions,
    IQuickPublishYouTubeOptions,
    IQuickPublishTikTokOptions,
    IQuickPublishFacebookOptions,
    IQuickPublishInstagramOptions,
    IQuickPublishAllOptions,
    IUploadConfig
} from './interfaces';

/**
 * Configuration options for Social Publisher Task Client
 */
export interface ISocialPublisherTaskClientConfig {
    /**
     * Maximum video upload size in bytes
     * @default 1073741824 (1GB)
     */
    maxVideoUploadSizeBytes?: number;

    /**
     * Maximum image/thumbnail upload size in bytes
     * @default 8388608 (8MB)
     */
    maxImageUploadSizeBytes?: number;
}

/**
 * Social Publisher Task Client
 */
export class SocialPublisherTaskClient {
    private http: HttpClient;
    private basePath = '/api/social-publisher-task';
    public readonly maxVideoUploadSizeBytes: number;
    public readonly maxImageUploadSizeBytes: number;

    constructor(http: HttpClient, config?: ISocialPublisherTaskClientConfig) {
        this.http = http;
        this.maxVideoUploadSizeBytes = config?.maxVideoUploadSizeBytes ?? 1073741824; // 1GB default
        this.maxImageUploadSizeBytes = config?.maxImageUploadSizeBytes ?? 8388608; // 8MB default
    }

    /**
     * Search tasks
     * @param params - Search parameters (optional)
     * @param pagination - Pagination parameters
     */
    async search(params?: any, pagination?: IPaginationParams): Promise<ISearchSocialPublisherTaskResponse> {
        const response = await this.http.get<ISearchSocialPublisherTaskResponse>(this.basePath, {
            params: {
                ...params,
                ...pagination
            }
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
        const response = await this.http.post<IGenerateUploadUrlsResponse>(`${this.basePath}/generate-uplaod-signd-urls`, data);
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
    private async create(data: ICreateSocialPublisherTaskRequest, id?: string): Promise<ICreateSocialPublisherTaskResponse> {
        const url = id ? `${this.basePath}/short-video/${id}` : `${this.basePath}/short-video`;
        const response = await this.http.post<ICreateSocialPublisherTaskResponse>(url, {
            ...data,
            createdFrom: "npmPackage"
        });
        return response.result!;
    }

    /**
     * Handle thumbnail upload - accepts either File or URL string
     * @param thumb - Thumbnail as File (will be uploaded) or URL string (will be passed directly)
     * @returns Thumbnail URL or undefined
     */
    private async handleThumbnailUpload(thumb?: File | string, uploadUrlsResponse?: IGenerateUploadUrlsResponse): Promise<string | undefined> {
        if (!thumb) {
            return undefined;
        }

        // If thumb is a string (URL), validate and return it directly
        if (typeof thumb === 'string') {
            const urlPattern = /(http:\/\/)..*|(https:\/\/)..*/gi;
            if (!urlPattern.test(thumb)) {
                throw new Error('Invalid thumbnail URL format');
            }
            return thumb;
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
                    thumbFileType: thumb.type
                });
            }

            if (uploadUrlsResponse.uploadThumb) {
                const thumbFormData = new FormData();

                // Add all fields from the signed URL configuration
                Object.entries(uploadUrlsResponse.uploadThumb.fields).forEach(([key, value]) => {
                    thumbFormData.append(key, value);
                });

                // Add the file last (required by AWS S3/R2)
                thumbFormData.append('file', thumb);

                // Upload to R2
                await fetch(uploadUrlsResponse.uploadThumb.url, {
                    method: 'POST',
                    body: thumbFormData,
                });

                return uploadUrlsResponse.thumbUploadFileURL;
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
    private async publishShortVideoByFile(settings: ITaskSetting, video: File, thumb?: File | string): Promise<ICreateSocialPublisherTaskResponse> {
        // Validate video size
        if (video.size > this.maxVideoUploadSizeBytes) {
            throw new Error(`Video file size (${video.size} bytes) exceeds maximum allowed size (${this.maxVideoUploadSizeBytes} bytes)`);
        }

        // Validate video file type
        const allowedVideoTypes = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
        const videoExtension = '.' + video.name.split('.').pop()?.toLowerCase();
        if (!allowedVideoTypes.includes(videoExtension)) {
            throw new Error(`Invalid video file type. Allowed types: ${allowedVideoTypes.join(', ')}`);
        }

        this.checkFromPlatform(settings);


        // Step 1: Generate upload URLs for video
        const uploadUrlsResponse = await this.generateUploadUrls({
            videoFileType: video.type
        });

        // Step 2: Upload video
        const videoFormData = new FormData();

        // Add all fields from the signed URL configuration
        Object.entries(uploadUrlsResponse.uploadVideo.fields).forEach(([key, value]) => {
            videoFormData.append(key, value);
        });

        // Add the file last (required by AWS S3/R2)
        videoFormData.append('file', video);

        // Upload to R2
        await fetch(uploadUrlsResponse.uploadVideo.url, {
            method: 'POST',
            body: videoFormData,
        });

        // Step 3: Handle thumbnail upload (File or URL)
        const thumbURL = await this.handleThumbnailUpload(thumb, uploadUrlsResponse);


        // Step 4: Create task with uploaded file URLs
        const taskSettings: ICreateSocialPublisherTaskRequest = {
            ...settings,
            videoURL: uploadUrlsResponse.videoUplaodFileURL,
            thumbURL,
            source: "video-file"
        };

        return await this.create(taskSettings, uploadUrlsResponse.workspace._id);
    }

    /**
     * Publish a short video by providing a video URL and optional thumbnail
     * @param settings - Task creation settings
     * @param videoURL - Video URL (.mp4, .mov, .avi, .mkv, .webm)
     * @param thumb - Optional thumbnail image file or URL string
     * @returns Created task response
     */
    private async publishShortVideoByURL(settings: ITaskSetting, videoURL: string, thumb?: File | string): Promise<ICreateSocialPublisherTaskResponse> {
        // Validate video URL
        const videoUrlPattern = /(http:\/\/)..*|(https:\/\/)..*/gi;
        if (!videoUrlPattern.test(videoURL)) {
            throw new Error('Invalid video URL format');
        }

        // Validate video URL extension
        const allowedVideoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
        const hasValidExtension = allowedVideoExtensions.some(ext => videoURL.toLowerCase().includes(ext));
        if (!hasValidExtension) {
            throw new Error(`Invalid video URL. Must contain one of: ${allowedVideoExtensions.join(', ')}`);
        }

        this.checkFromPlatform(settings);

        // Handle thumbnail upload (File or URL)
        const thumbURL = await this.handleThumbnailUpload(thumb);

        // Create task with video URL
        const taskSettings: ICreateSocialPublisherTaskRequest = {
            ...settings,
            videoURL,
            thumbURL,
            source: "video-url"
        };

        return await this.create(taskSettings);
    }

    /**
     * Publish a repost video from Facebook
     * @param settings - Task creation settings
     * @param videoURL - Facebook video URL (facebook.com, fb.watch)
     * @param thumb - Optional thumbnail image file or URL string
     * @returns Created task response
     */
    private async publishRepostVideoByFacebook(settings: ITaskSetting, videoURL: string, thumb?: File | string): Promise<ICreateSocialPublisherTaskResponse> {
        // Validate Facebook video URL
        const facebookUrlPattern = /^https?:\/\/(www\.)?(facebook\.com|fb\.watch)\/(reel|watch|.*\/videos)\/.*/i;
        if (!facebookUrlPattern.test(videoURL)) {
            throw new Error('Invalid Facebook video URL');
        }

        this.checkFromPlatform(settings);

        // Handle thumbnail upload (File or URL)
        const thumbURL = await this.handleThumbnailUpload(thumb);

        // Create task with Facebook video URL
        const taskSettings: ICreateSocialPublisherTaskRequest = {
            ...settings,
            postURL: videoURL,
            thumbURL,
            source: "video-url"
        };

        return await this.create(taskSettings);
    }

    /**
     * Publish a repost video from TikTok
     * @param settings - Task creation settings
     * @param videoURL - TikTok video URL (tiktok.com, vm.tiktok.com)
     * @param thumb - Optional thumbnail image file or URL string
     * @returns Created task response
     */
    private async publishRepostVideoByTiktok(settings: ITaskSetting, videoURL: string, thumb?: File | string): Promise<ICreateSocialPublisherTaskResponse> {
        // Validate TikTok video URL
        const tiktokUrlPattern = /^https?:\/\/(www\.)?(tiktok\.com|vm\.tiktok\.com)\/@?.*\/(video\/\d+|.*)/i;
        if (!tiktokUrlPattern.test(videoURL)) {
            throw new Error('Invalid TikTok video URL');
        }

        this.checkFromPlatform(settings);

        // Handle thumbnail upload (File or URL)
        const thumbURL = await this.handleThumbnailUpload(thumb);

        // Create task with TikTok video URL
        const taskSettings: ICreateSocialPublisherTaskRequest = {
            ...settings,
            postURL: videoURL,
            thumbURL,
            source: "tiktok-video"
        };

        return await this.create(taskSettings);
    }

    /**
     * Publish a repost video from YouTube Shorts
     * @param settings - Task creation settings
     * @param videoURL - YouTube Shorts URL (youtube.com/shorts/, youtu.be/)
     * @param thumb - Optional thumbnail image file or URL string
     * @returns Created task response
     */
    private async publishRepostVideoByYoutube(settings: ITaskSetting, videoURL: string, thumb?: File | string): Promise<ICreateSocialPublisherTaskResponse> {
        // Validate YouTube Shorts URL
        const youtubeUrlPattern = /^https?:\/\/(www\.)?(youtube\.com\/shorts\/|youtu\.be\/)[A-Za-z0-9_-]+/i;
        if (!youtubeUrlPattern.test(videoURL)) {
            throw new Error('Invalid YouTube Shorts URL');
        }

        this.checkFromPlatform(settings);

        // Handle thumbnail upload (File or URL)
        const thumbURL = await this.handleThumbnailUpload(thumb);

        // Create task with YouTube video URL
        const taskSettings: ICreateSocialPublisherTaskRequest = {
            ...settings,
            postURL: videoURL,
            thumbURL,
            source: "youtube-video"
        };

        return await this.create(taskSettings);
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
    async publish(options: IPublishOptions): Promise<ICreateSocialPublisherTaskResponse> {
        // Validate required fields
        if (!options.workspaceId) {
            throw new Error('workspaceId is required');
        }
        if (!options.video) {
            throw new Error('video is required');
        }
        if (!options.platforms || options.platforms.length === 0) {
            throw new Error('At least one platform must be specified');
        }

        // Validate platform configurations
        if (options.platforms.includes('youtube') && !options.youtube) {
            throw new Error('YouTube configuration is required when publishing to YouTube');
        }
        if (options.platforms.includes('tiktok') && !options.tiktok) {
            throw new Error('TikTok configuration is required when publishing to TikTok');
        }
        if (options.platforms.includes('facebook') && !options.facebook) {
            throw new Error('Facebook configuration is required when publishing to Facebook');
        }
        if (options.platforms.includes('instagram') && !options.instagram) {
            throw new Error('Instagram configuration is required when publishing to Instagram');
        }

        // Build ITaskSetting from simplified options
        const settings: ITaskSetting = {
            workspaceId: options.workspaceId,
            isAllowYouTube: options.platforms.includes('youtube'),
            isAllowTiktok: options.platforms.includes('tiktok'),
            isAllowFacebookPage: options.platforms.includes('facebook'),
            isAllowInstagram: options.platforms.includes('instagram'),
            youTube: options.youtube,
            tiktok: options.tiktok,
            facebookPage: options.facebook,
            instagram: options.instagram,
            schedule: options.schedule ? {
                type: options.schedule === 'now' ? 'now' : 'schedule',
                scheduledAt: options.schedule instanceof Date ? options.schedule : undefined
            } : undefined
        };

        // Auto-detect video source type
        const source = this.detectVideoSource(options.video);

        // Route to appropriate method based on detected source
        switch (source.type) {
            case 'file':
                return this.publishShortVideoByFile(settings, source.video as File, options.thumbnail);

            case 'url':
                return this.publishShortVideoByURL(settings, source.video as string, options.thumbnail);

            case 'facebook':
                return this.publishRepostVideoByFacebook(settings, source.video as string, options.thumbnail);

            case 'tiktok':
                return this.publishRepostVideoByTiktok(settings, source.video as string, options.thumbnail);

            case 'youtube':
                return this.publishRepostVideoByYoutube(settings, source.video as string, options.thumbnail);

            default:
                throw new Error(`Unknown video source type: ${source.type}`);
        }
    }

    /**
     * Auto-detect video source type
     * @param video - File or URL string
     * @returns Detected source type and video
     */
    private detectVideoSource(video: File | string): { type: 'file' | 'url' | 'facebook' | 'tiktok' | 'youtube', video: File | string } {
        // Check if it's a File object
        if (video instanceof File) {
            return { type: 'file', video };
        }

        // Check for platform-specific URLs
        if (typeof video === 'string') {
            // Facebook video URL
            if (/^https?:\/\/(www\.)?(facebook\.com|fb\.watch)\/(reel|watch|.*\/videos)\/.*/i.test(video)) {
                return { type: 'facebook', video };
            }

            // TikTok video URL
            if (/^https?:\/\/(www\.)?(tiktok\.com|vm\.tiktok\.com)\/@?.*\/(video\/\d+|.*)/i.test(video)) {
                return { type: 'tiktok', video };
            }

            // YouTube Shorts URL
            if (/^https?:\/\/(www\.)?(youtube\.com\/shorts\/|youtu\.be\/)[A-Za-z0-9_-]+/i.test(video)) {
                return { type: 'youtube', video };
            }

            // Generic video URL
            return { type: 'url', video };
        }

        throw new Error('Invalid video type. Must be File or string URL');
    }

    /**
     * Publish a short video to YouTube only
     * 
     * @param options - YouTube publish options
     * @returns Created task response
     * 
     * @example
     * ```typescript
     * await client.publishShortVideoToYouTubeOnly({
     *     workspaceId: 'workspace-123',
     *     video: videoFile,
     *     title: 'My Video',
     *     description: 'Video description',
     *     tags: ['tag1', 'tag2'],
     *     thumbnail: thumbFile
     * });
     * ```
     */
    async publishShortVideoToYouTubeOnly(options: IQuickPublishYouTubeOptions): Promise<ICreateSocialPublisherTaskResponse> {
        return this.publish({
            workspaceId: options.workspaceId,
            video: options.video,
            thumbnail: options.thumbnail,
            platforms: ['youtube'],
            youtube: {
                title: options.title,
                description: options.description,
                tags: options.tags,
                madeForKids: options.madeForKids
            },
            schedule: options.schedule,
            tag: options.tag,
            refId: options.refId
        });
    }

    /**
     * Publish a short video to TikTok only
     * 
     * @param options - TikTok publish options
     * @returns Created task response
     * 
     * @example
     * ```typescript
     * await client.publishShortVideoToTiktokOnly({
     *     workspaceId: 'workspace-123',
     *     video: videoFile,
     *     caption: 'My TikTok video #viral',
     *     thumbnail: thumbFile,
     *     privacy_level: 'public'
     * });
     * ```
     */
    async publishShortVideoToTiktokOnly(options: IQuickPublishTikTokOptions): Promise<ICreateSocialPublisherTaskResponse> {
        return this.publish({
            workspaceId: options.workspaceId,
            video: options.video,
            thumbnail: options.thumbnail,
            platforms: ['tiktok'],
            tiktok: {
                caption: options.caption,
                privacy_level: options.privacy_level || 'public',
                disable_duet: options.disable_duet ?? false,
                disable_stitch: options.disable_stitch ?? false,
                disable_comment: options.disable_comment ?? false
            },
            schedule: options.schedule,
            tag: options.tag,
            refId: options.refId
        });
    }

    /**
     * Publish a short video to Facebook only
     * 
     * @param options - Facebook publish options
     * @returns Created task response
     * 
     * @example
     * ```typescript
     * await client.publishShortVideoToFacebookOnly({
     *     workspaceId: 'workspace-123',
     *     video: videoFile,
     *     title: 'My Video',
     *     description: 'Video description',
     *     thumbnail: thumbFile
     * });
     * ```
     */
    async publishShortVideoToFacebookOnly(options: IQuickPublishFacebookOptions): Promise<ICreateSocialPublisherTaskResponse> {
        return this.publish({
            workspaceId: options.workspaceId,
            video: options.video,
            thumbnail: options.thumbnail,
            platforms: ['facebook'],
            facebook: {
                title: options.title,
                description: options.description
            },
            schedule: options.schedule,
            tag: options.tag,
            refId: options.refId
        });
    }

    /**
     * Publish a short video to Instagram only
     * 
     * @param options - Instagram publish options
     * @returns Created task response
     * 
     * @example
     * ```typescript
     * await client.publishShortVideoToInstagramOnly({
     *     workspaceId: 'workspace-123',
     *     video: videoFile,
     *     description: 'Video description',
     *     thumbnail: thumbFile
     * });
     * ```
     */
    async publishShortVideoToInstagramOnly(options: IQuickPublishInstagramOptions): Promise<ICreateSocialPublisherTaskResponse> {
        return this.publish({
            workspaceId: options.workspaceId,
            video: options.video,
            thumbnail: options.thumbnail,
            platforms: ['instagram'],
            instagram: {
                description: options.description,
                share_to_feed: options.share_to_feed,
                is_published_to_both_feed_and_story: options.is_published_to_both_feed_and_story
            },
            schedule: options.schedule,
            tag: options.tag,
            refId: options.refId
        });
    }


    checkFromPlatform(settings: ITaskSetting) {
        if (settings.isAllowFacebookPage && !settings.facebookPage) {
            throw new Error('Facebook page is required');
        }
        if (settings.isAllowInstagram && !settings.instagram) {
            throw new Error('Instagram is required');
        }
        if (settings.isAllowTiktok && !settings.tiktok) {
            throw new Error('Tiktok is required');
        }
        if (settings.isAllowYouTube && !settings.youTube) {
            throw new Error('YouTube is required');
        }
    }
}
