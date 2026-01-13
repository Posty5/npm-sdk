import { HttpClient } from '@posty5/core';
import { SocialPublisherTaskClient } from '@posty5/social-publisher-task';
import { TEST_CONFIG, createdResources } from './setup';
import * as fs from 'fs';
import * as path from 'path';

describe('Social Publisher Task SDK', () => {
    let httpClient: HttpClient;
    let client!: SocialPublisherTaskClient;
    let createdId: string;
    let workspaceId: string;

    beforeAll(async () => {
        httpClient = new HttpClient({
            apiKey: TEST_CONFIG.apiKey,
            baseUrl: TEST_CONFIG.baseUrl,
        });
        client = new SocialPublisherTaskClient(httpClient);

        // Note: You need to create a workspace first or use an existing one
        // For testing, you should have a workspace ID ready
        // workspaceId = 'your-workspace-id';
    });

    describe('CREATE - URL-based Publishing', () => {
        it('should create task with video URL', async () => {
            // Skip if no workspace ID
            if (!workspaceId) {
                console.warn('Skipping: No workspace ID available');
                return;
            }

            const result = await client.publishShortVideoByURL({
                workspaceId: workspaceId,
                videoURL: 'https://example.com/video.mp4',
                isAllowYouTube: true,
                youTube: {
                    title: 'Test Video - ' + Date.now(),
                    description: 'Test video from SDK',
                    privacyStatus: 'private',
                },
                schedule: {
                    type: 'now',
                },
            });

            expect(result._id).toBeDefined();
            createdId = result._id;
            createdResources.tasks.push(createdId);
        });

        it('should create task with thumbnail URL', async () => {
            if (!workspaceId) {
                console.warn('Skipping: No workspace ID available');
                return;
            }

            const result = await client.publishShortVideoByURL({
                workspaceId: workspaceId,
                videoURL: 'https://example.com/video.mp4',
                thumbURL: 'https://example.com/thumbnail.jpg',
                isAllowTiktok: true,
                tiktok: {
                    title: 'Test TikTok Video',
                    privacy_level: 'SELF_ONLY',
                },
                schedule: {
                    type: 'now',
                },
            });

            expect(result._id).toBeDefined();
            createdResources.tasks.push(result._id);
        });
    });

    describe('CREATE - File-based Publishing', () => {
        it('should create task with video file', async () => {
            if (!workspaceId) {
                console.warn('Skipping: No workspace ID available');
                return;
            }

            // Load video file from assets
            const videoPath = path.join(__dirname, 'assets', 'thumb.mp4');
            const videoBuffer = fs.readFileSync(videoPath);
            const videoBlob = new Blob([videoBuffer], { type: 'video/mp4' });
            const videoFile = new File([videoBlob], 'test-video.mp4', { type: 'video/mp4' });

            const result = await client.publishShortVideoByFile({
                workspaceId: workspaceId,
                videoFile: videoFile,
                isAllowYouTube: true,
                youTube: {
                    title: 'Test File Upload - ' + Date.now(),
                    description: 'Uploaded from SDK test',
                    privacyStatus: 'private',
                },
                schedule: {
                    type: 'now',
                },
            });

            expect(result._id).toBeDefined();
            createdResources.tasks.push(result._id);
        });

        it('should create task with video and thumbnail files', async () => {
            if (!workspaceId) {
                console.warn('Skipping: No workspace ID available');
                return;
            }

            // Load video file
            const videoPath = path.join(__dirname, 'assets', 'thumb.mp4');
            const videoBuffer = fs.readFileSync(videoPath);
            const videoBlob = new Blob([videoBuffer], { type: 'video/mp4' });
            const videoFile = new File([videoBlob], 'test-video.mp4', { type: 'video/mp4' });

            // Load thumbnail file
            const thumbPath = path.join(__dirname, 'assets', 'video.jpg');
            const thumbBuffer = fs.readFileSync(thumbPath);
            const thumbBlob = new Blob([thumbBuffer], { type: 'image/jpeg' });
            const thumbFile = new File([thumbBlob], 'thumbnail.jpg', { type: 'image/jpeg' });

            const result = await client.publishShortVideoByFile({
                workspaceId: workspaceId,
                videoFile: videoFile,
                thumbFile: thumbFile,
                isAllowTiktok: true,
                tiktok: {
                    title: 'Test with Thumbnail',
                    privacy_level: 'SELF_ONLY',
                },
                schedule: {
                    type: 'now',
                },
            });

            expect(result._id).toBeDefined();
            createdResources.tasks.push(result._id);
        });
    });

    describe('CREATE - Repost from Social Media', () => {
        it('should create task from YouTube video', async () => {
            if (!workspaceId) {
                console.warn('Skipping: No workspace ID available');
                return;
            }

            const result = await client.publishRepostVideoByYoutube({
                workspaceId: workspaceId,
                postURL: 'https://www.youtube.com/shorts/example',
                isAllowTiktok: true,
                tiktok: {
                    title: 'Reposted from YouTube',
                    privacy_level: 'SELF_ONLY',
                },
                schedule: {
                    type: 'now',
                },
            });

            expect(result._id).toBeDefined();
            createdResources.tasks.push(result._id);
        });
    });

    describe('CREATE - Platform-Specific Publishing', () => {
        it('should publish to YouTube only', async () => {
            if (!workspaceId) {
                console.warn('Skipping: No workspace ID available');
                return;
            }

            const result = await client.publishShortVideoToYouTubeOnly({
                workspaceId: workspaceId,
                videoURL: 'https://example.com/video.mp4',
                title: 'YouTube Only Video',
                description: 'This video goes to YouTube only',
                privacyStatus: 'private',
                schedule: {
                    type: 'now',
                },
            });

            expect(result._id).toBeDefined();
            createdResources.tasks.push(result._id);
        });

        it('should publish to TikTok only', async () => {
            if (!workspaceId) {
                console.warn('Skipping: No workspace ID available');
                return;
            }

            const result = await client.publishShortVideoToTiktokOnly({
                workspaceId: workspaceId,
                videoURL: 'https://example.com/video.mp4',
                title: 'TikTok Only Video',
                privacy_level: 'SELF_ONLY',
                schedule: {
                    type: 'now',
                },
            });

            expect(result._id).toBeDefined();
            createdResources.tasks.push(result._id);
        });
    });

    describe('GET BY ID', () => {
        it('should get task by ID', async () => {
            if (!createdId) {
                console.warn('Skipping: No task created');
                return;
            }

            const result = await client.get(createdId);

            expect(result._id).toBe(createdId);
            expect(result.workspaceId).toBeDefined();
        });

        it('should fail with invalid ID', async () => {
            await expect(
                client.get('invalid-id-123')
            ).rejects.toThrow();
        });
    });

    describe('GET LIST', () => {
        it('should get list of tasks', async () => {
            const result = await client.list({}, {
                page: 1,
                limit: 10,
            });

            expect(result.items).toBeInstanceOf(Array);
            expect(result.totalCount).toBeGreaterThanOrEqual(0);
        });

        it('should filter by workspace', async () => {
            if (!workspaceId) {
                console.warn('Skipping: No workspace ID available');
                return;
            }

            const result = await client.list({
                workspaceId: workspaceId,
            }, {
                page: 1,
                limit: 10,
            });

            expect(result.items).toBeInstanceOf(Array);
        });

        it('should filter by status', async () => {
            const result = await client.list({
                currentStatus: 'pending',
            }, {
                page: 1,
                limit: 10,
            });

            expect(result.items).toBeInstanceOf(Array);
        });
    });

    describe('DELETE', () => {
        it('should delete task', async () => {
            if (!createdId) {
                console.warn('Skipping: No task created');
                return;
            }

            await client.delete(createdId);

            // Verify deletion
            await expect(
                client.get(createdId)
            ).rejects.toThrow();
        });
    });
});
