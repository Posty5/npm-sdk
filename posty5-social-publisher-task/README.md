# @posty5/social-publisher-task

Social Publisher Task management SDK for Posty5 API. This SDK provides a simple interface to publish videos to multiple social media platforms (YouTube, TikTok, Facebook, Instagram) simultaneously.

## Installation

```bash
npm install @posty5/core @posty5/social-publisher-task
```

## Usage

### Basic Setup

```typescript
import { HttpClient } from '@posty5/core';
import { SocialPublisherTaskClient } from '@posty5/social-publisher-task';

// Create HTTP client
const http = new HttpClient({
  baseUrl: 'https://api.posty5.com',
  apiKey: 'your-api-key',
});

// Create client with default configuration
const taskClient = new SocialPublisherTaskClient(http);

// Or create client with custom configuration
const taskClient = new SocialPublisherTaskClient(http, {
  maxVideoUploadSizeBytes: 2147483648, // 2GB
  maxImageUploadSizeBytes: 10485760,   // 10MB
});
```

### Configuration Options

The `SocialPublisherTaskClient` accepts an optional configuration object:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxVideoUploadSizeBytes` | `number` | `1073741824` (1GB) | Maximum video file size in bytes |
| `maxImageUploadSizeBytes` | `number` | `8388608` (8MB) | Maximum thumbnail/image file size in bytes |

These limits are publicly accessible:

```typescript
console.log(taskClient.maxVideoUploadSizeBytes); // 1073741824
console.log(taskClient.maxImageUploadSizeBytes); // 8388608
```

## Publishing Methods

### 1. Publish Short Video by File

Upload a video file and optional thumbnail directly to publish across platforms.

**Supported video formats:** `.mp4`, `.mov`, `.avi`, `.mkv`, `.webm`

```typescript
// Prepare your video file (from file input, etc.)
const videoFile = document.getElementById('video-input').files[0];
const thumbnailFile = document.getElementById('thumb-input').files[0]; // Optional

// Define publishing settings
const settings = {
  workspaceId: 'your-org-id',
  source: 'video-file',
  isAllowYouTube: true,
  isAllowTiktok: true,
  isAllowFacebookPage: true,
  isAllowInstagram: true,
  youTube: {
    title: 'My Awesome Video',
    description: 'Check out this amazing content!',
    tags: ['tutorial', 'howto', 'demo'],
    madeForKids: false,
  },
  tiktok: {
    caption: 'Amazing content! #viral #trending',
    disable_duet: false,
    disable_stitch: false,
    disable_comment: false,
    privacy_level: 'PUBLIC_TO_EVERYONE',
  },
  facebookPage: {
    description: 'Check out this video!',
    title: 'My Video',
  },
  instagram: {
    description: 'New video! #instagram #reels',
    share_to_feed: true,
  },
  schedule: {
    type: 'now', // or 'scheduled'
    scheduledAt: new Date('2026-01-15T10:00:00Z'), // Required if type is 'scheduled'
  },
};

// Publish the video
const task = await taskClient.publishShortVideoByFile(settings, videoFile, thumbnailFile);
console.log('Task created:', task._id);
```

### 2. Publish Short Video by URL

Publish a video from an external URL with optional thumbnail upload.

```typescript
const videoURL = 'https://example.com/videos/my-video.mp4';
const thumbnailFile = document.getElementById('thumb-input').files[0]; // Optional

const task = await taskClient.publishShortVideoByURL(settings, videoURL, thumbnailFile);
console.log('Task created:', task._id);
```

### 3. Repost Video from Facebook

Repost an existing Facebook video to other platforms.

**Supported URLs:**
- `https://www.facebook.com/watch/...`
- `https://fb.watch/...`
- `https://www.facebook.com/reel/...`
- `https://www.facebook.com/.../videos/...`

```typescript
const facebookVideoURL = 'https://www.facebook.com/watch/123456789';
const thumbnailFile = document.getElementById('thumb-input').files[0]; // Optional

const task = await taskClient.publishRepostVideoByFacebook(settings, facebookVideoURL, thumbnailFile);
console.log('Task created:', task._id);
```

### 4. Repost Video from TikTok

Repost an existing TikTok video to other platforms.

**Supported URLs:**
- `https://www.tiktok.com/@username/video/123456789`
- `https://vm.tiktok.com/...`

```typescript
const tiktokVideoURL = 'https://www.tiktok.com/@username/video/123456789';
const thumbnailFile = document.getElementById('thumb-input').files[0]; // Optional

const task = await taskClient.publishRepostVideoByTiktok(settings, tiktokVideoURL, thumbnailFile);
console.log('Task created:', task._id);
```

### 5. Repost Video from YouTube Shorts

Repost an existing YouTube Shorts video to other platforms.

**Supported URLs:**
- `https://www.youtube.com/shorts/ABC123`
- `https://youtu.be/ABC123`

```typescript
const youtubeVideoURL = 'https://www.youtube.com/shorts/ABC123';
const thumbnailFile = document.getElementById('thumb-input').files[0]; // Optional

const task = await taskClient.publishRepostVideoByYoutube(settings, youtubeVideoURL, thumbnailFile);
console.log('Task created:', task._id);
```

## Task Management

### Search Tasks

```typescript
const results = await taskClient.search(
  { status: 'completed' }, // Optional filters
  { page: 1, limit: 10 }   // Optional pagination
);

console.log('Total tasks:', results.pagination.totalItems);
results.data.forEach(task => {
  console.log(`Task ${task._id}: ${task.currentStatus}`);
});
```

### Get Task Status

```typescript
const status = await taskClient.getStatus('task-id');
console.log('Status:', status.status);
if (status.error) {
  console.error('Error:', status.error);
}
```

### Get Default Settings

```typescript
const defaults = await taskClient.getDefaultSettings();
console.log('Default settings:', defaults);
```

### Get Next/Previous Task

```typescript
const nav = await taskClient.getNextAndPrevious('current-task-id');
if (nav.nextId) console.log('Next task:', nav.nextId);
if (nav.previousId) console.log('Previous task:', nav.previousId);
```

## Error Handling

All methods throw errors for validation failures:

```typescript
try {
  const task = await taskClient.publishShortVideoByFile(settings, videoFile);
} catch (error) {
  if (error.message.includes('exceeds maximum allowed size')) {
    console.error('File too large!');
  } else if (error.message.includes('Invalid video file type')) {
    console.error('Unsupported file format!');
  } else {
    console.error('Error:', error.message);
  }
}
```

## TypeScript Support

This package is written in TypeScript and includes full type definitions. All interfaces are exported for your convenience:

```typescript
import {
  SocialPublisherTaskClient,
  ISocialPublisherTaskClientConfig,
  ICreateSocialPublisherTaskRequest,
  IYouTubeConfig,
  ITikTokConfig,
  IFacebookPageConfig,
  IInstagramConfig,
  IScheduleConfig,
} from '@posty5/social-publisher-task';
```

## License

MIT
