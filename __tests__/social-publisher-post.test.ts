import { HttpClient } from "@posty5/core";
import { SocialPublisherPostClient } from "@posty5/social-publisher-post";
import { TEST_CONFIG, createdResources } from "./setup";
import * as fs from "fs";
import * as path from "path";
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
describe("Social Publisher Post SDK", () => {
  let httpClient: HttpClient;
  let client!: SocialPublisherPostClient;
  let createdId: string;
  let workspaceId: string;
  let youtubeAccountId: string;
  let tiktokAccountId: string;
  let thumbnailURL = "https://images.unsplash.com/3/GoWildImages_MtEverest_NEP0555.jpg";
  let videoURL = "https://www.w3schools.com/tags/mov_bbb.mp4";
  let thumbnail = "https://images.unsplash.com/photo-1506744038136-46273834b3fb";
  beforeAll(async () => {
    httpClient = new HttpClient({
      apiKey: TEST_CONFIG.apiKey,
      baseUrl: TEST_CONFIG.baseUrl,
      debug: true,
    });
    client = new SocialPublisherPostClient(httpClient);

    workspaceId = "69922068aa6ee6fa8eb8f9c2";
    youtubeAccountId = "69921cc7aa6ee6fa8eb8f8a9";
    tiktokAccountId = "69921c96aa6ee6fa8eb8f88f";
  });

  describe("CREATE - publishShortVideoToWorkspace with Video File", () => {
    it("should publish video file with thumbnail URL", async () => {
      if (!workspaceId) {
        console.warn("Skipping: No workspace ID available");
        return;
      }

      const videoFile = getVideo();

      const result = await client.publishShortVideoToWorkspace({
        workspaceId: workspaceId,
        video: videoFile,
        thumbnail: thumbnailURL,
        youtube: {
          title: "Video File + Thumb URL - " + Date.now(),
          description: "Testing video file with thumbnail URL",
          tags: ["test", "sdk"],
        },
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
      createdId = result;
      createdResources.posts.push(createdId);
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
    //     createdResources.posts.push(result);
    // });
  });

  describe("CREATE - publishShortVideoToWorkspace with Video URL", () => {
    it("should publish video URL with thumbnail file", async () => {
      if (!workspaceId) {
        console.warn("Skipping: No workspace ID available");
        return;
      }
      const thumbFile = getThumb();
      const result = await client.publishShortVideoToWorkspace({
        workspaceId: workspaceId,
        video: videoURL,
        thumbnail: thumbFile,
        youtube: {
          title: "Video URL + Thumb File - " + Date.now(),
          description: "Testing video URL with thumbnail file",
          tags: ["test", "url"],
        },
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
      createdResources.posts.push(result);
    });

    it("should publish video URL with thumbnail URL", async () => {
      if (!workspaceId) {
        console.warn("Skipping: No workspace ID available");
        return;
      }

      const result = await client.publishShortVideoToWorkspace({
        workspaceId: workspaceId,
        video: videoURL,
        thumbnail: thumbnailURL,
        youtube: {
          title: "Video URL + Thumb URL - " + Date.now(),
          description: "Testing video URL with thumbnail URL",
          tags: ["test", "multi-platform"],
        },
        tiktok: {
          caption: "Multi-platform test",
          privacy_level: "SELF_ONLY",
          disable_duet: false,
          disable_stitch: false,
          disable_comment: false,
        },
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
      createdResources.posts.push(result);
    });
  });

  describe("CREATE - publishShortVideoToAccount", () => {
    it("should publish video file to account", async () => {
      if (!tiktokAccountId) {
        console.warn("Skipping: No account ID available");
        return;
      }

      const videoFile = getVideo();
      const thumbFile = getThumb();

      const result = await client.publishShortVideoToAccount({
        accountId: tiktokAccountId,
        video: videoFile,
        thumbnail: thumbFile,
        tiktok: {
          caption: "Account Video File - " + Date.now(),
          privacy_level: "SELF_ONLY",
          disable_duet: false,
          disable_stitch: false,
          disable_comment: false,
        },
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
      createdResources.posts.push(result);
    });

    it("should publish video URL to account", async () => {
      if (!youtubeAccountId) {
        console.warn("Skipping: No account ID available");
        return;
      }

      const result = await client.publishShortVideoToAccount({
        accountId: youtubeAccountId,
        video: videoURL,
        thumbnail: thumbnailURL,
        youtube: {
          title: "Account Video URL - " + Date.now(),
          description: "Testing account publishing via URL",
          tags: ["test", "account"],
        },
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
      createdResources.posts.push(result);
    });

  });

  describe("UTILITY METHODS", () => {
    it("should get default settings", async () => {
      const result = await client.getDefaultSettings();

      expect(result).toBeDefined();
      // Default settings should contain configuration data
    });

    it("should get post status", async () => {
      if (!createdId) {
        console.warn("Skipping: No post created");
        return;
      }

      const result = await client.getStatus(createdId);

      expect(result).toBeDefined();
    });

    it("should get next and previous post IDs", async () => {
      if (!createdId) {
        console.warn("Skipping: No post created");
        return;
      }

      const result = await client.getNextAndPrevious(createdId);

      expect(result).toBeDefined();
      // Result may have nextId and/or previousId
    });
  });

  describe("GET LIST", () => {
    it("should get list of posts", async () => {
      const result = await client.list(
        {},
        {
          page: 1,
          pageSize: 10,
        },
      );

      expect(result.items).toBeInstanceOf(Array);
      expect(result.pagination.totalCount).toBeGreaterThanOrEqual(0);
    });

    it("should filter by workspace", async () => {
      if (!workspaceId) {
        console.warn("Skipping: No workspace ID available");
        return;
      }

      const result = await client.list(
        {
          workspaceId: workspaceId,
        },
        {
          page: 1,
          pageSize: 10,
        },
      );

      expect(result.items).toBeInstanceOf(Array);
    });

    it("should filter by status", async () => {
      const result = await client.list(
        {
          currentStatus: "pending",
        },
        {
          page: 1,
          pageSize: 10,
        },
      );

      expect(result.items).toBeInstanceOf(Array);
    });
  });
});
