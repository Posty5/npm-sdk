# @posty5/social-publisher-task

Official Posty5 SDK for managing social media publishing tasks. Publish videos to YouTube Shorts, TikTok, Facebook Reels, and Instagram Reels with a unified, developer-friendly API.

---

## 🌟 What is Posty5?

**Posty5** is a comprehensive suite of free online tools designed to enhance your digital marketing and social media presence. With over 4+ powerful tools and counting, Posty5 provides everything you need to:

- 🔗 **Shorten URLs** - Create memorable, trackable short links
- 📱 **Generate QR Codes** - Transform URLs, WiFi credentials, contact cards, and more into scannable codes
- 🌐 **Host HTML Pages** - Deploy static HTML pages with dynamic variables and form submission handling
- 📢 **Automate Social Media** - Schedule and manage social media posts across multiple platforms
- 📊 **Track Performance** - Monitor and analyze your digital marketing efforts

Posty5 empowers businesses, marketers, and developers to streamline their online workflows—all from a unified control panel.

**Learn more:** [https://posty5.com](https://posty5.com)

---

## 📦 About This Package

`@posty5/social-publisher-task` is the **task management client** for the Posty5 Social Media Publisher. This package enables you to programmatically publish short-form videos to multiple social media platforms simultaneously from a single API call.

### What are Social Publisher Tasks?

Tasks represent video publishing jobs that distribute your content across YouTube Shorts, TikTok, Facebook Reels, and Instagram Reels. Each task handles the entire publishing workflow: video upload, platform-specific configuration, scheduling, and status tracking.

### Key Capabilities

- **Multi-Platform Publishing** - Publish to YouTube, TikTok, Facebook, and Instagram in one API call
- **Flexible Video Sources** - Upload files, provide URLs, or repost from other platforms (auto-detected)
- **Smart Thumbnail Handling** - Upload files or provide URLs for thumbnail images
- **Platform-Specific Configuration** - Customize titles, descriptions, captions, tags, and privacy settings per platform
- **Schedule Publishing** - Publish immediately or schedule for optimal engagement times
- **Repost Detection** - Automatically detect and repost from Facebook, TikTok, and YouTube Shorts URLs
- **Task Status Tracking** - Monitor publishing progress and platform-specific status
- **Tag & Reference System** - Organize tasks using custom tags and reference IDs
- **Pagination & Filtering** - Search tasks by workspace, status, tag, or reference ID

### Why Use This Package?

- **Time Saving**: Publish to 4 platforms with a single API call instead of managing each separately
- **Automated Workflow**: Integrate multi-platform publishing into your content pipeline
- **Content Repurposing**: Automatically repost viral content from other platforms
- **Consistent Branding**: Apply platform-optimized metadata while maintaining brand voice
- **Progress Tracking**: Monitor task status and handle errors programmatically

### Supported Platforms

| Platform  | Content Type | Custom Thumbnails | Max File Size |
| --------- | ------------ | ----------------- | ------------- |
| YouTube   | Shorts       | ✅ Yes            | 2 GB          |
| TikTok    | Videos       | ❌ No             | 2 GB          |
| Facebook  | Reels        | ❌ No             | 2 GB          |
| Instagram | Reels        | ❌ No             | 2 GB          |

---

## 📥 Installation

Install via npm:

```bash
npm install @posty5/social-publisher-task @posty5/core
```

---

## 🚀 Quick Start

```typescript
import { HttpClient } from "@posty5/core";
import { SocialPublisherTaskClient } from "@posty5/social-publisher-task";

// Initialize the HTTP client with your API key
const httpClient = new HttpClient({
  apiKey: "your-api-key", // Get from studio.posty5.com/account/settings?tab=APIKeys
  debug: true, // Optional: Enable debug logging
});

// Create task client
const client = new SocialPublisherTaskClient(httpClient);

// Publish video to YouTube Shorts
const taskId = await client.publishShortVideo({
  workspaceId: "workspace-123", // Your workspace ID
  video: videoFile, // File object or URL string
  thumbnail: thumbFile, // Optional: File or URL
  platforms: ["youtube"], // Target platforms
  youtube: {
    title: "My First YouTube Short",
    description: "Published using Posty5 SDK",
    tags: ["shorts", "video", "tutorial"],
  },
});

console.log("Task created:", taskId);

// Check task status
const status = await client.getStatus(taskId);
console.log("Publishing status:", status.currentStatus);
console.log("YouTube:", status.youtube?.postInfo.currentStatus);
```

---

## 📚 API Reference & Examples

### publishShortVideo()

Publish a short video to one or more social media platforms. This is the main method for creating publishing tasks. It automatically detects video source type (File upload, URL, or platform-specific repost URL) and handles all upload logic.

**Parameters:**

- `options` (IPublishOptions): Publishing configuration
  - `workspaceId` (string, required): Workspace ID containing connected social accounts
  - `video` (File | string, required): Video source - File object, direct URL, or platform URL (Facebook/TikTok/YouTube)
  - `thumbnail` (File | string, optional): Thumbnail image - File object or URL string
  - `platforms` (Array<'youtube' | 'tiktok' | 'facebook' | 'instagram'>, required): Target platforms
  - `youtube` (IYouTubeConfig, optional): YouTube configuration - required if 'youtube' in platforms
  - `tiktok` (ITikTokConfig, optional): TikTok configuration - required if 'tiktok' in platforms
  - `facebook` (IFacebookPageConfig, optional): Facebook configuration - required if 'facebook' in platforms
  - `instagram` (IInstagramConfig, optional): Instagram configuration - required if 'instagram' in platforms
  - `schedule` ('now' | Date, optional): Publish immediately (default) or schedule for specific date/time
  - `tag` (string, optional): Custom tag for filtering
  - `refId` (string, optional): Your internal reference ID

**Returns:** `Promise<string>` - Created task ID

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
const taskId = await client.publishShortVideo({
  workspaceId: "workspace-123",
  video: video,
  thumbnail: thumbnail,
  platforms: ["youtube"],
  youtube: {
    title: "Product Launch Video",
    description: "Introducing our new product line for 2024",
    tags: ["product", "launch", "2024"],
    madeForKids: false,
  },
  tag: "product-launch", // Custom tag for filtering
  refId: "PROD-LAUNCH-001", // Your internal reference
});

console.log("Published to YouTube:", taskId);
```

**Example - Video URL with Thumbnail URL:**

```typescript
// Publish using URLs (no file upload needed)
const taskId = await client.publishShortVideo({
  workspaceId: "workspace-123",
  video: "https://cdn.example.com/videos/promo.mp4", // Direct video URL
  thumbnail: "https://cdn.example.com/images/thumb.jpg", // Direct thumbnail URL
  platforms: ["youtube", "tiktok"],
  youtube: {
    title: "Summer Sale Announcement",
    description: "Check out our summer collection",
    tags: ["sale", "summer", "fashion"],
  },
  tiktok: {
    caption: "Summer sale is here! 🔥 #SummerSale #Fashion",
    privacy_level: "public",
    disable_duet: false,
    disable_stitch: false,
    disable_comment: false,
  },
});

console.log("Published to YouTube and TikTok:", taskId);
```

**Example - Multi-Platform Publishing:**

```typescript
// Publish to all 4 platforms simultaneously
const taskId = await client.publishShortVideo({
  workspaceId: "workspace-123",
  video: videoFile,
  thumbnail: thumbFile,
  platforms: ["youtube", "tiktok", "facebook", "instagram"],

  // YouTube configuration
  youtube: {
    title: "How to Use Our Product",
    description: "Step-by-step tutorial for beginners",
    tags: ["tutorial", "howto", "guide"],
  },

  // TikTok configuration
  tiktok: {
    caption: "Easy tutorial! Try it yourself 🎯 #Tutorial #LearnTikTok",
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
    description: "Quick product tutorial 📱 #ProductTutorial",
    share_to_feed: true,
  },
});

console.log("Published to all platforms:", taskId);
```

**Example - Repost from TikTok:**

```typescript
// Automatically detect and repost from TikTok
const taskId = await client.publishShortVideo({
  workspaceId: "workspace-123",
  video: "https://www.tiktok.com/@username/video/1234567890", // TikTok URL
  platforms: ["youtube"], // Repost to YouTube
  youtube: {
    title: "Viral TikTok Repost",
    description: "Sharing this viral moment from TikTok",
    tags: ["tiktok", "viral", "repost"],
  },
});

console.log("Reposted from TikTok to YouTube:", taskId);
```

**Example - Repost from YouTube Shorts:**

```typescript
// Repost YouTube Shorts to TikTok
const taskId = await client.publishShortVideo({
  workspaceId: "workspace-123",
  video: "https://www.youtube.com/shorts/abc123", // YouTube Shorts URL
  platforms: ["tiktok"],
  tiktok: {
    caption: "Check out this YouTube Short! #YouTubeShorts",
    privacy_level: "public",
    disable_duet: false,
    disable_stitch: false,
    disable_comment: false,
  },
});

console.log("Reposted from YouTube to TikTok:", taskId);
```

**Example - Repost from Facebook:**

```typescript
// Repost Facebook video to other platforms
const taskId = await client.publishShortVideo({
  workspaceId: "workspace-123",
  video: "https://www.facebook.com/reel/1234567890", // Facebook Reel URL
  platforms: ["youtube", "tiktok"],
  youtube: {
    title: "Facebook Viral Moment",
    description: "Reposting this viral moment from Facebook",
    tags: ["facebook", "viral", "repost"],
  },
  tiktok: {
    caption: "Viral moment from Facebook! #Viral",
    privacy_level: "public",
    disable_duet: false,
    disable_stitch: false,
    disable_comment: false,
  },
});

console.log("Reposted from Facebook:", taskId);
```

**Example - Scheduled Publishing:**

```typescript
// Schedule video for future publication
const publishDate = new Date("2024-12-25T12:00:00Z"); // Christmas at noon

const taskId = await client.publishShortVideo({
  workspaceId: "workspace-123",
  video: videoFile,
  platforms: ["youtube", "tiktok"],
  schedule: publishDate, // Schedule for specific date/time
  youtube: {
    title: "Merry Christmas! 🎄",
    description: "Holiday greetings from our team",
    tags: ["christmas", "holiday", "greetings"],
  },
  tiktok: {
    caption: "Merry Christmas everyone! 🎅🎄 #Christmas",
    privacy_level: "public",
    disable_duet: false,
    disable_stitch: false,
    disable_comment: false,
  },
});

console.log("Scheduled for", publishDate, "- Task ID:", taskId);
```

---

### list()

Search and retrieve publishing tasks with pagination and filtering options.

**Parameters:**

- `params` (IListParams, optional): Search and filter options
  - `workspaceId` (string, optional): Filter by workspace ID
  - `currentStatus` (string, optional): Filter by task status ('pending', 'processing', 'done', 'error', etc.)
  - `tag` (string, optional): Filter by custom tag
  - `refId` (string, optional): Filter by reference ID
- `pagination` (IPaginationParams, optional): Pagination settings
  - `page` (number): Page number (default: 1)
  - `pageSize` (number): Items per page (default: 10)

**Returns:** `Promise<ISearchSocialPublisherTaskResponse>` - Paginated task list

**Response Structure:**

```typescript
{
  items: Array<{
    _id: string; // Task ID
    numbering: string; // Task number (e.g., "T-12345")
    caption: string; // Task caption/title
    createdAt: Date; // Creation timestamp
    currentStatus: string; // Overall task status
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
    totalCount: number; // Total tasks
    totalPages: number; // Total pages
  }
}
```

**Example:**

```typescript
// Get all tasks with pagination
const tasks = await client.list(
  {},
  {
    page: 1,
    pageSize: 20,
  },
);

console.log(`Total tasks: ${tasks.pagination.totalCount}`);
console.log(`Showing page ${tasks.pagination.page} of ${tasks.pagination.totalPages}`);

// Display tasks
tasks.items.forEach((task) => {
  console.log(`${task.numbering}: ${task.caption}`);
  console.log(`  Status: ${task.currentStatus}`);
  console.log(
    `  Platforms: ${[task.isAllowYoutube && "YouTube", task.isAllowTiktok && "TikTok", task.isAllowFacebookPage && "Facebook", task.isAllowInstagram && "Instagram"].filter(Boolean).join(", ")}`,
  );
});

// Filter by workspace
const workspaceTasks = await client.list(
  {
    workspaceId: "workspace-123",
  },
  {
    page: 1,
    pageSize: 50,
  },
);

console.log(`Workspace has ${workspaceTasks.items.length} tasks`);

// Filter by status
const pendingTasks = await client.list(
  {
    currentStatus: "pending",
  },
  {
    page: 1,
    pageSize: 10,
  },
);

console.log(`Pending tasks: ${pendingTasks.pagination.totalCount}`);

// Filter by tag
const campaignTasks = await client.list(
  {
    tag: "summer-campaign",
  },
  {
    page: 1,
    pageSize: 100,
  },
);

console.log(`Campaign tasks: ${campaignTasks.items.length}`);

// Filter by reference ID
const specificTask = await client.list(
  {
    refId: "PROD-001",
  },
  {
    page: 1,
    pageSize: 1,
  },
);

if (specificTask.items.length > 0) {
  console.log("Found task:", specificTask.items[0].caption);
}
```

---

### getStatus()

Retrieve detailed status information for a specific publishing task, including platform-specific progress and post URLs.

**Parameters:**

- `id` (string): Task ID

**Returns:** `Promise<ISocialPublisherTaskStatusResponse>` - Detailed task status

**Response Structure:**

```typescript
{
  _id: string;                       // Task ID
  numbering: string;                 // Task number
  caption: string;                   // Task caption
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
// Get task status
const status = await client.getStatus("task-id-here");

console.log("Task:", status.numbering);
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
  console.error("Task failed!");

  // Check which platforms failed
  const failures = [];
  if (status.youtube?.postInfo.currentStatus === "error") failures.push("YouTube");
  if (status.tiktok?.postInfo.currentStatus === "error") failures.push("TikTok");
  if (status.facebook?.postInfo.currentStatus === "error") failures.push("Facebook");
  if (status.instagram?.postInfo.currentStatus === "error") failures.push("Instagram");

  console.error("Failed platforms:", failures.join(", "));
}

// Monitor task progress
async function waitForCompletion(taskId: string, maxWaitMs = 300000) {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const status = await client.getStatus(taskId);

    console.log(`Status: ${status.currentStatus}`);

    if (status.currentStatus === "done") {
      console.log("✓ Publishing complete!");
      return status;
    }

    if (status.currentStatus === "error") {
      throw new Error("Publishing failed");
    }

    // Wait 5 seconds before checking again
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  throw new Error("Timeout waiting for task completion");
}

const finalStatus = await waitForCompletion("task-id");
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

Get the IDs of the next and previous tasks for navigation purposes.

**Parameters:**

- `id` (string): Current task ID

**Returns:** `Promise<ISocialPublisherTaskNextPreviousResponse>` - Next and previous task IDs

**Response Structure:**

```typescript
{
  nextId?: string;     // Next task ID (if exists)
  previousId?: string; // Previous task ID (if exists)
}
```

**Example:**

```typescript
// Get navigation IDs
const navigation = await client.getNextAndPrevious("current-task-id");

if (navigation.nextId) {
  console.log("Next task:", navigation.nextId);

  // Navigate to next task
  const nextTask = await client.getStatus(navigation.nextId);
  console.log("Next task caption:", nextTask.caption);
}

if (navigation.previousId) {
  console.log("Previous task:", navigation.previousId);

  // Navigate to previous task
  const prevTask = await client.getStatus(navigation.previousId);
  console.log("Previous task caption:", prevTask.caption);
}

// Build task navigation
async function navigateForward(startTaskId: string, count: number) {
  const tasks = [];
  let currentId = startTaskId;

  for (let i = 0; i < count; i++) {
    const status = await client.getStatus(currentId);
    tasks.push(status);

    const nav = await client.getNextAndPrevious(currentId);
    if (!nav.nextId) break;

    currentId = nav.nextId;
  }

  return tasks;
}

const next5Tasks = await navigateForward("task-id", 5);
console.log(`Retrieved ${next5Tasks.length} tasks`);
```

---

## 🔄 Complete Workflow Example

```typescript
import { HttpClient } from "@posty5/core";
import { SocialPublisherTaskClient } from "@posty5/social-publisher-task";
import * as fs from "fs";

// Initialize client
const httpClient = new HttpClient({
  apiKey: process.env.POSTY5_API_KEY!,
  debug: false,
});

const client = new SocialPublisherTaskClient(httpClient);

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
    const taskId = await client.publishShortVideo({
      workspaceId: "workspace-123",
      video: video,
      thumbnail: thumbnail,
      platforms: ["youtube", "tiktok"],
      youtube: {
        title: "Product Demo 2024",
        description: "Check out our latest product features",
        tags: ["product", "demo", "2024"],
      },
      tiktok: {
        caption: "New product alert! 🚀 #Product #Tech",
        privacy_level: "public",
        disable_duet: false,
        disable_stitch: false,
        disable_comment: false,
      },
      tag: "product-demo",
      refId: "DEMO-2024-001",
    });

    console.log("✓ Task created:", taskId);

    // 3. Monitor publishing progress
    console.log("\nMonitoring progress...");
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes (5 second intervals)

    while (attempts < maxAttempts) {
      const status = await client.getStatus(taskId);

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
        console.log("\n✓ Publishing complete!");

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
        console.error("\n✗ Publishing failed");
        throw new Error("Task failed");
      }

      // Wait before checking again
      await new Promise((resolve) => setTimeout(resolve, 5000));
      attempts++;
    }

    throw new Error("Timeout: Task did not complete within 5 minutes");
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

## 📘 TypeScript Support

Full TypeScript support with exported interfaces:

```typescript
import {
  // Client
  SocialPublisherTaskClient,

  // Publishing options
  IPublishOptions,

  // Platform configurations
  IYouTubeConfig,
  ITikTokConfig,
  IFacebookPageConfig,
  IInstagramConfig,

  // Schedule configuration
  IScheduleConfig,

  // Search parameters
  IListParams,

  // Response interfaces
  ISocialPublisherTaskStatusResponse,
  ISearchSocialPublisherTaskResponse,
  ISocialPublisherTaskNextPreviousResponse,
  IDefaultSettingsResponse,

  // Response types
  ISocialPublisherTaskResponse,
  ISocialPublisherWorkspace,
  ISocialPublisherAccount,

  // Status types
  SocialPublisherTaskStatusType, // 'pending' | 'processing' | 'done' | 'error' | ...
  SocialPublisherTaskSourceType, // 'video-file' | 'video-url' | 'facebook-video' | ...
  SocialPublisherAccountStatusType, // 'active' | 'inactive' | 'authenticationExpired'
} from "@posty5/social-publisher-task";
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

## 📦 Related Packages

This SDK ecosystem contains the following tool packages:

| Package | Description | Version | GitHub | NPM |
| --- | --- | --- | --- | --- |
| @posty5/short-link | URL shortener client | 1.0.1 | [📖 Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-short-link) | [📦 NPM](https://www.npmjs.com/package/@posty5/short-link) |
| @posty5/qr-code | QR code generator client | 1.0.1 | [📖 Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-qr-code) | [📦 NPM](https://www.npmjs.com/package/@posty5/qr-code) |
| @posty5/html-hosting | HTML hosting client | 1.0.1 | [📖 Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-html-hosting) | [📦 NPM](https://www.npmjs.com/package/@posty5/html-hosting) |
| @posty5/html-hosting-variables | HTML hosting variables client | 1.0.1 | [📖 Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-html-hosting-variables) | [📦 NPM](https://www.npmjs.com/package/@posty5/html-hosting-variables) |
| @posty5/html-hosting-form-submission | Form submission client | 1.0.1 | [📖 Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-html-hosting-form-submission) | [📦 NPM](https://www.npmjs.com/package/@posty5/html-hosting-form-submission) |
| @posty5/social-publisher-workspace | Social publisher workspace client | 1.0.1 | [📖 Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-social-publisher-workspace) | [📦 NPM](https://www.npmjs.com/package/@posty5/social-publisher-workspace) |
| @posty5/social-publisher-task | Social publisher task client | 1.0.1 | [📖 Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-social-publisher-task) | [📦 NPM](https://www.npmjs.com/package/@posty5/social-publisher-task) |

---

## 💻 Node.js Compatibility

- **Node.js**: >= 16.0.0
- **Module Systems**: ESM and CommonJS
- **TypeScript**: Full type definitions included

---

## 🆘 Support

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

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

---

## 🔗 Useful Links

- **Website**: [https://posty5.com](https://posty5.com)
- **Dashboard**: [studio.posty5.com/account/settings?tab=APIKeys](studio.posty5.com/account/settings?tab=APIKeys)
- **API Documentation**: [https://docs.posty5.com](https://docs.posty5.com)
- **GitHub**: [https://github.com/Posty5/npm-sdk](https://github.com/Posty5/npm-sdk)

---

Made with ❤️ by the Posty5 team
