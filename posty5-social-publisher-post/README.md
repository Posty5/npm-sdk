# @posty5/social-publisher-post

Official Posty5 SDK for managing social media publishing posts. Prepare creator-owned videos for YouTube Shorts, TikTok, Facebook Reels, and Instagram Reels with a unified, developer-friendly API.

---

## ðŸŒŸ What is Posty5?

**Posty5** is a comprehensive suite of free online tools designed to enhance your digital marketing and social media presence. With over 4+ powerful tools and counting, Posty5 provides everything you need to:

- ðŸ”— **Shorten URLs** - Create memorable, trackable short links
- ðŸ“± **Generate QR Codes** - Transform URLs, WiFi credentials, contact cards, and more into scannable codes
- ðŸŒ **Host HTML Pages** - Deploy static HTML pages with dynamic variables and form submission handling
- ðŸ“¢ **Social Publishing** - Prepare and manage creator-controlled social media posts across connected platforms
- ðŸ“Š **Track Performance** - Monitor and analyze your digital marketing efforts

Posty5 empowers businesses, marketers, and developers to streamline their online workflowsâ€”all from a unified control panel.

**Learn more:** [https://posty5.com](https://posty5.com)

---

## ðŸ“¦ About This Package

`@posty5/social-publisher-post` is the **post management client** for the Posty5 Social Media Publisher. Use it with videos you created or have the rights to publish. TikTok Direct Post requires the creator-controlled Posty5 review flow before submission.

### What are Social Publisher Posts?

Posts represent video publishing jobs for connected YouTube, TikTok, Facebook, and Instagram accounts. Each post handles video upload, platform-specific configuration, scheduling, and status tracking.

### Key Capabilities

- **Multi-Platform Preparation** - Prepare posts for connected YouTube, TikTok, Facebook, and Instagram accounts
- **Authorized Video Sources** - Upload files or provide direct video file URLs for content you created or have rights to publish
- **Smart Thumbnail Handling** - Upload files or provide URLs for thumbnail images
- **Platform-Specific Configuration** - Customize titles, descriptions, captions, tags, and privacy settings per platform
- **Schedule Publishing** - Publish immediately or schedule for optimal engagement times
- **TikTok Direct Post Review** - TikTok publishing requires manual privacy selection, disclosure options when needed, and explicit creator confirmation in Posty5
- **Post Status Tracking** - Monitor publishing progress and platform-specific status
- **Tag & Reference System** - Organize posts using custom tags and reference IDs
- **Pagination & Filtering** - Search posts by workspace, status, tag, or reference ID

### Why Use This Package?

- **Time Saving**: Prepare platform-specific settings from one integration while keeping TikTok publishing creator-controlled
- **Reviewed Workflow**: Integrate publishing status and configuration while preserving the Posty5 TikTok review and confirmation flow
- **Rights-Aware Publishing**: Use original videos or content you have permission to publish
- **Consistent Branding**: Apply platform-optimized metadata while maintaining brand voice
- **Progress Tracking**: Monitor post status and handle errors programmatically

### Supported Platforms

| Platform  | Content Type | Custom Thumbnails | Max File Size |
| --------- | ------------ | ----------------- | ------------- |
| YouTube   | Shorts       | âœ… Yes            | 2 GB          |
| TikTok    | Videos       | âŒ No             | 2 GB          |
| Facebook  | Reels        | âŒ No             | 2 GB          |
| Instagram | Reels        | âŒ No             | 2 GB          |

---

## ðŸ“¥ Installation

Install via npm:

```bash
npm install @posty5/social-publisher-post @posty5/core
```

---

## ðŸš€ Quick Start

```typescript
import { HttpClient } from "@posty5/core";
import { SocialPublisherPostClient } from "@posty5/social-publisher-post";

// Initialize the HTTP client with your API key
const httpClient = new HttpClient({
  apiKey: "your-api-key", // Get from studio.posty5.com/account/settings?tab=APIKeys
  debug: true, // Optional: Enable debug logging
});

// Create post client
const client = new SocialPublisherPostClient(httpClient);

// Publish video to YouTube Shorts
const postId = await client.publishShortVideo({
  workspaceId: "workspace-123", // Your workspace ID
  video: videoFile, // File object or URL string
  thumbnail: thumbFile, // Optional: File or URL
  youtube: {
    title: "My First YouTube Short",
    description: "Published using Posty5 SDK",
    tags: ["shorts", "video", "tutorial"],
  },
});

console.log("Post created:", postId);

// Check post status
const status = await client.getStatus(postId);
console.log("Publishing status:", status.currentStatus);
console.log("YouTube:", status.youtube?.postInfo.currentStatus);
```

---

## ðŸ“š API Reference & Examples

### publishShortVideo()

Publish a short video to one or more connected social media accounts. Use file uploads or direct video file URLs for content you created or have the rights to publish. TikTok Direct Post must go through the Posty5 creator review and confirmation flow.

**Parameters:**

- `options` (IPublishOptions): Publishing configuration
  - `workspaceId` (string, required): Workspace ID containing connected social accounts
  - `video` (File | string, required): Video source - File object or direct video file URL only.
  - `thumbnail` (File | string, optional): Thumbnail image - File object or URL string
  - `youtube` (IYouTubeConfig, optional): YouTube configuration — **required** if the workspace has a YouTube account connected
  - `tiktok` (ITikTokConfig, optional): TikTok configuration — **required** if the workspace has a TikTok account connected
  - `facebook` (IFacebookPageConfig, optional): Facebook configuration — **required** if the workspace has a Facebook Page connected
  - `instagram` (IInstagramConfig, optional): Instagram configuration — **required** if the workspace has an Instagram account connected
  - `schedule` ('now' | Date, optional): Publish immediately (default) or schedule for specific date/time
  - `tag` (string, optional): Custom tag for filtering
  - `refId` (string, optional): Your internal reference ID

> **Where publish targets come from.** The workspace's connected accounts are
> the single source of truth — connect / disconnect accounts on the workspace
> page in the Posty5 dashboard to choose which platforms a post lands on. The
> SDK forwards whichever config blocks you supply; the server matches them
> against the workspace.

**Returns:** `Promise<string>` - Created post ID

**Example - Upload Video File:**

```typescript
import * as fs from "fs";

// Read video and thumbnail files
const videoFile = fs.readFileSync("./video.mp4");
const thumbFile = fs.readFileSync("./thumbnail.jpg");

// Create File objects
const video = new File([videoFile], "video.mp4", { type: "video/mp4" });
const thumbnail = new File([thumbFile], "thumb.jpg", { type: "image/jpeg" });

// Publish to YouTube only
const postId = await client.publishShortVideo({
  workspaceId: "workspace-123",
  video: video,
  thumbnail: thumbnail,
  youtube: {
    title: "Product Launch Video",
    description: "Introducing our new product line for 2024",
    tags: ["product", "launch", "2024"],
    madeForKids: false,
  },
  tag: "product-launch", // Custom tag for filtering
  refId: "PROD-LAUNCH-001", // Your internal reference
});

console.log("Published to YouTube:", postId);
```

**Example - Video URL with Thumbnail URL:**

```typescript
// Publish using URLs (no file upload needed)
const postId = await client.publishShortVideo({
  workspaceId: "workspace-123",
  video: "https://cdn.example.com/videos/promo.mp4", // Direct video URL
  thumbnail: "https://cdn.example.com/images/thumb.jpg", // Direct thumbnail URL
  youtube: {
    title: "Summer Sale Announcement",
    description: "Check out our summer collection",
    tags: ["sale", "summer", "fashion"],
  },
  tiktok: {
    caption: "Summer sale is here! ðŸ”¥ #SummerSale #Fashion",
    privacy_level: "public",
    disable_duet: false,
    disable_stitch: false,
    disable_comment: false,
  },
});

console.log("Published to YouTube and TikTok:", postId);
```

**Example - Auto-Comment After Publish (Pro plan, +1 credit):**

```typescript
// Publish a video and queue a comment for each platform.
// TikTok comments are not supported â€” the platform will always
// report `commentInfo.currentStatus === "notSupported"`.
const postId = await client.publishShortVideo({
  workspaceId: "workspace-123",
  video: videoFile,
  youtube: { title: "Launch day", description: "We shipped!", tags: ["launch"] },
  facebook: { description: "We shipped!" },
  instagram: { description: "We shipped! ðŸš€" },
  comment: {
    text: "Drop your favourite feature below ðŸ‘‡",
    postToFacebook: true,
    postToInstagram: true,
    postToYoutube: true,
    // postToTiktok defaults to false â€” TikTok does not support API comments
  },
});

// Later, poll status to see how each comment landed:
const status = await client.getStatus(postId);
console.log("YouTube comment:", status.youtube?.commentInfo?.currentStatus);
console.log("Facebook comment URL:", status.facebook?.commentInfo?.commentURL);
console.log("TikTok comment:", status.tiktok?.commentInfo?.currentStatus); // "notSupported"
```

**Example - Multi-Platform Publishing:**

```typescript
// Publish to all 4 platforms simultaneously
const postId = await client.publishShortVideo({
  workspaceId: "workspace-123",
  video: videoFile,
  thumbnail: thumbFile,

  // YouTube configuration
  youtube: {
    title: "How to Use Our Product",
    description: "Step-by-step tutorial for beginners",
    tags: ["tutorial", "howto", "guide"],
  },

  // TikTok configuration
  tiktok: {
    caption: "Easy tutorial! Try it yourself ðŸŽ¯ #Tutorial #LearnTikTok",
    privacy_level: "public",
    disable_duet: false,
    disable_stitch: false,
    disable_comment: false,
  },

  // Facebook configuration
  facebook: {
    title: "Product Tutorial",
    description: "Learn how to use our product in under 60 seconds",
  },

  // Instagram configuration
  instagram: {
    description: "Quick product tutorial ðŸ“± #ProductTutorial",
    share_to_feed: true,
  },
});

console.log("Published to all platforms:", postId);
```

> **TikTok Direct Post note:** This SDK supports file uploads and direct video file URLs only. TikTok publishing in Posty5 is creator-controlled: the connected account owner reviews the video, confirms the TikTok nickname, edits caption text, manually selects privacy and interaction settings, completes disclosure options when required, and explicitly confirms publishing before submission.

**Example - Scheduled Publishing:**

```typescript
// Schedule video for future publication
const publishDate = new Date("2024-12-25T12:00:00Z"); // Christmas at noon

const postId = await client.publishShortVideo({
  workspaceId: "workspace-123",
  video: videoFile,
  schedule: publishDate, // Schedule for specific date/time
  youtube: {
    title: "Merry Christmas! ðŸŽ„",
    description: "Holiday greetings from our team",
    tags: ["christmas", "holiday", "greetings"],
  },
  tiktok: {
    caption: "Merry Christmas everyone! ðŸŽ…ðŸŽ„ #Christmas",
    privacy_level: "public",
    disable_duet: false,
    disable_stitch: false,
    disable_comment: false,
  },
});

console.log("Scheduled for", publishDate, "- Post ID:", postId);
```

---

### list()

Search and retrieve publishing posts with pagination and filtering options.

**Parameters:**

- `params` (IListParams, optional): Search and filter options
  - `workspaceId` (string, optional): Filter by workspace ID
  - `currentStatus` (string, optional): Filter by post status ('pending', 'processing', 'done', 'error', etc.)
  - `tag` (string, optional): Filter by custom tag
  - `refId` (string, optional): Filter by reference ID
- `pagination` (IPaginationParams, optional): Pagination settings
  - `page` (number): Page number (default: 1)
  - `pageSize` (number): Items per page (default: 10)

**Returns:** `Promise<ISearchSocialPublisherPostResponse>` - Paginated post list

**Response Structure:**

```typescript
{
  items: Array<{
    _id: string; // Post ID
    numbering: string; // Post number (e.g., "T-12345")
    caption: string; // Post caption/title
    createdAt: Date; // Creation timestamp
    currentStatus: string; // Overall post status
    isAllowYoutube: boolean; // YouTube enabled
    isAllowFacebookPage: boolean; // Facebook enabled
    isAllowInstagram: boolean; // Instagram enabled
    isAllowTiktok: boolean; // TikTok enabled
    workspaceName: string; // Workspace name
    scheduleType: "schedule" | "now"; // Schedule type
    scheduleScheduledAt: Date | null; // Scheduled date
    scheduleExecutedAt: Date | null; // Execution date
    refId: string; // Reference ID
    tag: string; // Custom tag
    apiKeyName: string; // API key name
  }>;
  pagination: {
    page: number; // Current page
    pageSize: number; // Items per page
    totalCount: number; // Total posts
    totalPages: number; // Total pages
  }
}
```

**Example:**

```typescript
// Get all posts with pagination
const posts = await client.list(
  {},
  {
    page: 1,
    pageSize: 20,
  },
);

console.log(`Total posts: ${posts.pagination.totalCount}`);
console.log(`Showing page ${posts.pagination.page} of ${posts.pagination.totalPages}`);

// Display posts
posts.items.forEach((post) => {
  console.log(`${post.numbering}: ${post.caption}`);
  console.log(`  Status: ${post.currentStatus}`);
  console.log(
    `  Platforms: ${[post.isAllowYoutube && "YouTube", post.isAllowTiktok && "TikTok", post.isAllowFacebookPage && "Facebook", post.isAllowInstagram && "Instagram"].filter(Boolean).join(", ")}`,
  );
});

// Filter by workspace
const workspacePosts = await client.list(
  {
    workspaceId: "workspace-123",
  },
  {
    page: 1,
    pageSize: 50,
  },
);

console.log(`Workspace has ${workspacePosts.items.length} posts`);

// Filter by status
const pendingPosts = await client.list(
  {
    currentStatus: "pending",
  },
  {
    page: 1,
    pageSize: 10,
  },
);

console.log(`Pending posts: ${pendingPosts.pagination.totalCount}`);

// Filter by tag
const campaignPosts = await client.list(
  {
    tag: "summer-campaign",
  },
  {
    page: 1,
    pageSize: 100,
  },
);

console.log(`Campaign posts: ${campaignPosts.items.length}`);

// Filter by reference ID
const specificPost = await client.list(
  {
    refId: "PROD-001",
  },
  {
    page: 1,
    pageSize: 1,
  },
);

if (specificPost.items.length > 0) {
  console.log("Found post:", specificPost.items[0].caption);
}
```

---

### getStatus()

Retrieve detailed status information for a specific publishing post, including platform-specific progress and post URLs.

**Parameters:**

- `id` (string): Post ID

**Returns:** `Promise<ISocialPublisherPostStatusResponse>` - Detailed post status

**Response Structure:**

```typescript
{
  _id: string;                       // Post ID
  numbering: string;                 // Post number
  caption: string;                   // Post caption
  currentStatus: string;             // Overall status
  createdAt: Date;                   // Creation time
  startedAt: Date;                   // Start time

  // Platform-specific details
  youtube?: {
    tags: string[];
    postInfo: {
      isAllow: boolean;              // Platform enabled
      currentStatus: string;         // Platform status
      videoURL: string;              // Published video URL
      socialPublisherAccount: {      // Account details
        name: string;
        thumbnail: string;
        platformAccountId: string;
      };
    };
  };

  tiktok?: { /* Similar structure */ };
  facebook?: { /* Similar structure */ };
  instagram?: { /* Similar structure */ };

  // Workspace info
  workspace: {
    _id: string;
    name: string;
    description: string;
  };

  // Schedule info
  schedule: {
    type: 'schedule' | 'now';
    scheduledAt: Date;
    executedAt: Date;
  };
}
```

**Example:**

```typescript
// Get post status
const status = await client.getStatus("post-id-here");

console.log("Post:", status.numbering);
console.log("Overall Status:", status.currentStatus);
console.log("Created:", status.createdAt);

// Check YouTube status
if (status.youtube) {
  console.log("\nYouTube:");
  console.log("  Status:", status.youtube.postInfo.currentStatus);
  console.log("  Channel:", status.youtube.postInfo.socialPublisherAccount.name);

  if (status.youtube.postInfo.videoURL) {
    console.log("  Video URL:", status.youtube.postInfo.videoURL);
  }
}

// Check TikTok status
if (status.tiktok) {
  console.log("\nTikTok:");
  console.log("  Status:", status.tiktok.postInfo.currentStatus);
  console.log("  Account:", status.tiktok.postInfo.socialPublisherAccount.name);

  if (status.tiktok.postInfo.videoURL) {
    console.log("  Video URL:", status.tiktok.postInfo.videoURL);
  }
}

// Check Facebook status
if (status.facebook) {
  console.log("\nFacebook:");
  console.log("  Status:", status.facebook.postInfo.currentStatus);
  console.log("  Page:", status.facebook.postInfo.socialPublisherAccount.name);
}

// Check Instagram status
if (status.instagram) {
  console.log("\nInstagram:");
  console.log("  Status:", status.instagram.postInfo.currentStatus);
  console.log("  Account:", status.instagram.postInfo.socialPublisherAccount.name);
}

// Handle errors
if (status.currentStatus === "error") {
  console.error("Post failed!");

  // Check which platforms failed
  const failures = [];
  if (status.youtube?.postInfo.currentStatus === "error") failures.push("YouTube");
  if (status.tiktok?.postInfo.currentStatus === "error") failures.push("TikTok");
  if (status.facebook?.postInfo.currentStatus === "error") failures.push("Facebook");
  if (status.instagram?.postInfo.currentStatus === "error") failures.push("Instagram");

  console.error("Failed platforms:", failures.join(", "));
}

// Monitor post progress
async function waitForCompletion(postId: string, maxWaitMs = 300000) {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const status = await client.getStatus(postId);

    console.log(`Status: ${status.currentStatus}`);

    if (status.currentStatus === "done") {
      console.log("âœ“ Publishing complete!");
      return status;
    }

    if (status.currentStatus === "error") {
      throw new Error("Publishing failed");
    }

    // Wait 5 seconds before checking again
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  throw new Error("Timeout waiting for post completion");
}

const finalStatus = await waitForCompletion("post-id");
console.log("All platforms published successfully");
```

---

### getDefaultSettings()

Retrieve default configuration settings for social media publishing, including platform limits and default values.

**Parameters:** None

**Returns:** `Promise<IDefaultSettingsResponse>` - Default settings configuration

**Example:**

```typescript
// Get default settings
const settings = await client.getDefaultSettings();

console.log("Default Settings:", settings);

// Use defaults in your application
console.log("Max video size:", client.maxVideoUploadSizeBytes, "bytes");
console.log("Max thumbnail size:", client.maxImageUploadSizeBytes, "bytes");
```

---

### getNextAndPrevious()

Get the IDs of the next and previous posts for navigation purposes.

**Parameters:**

- `id` (string): Current post ID

**Returns:** `Promise<ISocialPublisherPostNextPreviousResponse>` - Next and previous post IDs

**Response Structure:**

```typescript
{
  nextId?: string;     // Next post ID (if exists)
  previousId?: string; // Previous post ID (if exists)
}
```

**Example:**

```typescript
// Get navigation IDs
const navigation = await client.getNextAndPrevious("current-post-id");

if (navigation.nextId) {
  console.log("Next post:", navigation.nextId);

  // Navigate to next post
  const nextPost = await client.getStatus(navigation.nextId);
  console.log("Next post caption:", nextPost.caption);
}

if (navigation.previousId) {
  console.log("Previous post:", navigation.previousId);

  // Navigate to previous post
  const prevPost = await client.getStatus(navigation.previousId);
  console.log("Previous post caption:", prevPost.caption);
}

// Build post navigation
async function navigateForward(startPostId: string, count: number) {
  const posts = [];
  let currentId = startPostId;

  for (let i = 0; i < count; i++) {
    const status = await client.getStatus(currentId);
    posts.push(status);

    const nav = await client.getNextAndPrevious(currentId);
    if (!nav.nextId) break;

    currentId = nav.nextId;
  }

  return posts;
}

const next5Posts = await navigateForward("post-id", 5);
console.log(`Retrieved ${next5Posts.length} posts`);
```

---

## ðŸ”„ Complete Workflow Example

```typescript
import { HttpClient } from "@posty5/core";
import { SocialPublisherPostClient } from "@posty5/social-publisher-post";
import * as fs from "fs";

// Initialize client
const httpClient = new HttpClient({
  apiKey: process.env.POSTY5_API_KEY!,
  debug: false,
});

const client = new SocialPublisherPostClient(httpClient);

async function publishVideoWorkflow() {
  try {
    // 1. Prepare video and thumbnail
    console.log("Preparing media files...");
    const videoBuffer = fs.readFileSync("./content/video.mp4");
    const thumbBuffer = fs.readFileSync("./content/thumbnail.jpg");

    const video = new File([videoBuffer], "video.mp4", { type: "video/mp4" });
    const thumbnail = new File([thumbBuffer], "thumb.jpg", { type: "image/jpeg" });

    // 2. Publish to multiple platforms
    console.log("Publishing video...");
    const postId = await client.publishShortVideo({
      workspaceId: "workspace-123",
      video: video,
      thumbnail: thumbnail,
      youtube: {
        title: "Product Demo 2024",
        description: "Check out our latest product features",
        tags: ["product", "demo", "2024"],
      },
      tiktok: {
        caption: "New product alert! ðŸš€ #Product #Tech",
        privacy_level: "public",
        disable_duet: false,
        disable_stitch: false,
        disable_comment: false,
      },
      tag: "product-demo",
      refId: "DEMO-2024-001",
    });

    console.log("âœ“ Post created:", postId);

    // 3. Monitor publishing progress
    console.log("\nMonitoring progress...");
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes (5 second intervals)

    while (attempts < maxAttempts) {
      const status = await client.getStatus(postId);

      console.log(`  Status: ${status.currentStatus}`);

      // Check individual platforms
      if (status.youtube) {
        console.log(`  YouTube: ${status.youtube.postInfo.currentStatus}`);
      }
      if (status.tiktok) {
        console.log(`  TikTok: ${status.tiktok.postInfo.currentStatus}`);
      }

      // Check if completed
      if (status.currentStatus === "done") {
        console.log("\nâœ“ Publishing complete!");

        // Get video URLs
        if (status.youtube?.postInfo.videoURL) {
          console.log("  YouTube URL:", status.youtube.postInfo.videoURL);
        }
        if (status.tiktok?.postInfo.videoURL) {
          console.log("  TikTok URL:", status.tiktok.postInfo.videoURL);
        }

        return status;
      }

      // Check for errors
      if (status.currentStatus === "error") {
        console.error("\nâœ— Publishing failed");
        throw new Error("Post failed");
      }

      // Wait before checking again
      await new Promise((resolve) => setTimeout(resolve, 5000));
      attempts++;
    }

    throw new Error("Timeout: Post did not complete within 5 minutes");
  } catch (error) {
    console.error("Error:", error.message);
    throw error;
  }
}

// Run the workflow
publishVideoWorkflow()
  .then(() => console.log("\nWorkflow completed successfully"))
  .catch((err) => console.error("\nWorkflow failed:", err));
```

---

## ðŸ“˜ TypeScript Support

Full TypeScript support with exported interfaces:

```typescript
import {
  // Client
  SocialPublisherPostClient,

  // Publishing options
  IPublishOptions,

  // Platform configurations
  IYouTubeConfig,
  ITikTokConfig,
  IFacebookPageConfig,
  IInstagramConfig,

  // Schedule configuration
  IScheduleConfig,

  // Optional post-publish comment (Pro plan, +1 credit)
  ICommentRequest,
  ICommentInfoDTO,
  CommentStatusType, // 'pending' | 'processing' | 'done' | 'error' | 'skipped' | 'notSupported'

  // Search parameters
  IListParams,

  // Response interfaces
  ISocialPublisherPostStatusResponse,
  ISearchSocialPublisherPostResponse,
  ISocialPublisherPostNextPreviousResponse,
  IDefaultSettingsResponse,

  // Response types
  ISocialPublisherPostResponse,
  ISocialPublisherWorkspace,
  ISocialPublisherAccount,

  // Status types
  SocialPublisherPostStatusType, // 'pending' | 'processing' | 'done' | 'error' | ...
  SocialPublisherPostSourceType, // 'video-file' | 'video-url'
  SocialPublisherAccountStatusType, // 'active' | 'inactive' | 'authenticationExpired'
} from "@posty5/social-publisher-post";
```

### Platform Configuration Types

**YouTube Configuration:**

```typescript
interface IYouTubeConfig {
  title: string; // Video title (required)
  description: string; // Video description (required)
  tags: string[]; // Video tags (required)
  madeForKids?: boolean; // Mark as made for kids (optional)
  defaultLanguage?: string; // Default language code (optional)
  defaultAudioLanguage?: string; // Audio language code (optional)
  categoryId?: string; // YouTube category ID (optional)
  localizationLanguages?: string[]; // Localization languages (optional)
}
```

**TikTok Configuration:**

```typescript
interface ITikTokConfig {
  caption: string; // Video caption (required)
  privacy_level: string; // 'public' | 'SELF_ONLY' | 'MUTUAL_FOLLOW_FRIENDS' (required)
  disable_duet: boolean; // Disable duet feature (required)
  disable_stitch: boolean; // Disable stitch feature (required)
  disable_comment: boolean; // Disable comments (required)
}
```

**Facebook Configuration:**

```typescript
interface IFacebookPageConfig {
  description: string; // Post description (required)
  title?: string; // Post title (optional)
}
```

**Instagram Configuration:**

```typescript
interface IInstagramConfig {
  description: string; // Post description (required)
  share_to_feed?: boolean; // Share to feed (optional)
  is_published_to_both_feed_and_story?: boolean; // Publish to both (optional)
}
```

---

## ðŸ“¦ Related Packages

This SDK ecosystem contains the following tool packages:

| Package | Description | Version | GitHub | NPM |
| --- | --- | --- | --- | --- |
| @posty5/short-link | URL shortener client | 1.0.2 | [ðŸ“– Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-short-link) | [ðŸ“¦ NPM](https://www.npmjs.com/package/@posty5/short-link) |
| @posty5/qr-code | QR code generator client | 1.0.2 | [ðŸ“– Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-qr-code) | [ðŸ“¦ NPM](https://www.npmjs.com/package/@posty5/qr-code) |
| @posty5/html-hosting | HTML hosting client | 1.0.2 | [ðŸ“– Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-html-hosting) | [ðŸ“¦ NPM](https://www.npmjs.com/package/@posty5/html-hosting) |
| @posty5/html-hosting-variables | HTML hosting variables client | 1.0.2 | [ðŸ“– Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-html-hosting-variables) | [ðŸ“¦ NPM](https://www.npmjs.com/package/@posty5/html-hosting-variables) |
| @posty5/html-hosting-form-submission | Form submission client | 1.0.2 | [ðŸ“– Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-html-hosting-form-submission) | [ðŸ“¦ NPM](https://www.npmjs.com/package/@posty5/html-hosting-form-submission) |
| @posty5/social-publisher-workspace | Social publisher workspace client | 1.0.2 | [ðŸ“– Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-social-publisher-workspace) | [ðŸ“¦ NPM](https://www.npmjs.com/package/@posty5/social-publisher-workspace) |
| @posty5/social-publisher-post | Social publisher post client | 1.0.2 | [ðŸ“– Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-social-publisher-post) | [ðŸ“¦ NPM](https://www.npmjs.com/package/@posty5/social-publisher-post) |

---

## ðŸ’» Node.js Compatibility

- **Node.js**: >= 16.0.0
- **Module Systems**: ESM and CommonJS
- **TypeScript**: Full type definitions included

---

## ðŸ†˜ Support

We're here to help you succeed with Posty5!

### Get Help

- **Documentation**: [https://guide.posty5.com](https://guide.posty5.com)
- **Contact Us**: [https://posty5.com/contact-us](https://posty5.com/contact-us)
- **GitHub Issues**: [Report bugs or request features](https://github.com/Posty5/npm-sdk/issues)
- **API Status**: Check API status and uptime at [https://status.posty5.com](https://status.posty5.com)

### Common Issues

1. **Authentication Errors**
   - Ensure your API key is valid and active
   - Get your API key from [studio.posty5.com/account/settings?tab=APIKeys](studio.posty5.com/account/settings?tab=APIKeys)

2. **Network Errors**
   - Check your internet connection
   - Verify firewall settings allow connections to `api.posty5.com`

3. **Rate Limiting**
   - The SDK includes automatic retry logic
   - Check your API plan limits in the dashboard

---

## ðŸ“„ License

MIT License - see [LICENSE](./LICENSE) file for details.

---

## ðŸ”— Useful Links

- **Website**: [https://posty5.com](https://posty5.com)
- **Dashboard**: [studio.posty5.com/account/settings?tab=APIKeys](studio.posty5.com/account/settings?tab=APIKeys)
- **API Documentation**: [https://docs.posty5.com](https://docs.posty5.com)
- **GitHub**: [https://github.com/Posty5/npm-sdk](https://github.com/Posty5/npm-sdk)

---

Made with â¤ï¸ by the Posty5 team
