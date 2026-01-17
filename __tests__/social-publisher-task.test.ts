import { HttpClient } from '@posty5/core';
import { SocialPublisherTaskClient } from '@posty5/social-publisher-task';
import { TEST_CONFIG, createdResources } from './setup';
import * as fs from 'fs';
import * as path from 'path';
function getVideo() {
    const filePath = path.join(__dirname, "assets", "video.mp4");
    const fileContent = fs.readFileSync(filePath);
    const blob = new Blob([fileContent], { type: "video/mp4" });
    const file = new File([blob], "video.mp4", { type: "video/mp4" });
    return file;
}

function getThumb() {
    const filePath = path.join(__dirname, "assets", "thumb.jpg");
    const fileContent = fs.readFileSync(filePath);
    const blob = new Blob([fileContent], { type: "image/jpeg" });
    const file = new File([blob], "thumb.jpg", { type: "image/jpeg" });
    return file;
}
describe('Social Publisher Task SDK', () => {
    let httpClient: HttpClient;
    let client!: SocialPublisherTaskClient;
    let createdId: string;
    let workspaceId: string;
    let thumbnailURL = "https://images.unsplash.com/3/GoWildImages_MtEverest_NEP0555.jpg";
    let videoURL = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4";
    let facebookReelURL = "https://www.facebook.com/reel/1794235308045414";
    let youtubeShortsURL = "https://www.youtube.com/shorts/jkiHUTnDJnk";
    let tikTokVideoURL = "https://www.tiktok.com/@tamra.ai/video/7592228093834841362";
    let thumbnail = "https://images.unsplash.com/photo-1506744038136-46273834b3fb";
    beforeAll(async () => {
        httpClient = new HttpClient({
            apiKey: TEST_CONFIG.apiKey,
            baseUrl: TEST_CONFIG.baseUrl,
            debug: true,

        });
        client = new SocialPublisherTaskClient(httpClient);

        workspaceId = '69693ef08810cf26d95ad905';
    });

    describe('CREATE - publishShortVideo with Video File', () => {
        it('should publish video file with thumbnail URL', async () => {
            if (!workspaceId) {
                console.warn('Skipping: No workspace ID available');
                return;
            }

            const videoFile = getVideo();

            const result = await client.publishShortVideo({
                workspaceId: workspaceId,
                video: videoFile,
                thumbnail: thumbnailURL,
                platforms: ['youtube'],
                youtube: {
                    title: 'Video File + Thumb URL - ' + Date.now(),
                    description: 'Testing video file with thumbnail URL',
                    tags: ['test', 'sdk']
                }
            });

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
            createdId = result;
            createdResources.tasks.push(createdId);
        });

        // it('should publish video file with thumbnail file', async () => {
        //     if (!workspaceId) {
        //         console.warn('Skipping: No workspace ID available');
        //         return;
        //     }

        //     const videoFile = getVideo();
        //     const thumbFile = getThumb();

        //     const result = await client.publishShortVideo({
        //         workspaceId: workspaceId,
        //         video: videoFile,
        //         thumbnail: thumbFile,
        //         platforms: ['tiktok'],
        //         tiktok: {
        //             caption: 'Video File + Thumb File - ' + Date.now(),
        //             privacy_level: 'SELF_ONLY',
        //             disable_duet: false,
        //             disable_stitch: false,
        //             disable_comment: false
        //         }
        //     });

        //     expect(result).toBeDefined();
        //     expect(typeof result).toBe('string');
        //     createdResources.tasks.push(result);
        // });
    });

    describe('CREATE - publishShortVideo with Video URL', () => {
        it('should publish video URL with thumbnail file', async () => {
            if (!workspaceId) {
                console.warn('Skipping: No workspace ID available');
                return;
            }
            const thumbFile = getThumb();
            const result = await client.publishShortVideo({
                workspaceId: workspaceId,
                video: videoURL,
                thumbnail: thumbFile,
                platforms: ['youtube'],
                youtube: {
                    title: 'Video URL + Thumb File - ' + Date.now(),
                    description: 'Testing video URL with thumbnail file',
                    tags: ['test', 'url']
                }
            });

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
            createdResources.tasks.push(result);
        });

        it('should publish video URL with thumbnail URL', async () => {
            if (!workspaceId) {
                console.warn('Skipping: No workspace ID available');
                return;
            }

            const result = await client.publishShortVideo({
                workspaceId: workspaceId,
                video: videoURL,
                thumbnail: thumbnailURL,
                platforms: ['youtube', 'tiktok'],
                youtube: {
                    title: 'Video URL + Thumb URL - ' + Date.now(),
                    description: 'Testing video URL with thumbnail URL',
                    tags: ['test', 'multi-platform']
                },
                tiktok: {
                    caption: 'Multi-platform test',
                    privacy_level: 'SELF_ONLY',
                    disable_duet: false,
                    disable_stitch: false,
                    disable_comment: false
                }
            });

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
            createdResources.tasks.push(result);
        });
    });

    describe('CREATE - publishShortVideo with Repost URLs', () => {
        it('should repost from Facebook Reel URL', async () => {
            if (!workspaceId) {
                console.warn('Skipping: No workspace ID available');
                return;
            }

            const result = await client.publishShortVideo({
                workspaceId: workspaceId,
                video: facebookReelURL,
                platforms: ['youtube'],
                youtube: {
                    title: 'Reposted from Facebook - ' + Date.now(),
                    description: 'Testing Facebook repost',
                    tags: ['repost', 'facebook']
                }
            });

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
            createdResources.tasks.push(result);
        });

        it('should repost from YouTube Shorts URL', async () => {
            if (!workspaceId) {
                console.warn('Skipping: No workspace ID available');
                return;
            }

            const result = await client.publishShortVideo({
                workspaceId: workspaceId,
                video: youtubeShortsURL,
                platforms: ['tiktok'],
                tiktok: {
                    caption: 'Reposted from YouTube Shorts',
                    privacy_level: 'SELF_ONLY',
                    disable_duet: false,
                    disable_stitch: false,
                    disable_comment: false
                }
            });

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
            createdResources.tasks.push(result);
        });

        it('should repost from TikTok Video URL', async () => {
            if (!workspaceId) {
                console.warn('Skipping: No workspace ID available');
                return;
            }

            const result = await client.publishShortVideo({
                workspaceId: workspaceId,
                video: tikTokVideoURL,
                platforms: ['youtube'],
                youtube: {
                    title: 'Reposted from TikTok - ' + Date.now(),
                    description: 'Testing TikTok repost',
                    tags: ['repost', 'tiktok']
                }
            });

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
            createdResources.tasks.push(result);
        });
    });

    describe('UTILITY METHODS', () => {
        it('should get default settings', async () => {
            const result = await client.getDefaultSettings();

            expect(result).toBeDefined();
            // Default settings should contain configuration data
        });

        it('should get task status', async () => {
            if (!createdId) {
                console.warn('Skipping: No task created');
                return;
            }

            const result = await client.getStatus(createdId);

            expect(result).toBeDefined();
        });

        it('should get next and previous task IDs', async () => {
            if (!createdId) {
                console.warn('Skipping: No task created');
                return;
            }

            const result = await client.getNextAndPrevious(createdId);

            expect(result).toBeDefined();
            // Result may have nextId and/or previousId
        });
    });

    describe('GET LIST', () => {
        it('should get list of tasks', async () => {
            const result = await client.list({}, {
                page: 1,
                pageSize: 10,
            });

            expect(result.items).toBeInstanceOf(Array);
            expect(result.pagination.totalCount).toBeGreaterThanOrEqual(0);
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
                pageSize: 10,
            });

            expect(result.items).toBeInstanceOf(Array);
        });

        it('should filter by status', async () => {
            const result = await client.list({
                currentStatus: 'pending',
            }, {
                page: 1,
                pageSize: 10,
            });

            expect(result.items).toBeInstanceOf(Array);
        });
    });
});
