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
    ITaskSetting
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
     * Publish a short video by uploading a video file and optional thumbnail
     * @param settings - Task creation settings
     * @param video - Video file to upload (.mp4, .mov, .avi, .mkv, .webm)
     * @param thumb - Optional thumbnail image file
     * @returns Created task response
     */
    async publishShortVideoByFile(settings: ITaskSetting, video: File, thumb?: File): Promise<ICreateSocialPublisherTaskResponse> {
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

        // Validate thumbnail file if provided
        if (thumb) {
            if (thumb.size > this.maxImageUploadSizeBytes) {
                throw new Error(`Thumbnail file size (${thumb.size} bytes) exceeds maximum allowed size (${this.maxImageUploadSizeBytes} bytes)`);
            }
        }

        this.checkFromPlatform(settings);

        // Step 1: Generate upload URLs
        const uploadUrlsResponse = await this.generateUploadUrls({
            thumbFileType: thumb?.type,
            videoFileType: video.type
        });

        // Step 2: Upload thumbnail if provided
        if (thumb && uploadUrlsResponse.uploadThumb) {
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
        }

        // Step 3: Upload video
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

        // Step 4: Create task with uploaded file URLs
        const taskSettings: ICreateSocialPublisherTaskRequest = {
            ...settings,
            videoURL: uploadUrlsResponse.videoUplaodFileURL,
            thumbURL: uploadUrlsResponse.thumbUploadFileURL,
            source: "video-file"
        };

        return await this.create(taskSettings, uploadUrlsResponse.organization._id);
    }

    /**
     * Publish a short video by providing a video URL and optional thumbnail file
     * @param settings - Task creation settings
     * @param videoURL - Video URL (.mp4, .mov, .avi, .mkv, .webm)
     * @param thumb - Optional thumbnail image file
     * @returns Created task response
     */
    async publishShortVideoByURL(settings: ITaskSetting, videoURL: string, thumb?: File): Promise<ICreateSocialPublisherTaskResponse> {
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

        let thumbURL: string | undefined;
        this.checkFromPlatform(settings);

        // Upload thumbnail if provided
        if (thumb) {
            // Validate thumbnail file
            if (thumb.size > this.maxImageUploadSizeBytes) {
                throw new Error(`Thumbnail file size (${thumb.size} bytes) exceeds maximum allowed size (${this.maxImageUploadSizeBytes} bytes)`);
            }

            const uploadUrlsResponse = await this.generateUploadUrls({
                thumbFileType: thumb.type
            });

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

                thumbURL = uploadUrlsResponse.thumbUploadFileURL;
            }
        }

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
     * @param thumb - Optional thumbnail image file
     * @returns Created task response
     */
    async publishRepostVideoByFacebook(settings: ITaskSetting, videoURL: string, thumb?: File): Promise<ICreateSocialPublisherTaskResponse> {
        // Validate Facebook video URL
        const facebookUrlPattern = /^https?:\/\/(www\.)?(facebook\.com|fb\.watch)\/(reel|watch|.*\/videos)\/.*/i;
        if (!facebookUrlPattern.test(videoURL)) {
            throw new Error('Invalid Facebook video URL');
        }

        let thumbURL: string | undefined;
        this.checkFromPlatform(settings);

        // Upload thumbnail if provided
        if (thumb) {
            // Validate thumbnail file
            if (thumb.size > this.maxImageUploadSizeBytes) {
                throw new Error(`Thumbnail file size (${thumb.size} bytes) exceeds maximum allowed size (${this.maxImageUploadSizeBytes} bytes)`);
            }

            const uploadUrlsResponse = await this.generateUploadUrls({
                thumbFileType: thumb.type
            });

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

                thumbURL = uploadUrlsResponse.thumbUploadFileURL;
            }
        }

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
     * @param thumb - Optional thumbnail image file
     * @returns Created task response
     */
    async publishRepostVideoByTiktok(settings: ITaskSetting, videoURL: string, thumb?: File): Promise<ICreateSocialPublisherTaskResponse> {
        // Validate TikTok video URL
        const tiktokUrlPattern = /^https?:\/\/(www\.)?(tiktok\.com|vm\.tiktok\.com)\/@?.*\/(video\/\d+|.*)/i;
        if (!tiktokUrlPattern.test(videoURL)) {
            throw new Error('Invalid TikTok video URL');
        }

        let thumbURL: string | undefined;
        this.checkFromPlatform(settings);

        // Upload thumbnail if provided
        if (thumb) {
            // Validate thumbnail file
            if (thumb.size > this.maxImageUploadSizeBytes) {
                throw new Error(`Thumbnail file size (${thumb.size} bytes) exceeds maximum allowed size (${this.maxImageUploadSizeBytes} bytes)`);
            }

            const uploadUrlsResponse = await this.generateUploadUrls({
                thumbFileType: thumb.type
            });

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

                thumbURL = uploadUrlsResponse.thumbUploadFileURL;
            }
        }

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
     * @param thumb - Optional thumbnail image file
     * @returns Created task response
     */
    async publishRepostVideoByYoutube(settings: ITaskSetting, videoURL: string, thumb?: File): Promise<ICreateSocialPublisherTaskResponse> {
        // Validate YouTube Shorts URL
        const youtubeUrlPattern = /^https?:\/\/(www\.)?(youtube\.com\/shorts\/|youtu\.be\/)[A-Za-z0-9_-]+/i;
        if (!youtubeUrlPattern.test(videoURL)) {
            throw new Error('Invalid YouTube Shorts URL');
        }

        let thumbURL: string | undefined;
        this.checkFromPlatform(settings);

        // Upload thumbnail if provided
        if (thumb) {
            // Validate thumbnail file
            if (thumb.size > this.maxImageUploadSizeBytes) {
                throw new Error(`Thumbnail file size (${thumb.size} bytes) exceeds maximum allowed size (${this.maxImageUploadSizeBytes} bytes)`);
            }

            const uploadUrlsResponse = await this.generateUploadUrls({
                thumbFileType: thumb.type
            });

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

                thumbURL = uploadUrlsResponse.thumbUploadFileURL;
            }
        }

        // Create task with YouTube video URL
        const taskSettings: ICreateSocialPublisherTaskRequest = {
            ...settings,
            postURL: videoURL,
            thumbURL,
            source: "youtube-video"
        };

        return await this.create(taskSettings);
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
