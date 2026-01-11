# @posty5/social-publisher-task

Social Publisher Task management SDK for Posty5 API. Publish videos to multiple social media platforms (YouTube, TikTok, Facebook, Instagram) with a simple, unified API.

## 📦 Installation

```bash
npm install @posty5/core @posty5/social-publisher-task
```

## 🚀 Quick Start

```typescript
import { HttpClient } from '@posty5/core';
import { SocialPublisherTaskClient } from '@posty5/social-publisher-task';

// Create HTTP client
const http = new HttpClient({
  baseUrl: 'https://api.posty5.com',
  apiKey: 'your-api-key',
});

// Create task client
const client = new SocialPublisherTaskClient(http);

// Publish to YouTube (simple!)
await client.publishShortVideoToYouTubeOnly({
    workspaceId: 'workspace-123',
    video: videoFile,
    title: 'My Video',
    description: 'Video description',
    tags: ['tutorial', 'howto']
});
```

---

## 📖 Table of Contents

1. [Configuration](#configuration)
2. [Publishing Methods](#publishing-methods)
   - [Unified Publish Method](#1-unified-publish-method-recommended)
   - [Platform-Specific Methods](#2-platform-specific-methods)
3. [Task Management](#task-management)
4. [Field Reference](#field-reference)
5. [Error Handling](#error-handling)
6. [TypeScript Support](#typescript-support)

---

## ⚙️ Configuration

### Basic Setup

```typescript
const client = new SocialPublisherTaskClient(http);
```

### Custom Configuration

```typescript
const client = new SocialPublisherTaskClient(http, {
  maxVideoUploadSizeBytes: 2147483648, // 2GB
  maxImageUploadSizeBytes: 10485760,   // 10MB
});
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxVideoUploadSizeBytes` | `number` | `1073741824` (1GB) | Maximum video file size |
| `maxImageUploadSizeBytes` | `number` | `8388608` (8MB) | Maximum thumbnail size |

---

## 📤 Publishing Methods

### 1. Unified `publish()` Method (Recommended)

The **easiest way** to publish videos. Auto-detects video source type and handles everything for you.

#### ✨ Features:
- ✅ Auto-detects video source (File, URL, or platform URL)
- ✅ Publish to multiple platforms at once
- ✅ Simple, clean API
- ✅ Full type safety

#### Example: Publish to YouTube

```typescript
await client.publish({
    workspaceId: 'workspace-123',
    video: videoFile,  // File or URL
    thumbnail: thumbFile,  // Optional: File or URL
    platforms: ['youtube'],
    youtube: {
        title: 'My Amazing Video',
        description: 'This is a great video about...',
        tags: ['tutorial', 'howto', 'tech']
    }
});
```

#### Example: Publish to Multiple Platforms

```typescript
await client.publish({
    workspaceId: 'workspace-123',
    video: videoFile,
    thumbnail: 'https://cdn.example.com/thumb.jpg',  // URL string
    platforms: ['youtube', 'tiktok', 'facebook'],
    
    youtube: {
        title: 'My Video',
        description: 'YouTube description',
        tags: ['youtube', 'video']
    },
    
    tiktok: {
        caption: 'Check this out! #viral #fyp',
        privacy_level: 'public',
        disable_duet: false,
        disable_stitch: false,
        disable_comment: false
    },
    
    facebook: {
        title: 'My Video',
        description: 'Facebook description'
    }
});
```

#### Example: Repost from Facebook (Auto-Detected)

```typescript
// SDK automatically detects it's a Facebook URL!
await client.publish({
    workspaceId: 'workspace-123',
    video: 'https://facebook.com/watch?v=12345',
    platforms: ['youtube', 'tiktok'],
    youtube: {
        title: 'Reposted from Facebook',
        description: 'Original video',
        tags: ['repost']
    },
    tiktok: {
        caption: 'Reposted! #repost',
        privacy_level: 'public',
        disable_duet: false,
        disable_stitch: false,
        disable_comment: false
    }
});
```

#### Example: Schedule for Later

```typescript
await client.publish({
    workspaceId: 'workspace-123',
    video: videoFile,
    platforms: ['youtube'],
    youtube: {
        title: 'Scheduled Video',
        description: 'Will be published tomorrow',
        tags: ['scheduled']
    },
    schedule: new Date('2024-01-15T10:00:00Z')  // Specific date/time
});
```

---

### 2. Platform-Specific Methods

For single-platform publishing, use these simplified methods:

#### YouTube Only

```typescript
await client.publishShortVideoToYouTubeOnly({
    workspaceId: 'workspace-123',
    video: videoFile,  // File or URL
    title: 'My Video',
    description: 'Video description',
    tags: ['tag1', 'tag2'],
    thumbnail: thumbFile,  // Optional
    madeForKids: false,  // Optional
    schedule: 'now',  // Optional: 'now' or Date
    tag: 'campaign-2024',  // Optional
    refId: 'external-123'  // Optional
});
```

#### TikTok Only

```typescript
await client.publishShortVideoToTiktokOnly({
    workspaceId: 'workspace-123',
    video: videoFile,
    caption: 'My TikTok video #viral',
    thumbnail: thumbFile,  // Optional
    privacy_level: 'public',  // Optional: 'public', 'friends', 'private'
    disable_duet: false,  // Optional
    disable_stitch: false,  // Optional
    disable_comment: false,  // Optional
    schedule: 'now',  // Optional
    tag: 'campaign-2024',  // Optional
    refId: 'external-123'  // Optional
});
```

#### Facebook Only

```typescript
await client.publishShortVideoToFacebookOnly({
    workspaceId: 'workspace-123',
    video: videoFile,
    title: 'My Video',
    description: 'Facebook description',
    thumbnail: thumbFile,  // Optional
    schedule: 'now',  // Optional
    tag: 'campaign-2024',  // Optional
    refId: 'external-123'  // Optional
});
```

#### Instagram Only

```typescript
await client.publishShortVideoToInstagramOnly({
    workspaceId: 'workspace-123',
    video: videoFile,
    description: 'Instagram description #instagram',
    thumbnail: thumbFile,  // Optional
    share_to_feed: true,  // Optional
    is_published_to_both_feed_and_story: false,  // Optional
    schedule: 'now',  // Optional
    tag: 'campaign-2024',  // Optional
    refId: 'external-123'  // Optional
});
```

---

## 📋 Field Reference

### Common Fields (All Methods)

All platform-specific methods inherit these common fields from `IQuickPublishBaseOptions`:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `workspaceId` | `string` | ✅ Yes | Workspace where task will be created |
| `video` | `File \| string` | ✅ Yes | Video file or URL (supports .mp4, .mov, .avi, .mkv, .webm) |
| `thumbnail` | `File \| string` | ❌ No | Thumbnail file or URL |
| `schedule` | `'now' \| Date` | ❌ No | Publish immediately or schedule for later (default: 'now') |
| `tag` | `string` | ❌ No | Custom tag for categorization (e.g., 'campaign-2024') |
| `refId` | `string` | ❌ No | External reference ID for your system (e.g., 'crm-123') |

### YouTube-Specific Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | `string` | ✅ Yes | Video title (max 100 characters) |
| `description` | `string` | ✅ Yes | Video description (max 5000 characters) |
| `tags` | `string[]` | ✅ Yes | Keywords for discovery (max 500 characters total) |
| `madeForKids` | `boolean` | ❌ No | COPPA compliance (default: false) |

### TikTok-Specific Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `caption` | `string` | ✅ Yes | Video caption with hashtags (max 2200 characters) |
| `privacy_level` | `string` | ❌ No | 'public', 'friends', or 'private' (default: 'public') |
| `disable_duet` | `boolean` | ❌ No | Disable duet feature (default: false) |
| `disable_stitch` | `boolean` | ❌ No | Disable stitch feature (default: false) |
| `disable_comment` | `boolean` | ❌ No | Disable comments (default: false) |

### Facebook-Specific Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | `string` | ✅ Yes | Video title (max 255 characters) |
| `description` | `string` | ✅ Yes | Video description (max 63,206 characters) |

### Instagram-Specific Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `description` | `string` | ✅ Yes | Caption with hashtags (max 2,200 characters) |
| `share_to_feed` | `boolean` | ❌ No | Share to main feed (default: false) |
| `is_published_to_both_feed_and_story` | `boolean` | ❌ No | Publish to both feed and story (default: false) |

---

## 🔧 Task Management

### Search Tasks

```typescript
const results = await client.search(
  { status: 'completed' },  // Optional filters
  { page: 1, limit: 10 }    // Optional pagination
);

console.log('Total:', results.pagination.totalItems);
results.data.forEach(task => {
  console.log(`Task ${task._id}: ${task.currentStatus}`);
});
```

### Get Task Status

```typescript
const status = await client.getStatus('task-id');
console.log('Status:', status.status);
```

### Get Default Settings

```typescript
const defaults = await client.getDefaultSettings();
console.log('Defaults:', defaults);
```

### Get Next/Previous Task

```typescript
const nav = await client.getNextAndPrevious('task-id');
console.log('Next:', nav.nextId);
console.log('Previous:', nav.previousId);
```

---

## ⚠️ Error Handling

All methods throw errors for validation failures:

```typescript
try {
  await client.publishShortVideoToYouTubeOnly({
    workspaceId: 'workspace-123',
    video: videoFile,
    title: 'My Video',
    description: 'Description',
    tags: ['tag1']
  });
} catch (error) {
  if (error.message.includes('exceeds maximum allowed size')) {
    console.error('File too large!');
  } else if (error.message.includes('Invalid video file type')) {
    console.error('Unsupported format!');
  } else {
    console.error('Error:', error.message);
  }
}
```

### Common Errors

| Error Message | Cause | Solution |
|---------------|-------|----------|
| `Video file size exceeds maximum` | File too large | Compress video or increase `maxVideoUploadSizeBytes` |
| `Invalid video file type` | Unsupported format | Use .mp4, .mov, .avi, .mkv, or .webm |
| `workspaceId is required` | Missing field | Provide workspace ID |
| `At least one platform must be specified` | Empty platforms array | Add at least one platform |
| `YouTube configuration is required` | Missing platform config | Provide platform-specific configuration |

---

## 📘 TypeScript Support

Full TypeScript support with exported interfaces:

```typescript
import {
  // Client
  SocialPublisherTaskClient,
  ISocialPublisherTaskClientConfig,
  
  // Unified publish
  IPublishOptions,
  
  // Platform-specific
  IQuickPublishBaseOptions,
  IQuickPublishYouTubeOptions,
  IQuickPublishTikTokOptions,
  IQuickPublishFacebookOptions,
  IQuickPublishInstagramOptions,
  
  // Platform configs
  IYouTubeConfig,
  ITikTokConfig,
  IFacebookPageConfig,
  IInstagramConfig,
  
  // Responses
  ICreateSocialPublisherTaskResponse,
  ISearchSocialPublisherTaskResponse,
  ISocialPublisherTaskStatusResponse,
} from '@posty5/social-publisher-task';
```

---

## 🎯 Best Practices

### 1. Use the Unified `publish()` Method

```typescript
// ✅ Recommended
await client.publish({
    workspaceId: 'workspace-123',
    video: videoFile,
    platforms: ['youtube'],
    youtube: { title: 'Video', description: 'Desc', tags: [] }
});
```

### 2. Use Platform-Specific Methods for Single Platform

```typescript
// ✅ Even simpler for YouTube only
await client.publishShortVideoToYouTubeOnly({
    workspaceId: 'workspace-123',
    video: videoFile,
    title: 'Video',
    description: 'Desc',
    tags: []
});
```

### 3. Store Common Config

```typescript
// ✅ Don't repeat yourself
const config = {
    workspaceId: 'workspace-123',
    tag: 'campaign-2024'
};

await client.publishShortVideoToYouTubeOnly({
    ...config,
    video: video1,
    title: 'Video 1',
    description: 'Desc',
    tags: []
});

await client.publishShortVideoToTiktokOnly({
    ...config,
    video: video2,
    caption: 'Video 2 #viral',
    privacy_level: 'public',
    disable_duet: false,
    disable_stitch: false,
    disable_comment: false
});
```

### 4. Use Thumbnail URLs When Possible

```typescript
// ✅ Faster - no upload needed
await client.publish({
    workspaceId: 'workspace-123',
    video: videoFile,
    thumbnail: 'https://cdn.example.com/thumb.jpg',  // URL instead of File
    platforms: ['youtube'],
    youtube: { title: 'Video', description: 'Desc', tags: [] }
});
```

---

## 📚 Additional Resources

- [New API Guide](./NEW_API_GUIDE.md) - Comprehensive usage examples
- [Refactoring Proposal](./REFACTORING_PROPOSAL.md) - Design decisions
- [Method Updates](./METHOD_UPDATES.md) - Recent changes
- [Thumbnail Enhancement](./THUMBNAIL_UPLOAD_ENHANCEMENT.md) - File/URL support

---

## 📊 Comparison: Old vs New API

| Feature | Old API | New API |
|---------|---------|---------|
| **Methods to Learn** | 5 different | 1 unified + 4 helpers |
| **Lines of Code** | 20-30 | 10-15 |
| **Auto-Detection** | ❌ Manual | ✅ Automatic |
| **Type Safety** | ✅ Yes | ✅ Yes |
| **Ease of Use** | ⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 📄 License

MIT

---

## 🤝 Support

For issues or questions, please contact Posty5 support or check the documentation.
