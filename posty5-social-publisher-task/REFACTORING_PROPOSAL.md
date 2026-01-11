# API Refactoring Proposal - Social Publisher Task SDK

## Current Issues & Complexity

### Problem 1: Too Many Similar Methods
Currently, users must choose between 5 different methods:
- `publishShortVideoByFile(settings, video, thumb?)`
- `publishShortVideoByURL(settings, videoURL, thumb?)`
- `publishRepostVideoByFacebook(settings, videoURL, thumb?)`
- `publishRepostVideoByTiktok(settings, videoURL, thumb?)`
- `publishRepostVideoByYoutube(settings, videoURL, thumb?)`

**Issues:**
- ❌ Confusing for users - which method to use?
- ❌ Repetitive settings object for every call
- ❌ Platform settings mixed with video source
- ❌ No clear separation of concerns

---

### Problem 2: Complex Settings Object
Users must provide a large `ITaskSetting` object every time:

```typescript
{
    workspaceId: 'workspace-123',
    isAllowYouTube: true,
    isAllowTiktok: false,
    isAllowFacebookPage: false,
    isAllowInstagram: false,
    youTube: {
        title: 'My Video',
        description: 'Description',
        tags: ['tag1', 'tag2']
    },
    schedule: {
        type: 'now'
    }
}
```

**Issues:**
- ❌ Too verbose
- ❌ Easy to make mistakes (forgetting to set platform flags)
- ❌ Repetitive for multiple publishes

---

## 🎯 Proposed Refactoring

### Solution 1: Single Unified `publish()` Method

Replace all 5 methods with ONE simple method:

```typescript
async publish(options: IPublishOptions): Promise<ICreateSocialPublisherTaskResponse>
```

---

### Solution 2: Builder Pattern for Settings

Create a fluent builder for easier configuration:

```typescript
const task = await client.publish({
    workspaceId: 'workspace-123',
    
    // Video source (auto-detected)
    video: videoFile,  // or videoURL string
    thumbnail: thumbFile,  // or thumbURL string
    
    // Platforms (simple array)
    platforms: ['youtube', 'tiktok'],
    
    // Platform-specific settings
    youtube: {
        title: 'My Video',
        description: 'Description',
        tags: ['tag1', 'tag2']
    },
    tiktok: {
        caption: 'My Caption',
        privacy_level: 'public'
    },
    
    // Optional
    schedule: 'now',  // or Date object
    tag: 'campaign-2024',
    refId: 'external-123'
});
```

---

## 📋 Detailed Refactoring Options

### **Option A: Minimal Breaking Changes (Recommended)**

Keep existing methods but add a new simplified `publish()` method:

#### New Interface:
```typescript
export interface IPublishOptions {
    // Required
    workspaceId: string;
    
    // Video source (auto-detected: File, URL, or platform URL)
    video: File | string;
    
    // Optional thumbnail
    thumbnail?: File | string;
    
    // Platforms to publish to (simple array)
    platforms: Array<'youtube' | 'tiktok' | 'facebook' | 'instagram'>;
    
    // Platform-specific configurations (only include what you need)
    youtube?: IYouTubeConfig;
    tiktok?: ITikTokConfig;
    facebook?: IFacebookPageConfig;
    instagram?: IInstagramConfig;
    
    // Optional scheduling
    schedule?: 'now' | Date;
    
    // Optional metadata
    tag?: string;
    refId?: string;
}
```

#### New Method:
```typescript
/**
 * Publish a video to multiple social media platforms
 * Auto-detects video source type (file, URL, or platform repost)
 * @param options - Publishing options
 */
async publish(options: IPublishOptions): Promise<ICreateSocialPublisherTaskResponse> {
    // Auto-detect video source
    const source = this.detectVideoSource(options.video);
    
    // Build settings from simplified options
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
            type: options.schedule === 'now' ? 'now' : 'scheduled',
            scheduledAt: options.schedule instanceof Date ? options.schedule : undefined
        } : undefined
    };
    
    // Route to appropriate internal method based on source
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
    }
}

private detectVideoSource(video: File | string): { type: string, video: File | string } {
    if (video instanceof File) {
        return { type: 'file', video };
    }
    
    // Detect platform URLs
    if (/facebook\.com|fb\.watch/i.test(video)) {
        return { type: 'facebook', video };
    }
    if (/tiktok\.com|vm\.tiktok\.com/i.test(video)) {
        return { type: 'tiktok', video };
    }
    if (/youtube\.com\/shorts|youtu\.be/i.test(video)) {
        return { type: 'youtube', video };
    }
    
    // Default to generic URL
    return { type: 'url', video };
}
```

#### Usage Examples:

**Before (Current):**
```typescript
// Publish video file to YouTube
await client.publishShortVideoByFile(
    {
        workspaceId: 'workspace-123',
        isAllowYouTube: true,
        isAllowTiktok: false,
        isAllowFacebookPage: false,
        isAllowInstagram: false,
        youTube: {
            title: 'My Video',
            description: 'Description',
            tags: ['tag1', 'tag2']
        }
    },
    videoFile,
    thumbFile
);
```

**After (New):**
```typescript
// Same thing, much simpler!
await client.publish({
    workspaceId: 'workspace-123',
    video: videoFile,
    thumbnail: thumbFile,
    platforms: ['youtube'],
    youtube: {
        title: 'My Video',
        description: 'Description',
        tags: ['tag1', 'tag2']
    }
});
```

**Multi-Platform Publishing:**
```typescript
// Publish to multiple platforms at once
await client.publish({
    workspaceId: 'workspace-123',
    video: videoFile,
    thumbnail: 'https://cdn.com/thumb.jpg',
    platforms: ['youtube', 'tiktok', 'facebook'],
    youtube: {
        title: 'My Video',
        description: 'YouTube description',
        tags: ['youtube', 'video']
    },
    tiktok: {
        caption: 'TikTok caption #viral',
        privacy_level: 'public',
        disable_duet: false,
        disable_stitch: false,
        disable_comment: false
    },
    facebook: {
        description: 'Facebook description',
        title: 'My Video'
    }
});
```

**Repost from Platform:**
```typescript
// Auto-detects it's a Facebook URL
await client.publish({
    workspaceId: 'workspace-123',
    video: 'https://facebook.com/video/12345',
    platforms: ['youtube', 'tiktok'],
    youtube: {
        title: 'Reposted Video',
        description: 'From Facebook',
        tags: ['repost']
    },
    tiktok: {
        caption: 'Check this out!',
        privacy_level: 'public',
        disable_duet: false,
        disable_stitch: false,
        disable_comment: false
    }
});
```

**Schedule for Later:**
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
    schedule: new Date('2024-01-15T10:00:00Z')
});
```

---

### **Option B: Full Builder Pattern (Most User-Friendly)**

Create a fluent builder for maximum ease of use:

```typescript
const task = await client
    .createTask('workspace-123')
    .withVideo(videoFile)
    .withThumbnail(thumbFile)
    .publishTo('youtube', {
        title: 'My Video',
        description: 'Description',
        tags: ['tag1', 'tag2']
    })
    .publishTo('tiktok', {
        caption: 'My Caption',
        privacy_level: 'public',
        disable_duet: false,
        disable_stitch: false,
        disable_comment: false
    })
    .scheduleFor(new Date('2024-01-15T10:00:00Z'))
    .withTag('campaign-2024')
    .withRefId('external-123')
    .execute();
```

#### Implementation:
```typescript
export class TaskBuilder {
    private options: Partial<IPublishOptions> = {};
    
    constructor(private client: SocialPublisherTaskClient, workspaceId: string) {
        this.options.workspaceId = workspaceId;
        this.options.platforms = [];
    }
    
    withVideo(video: File | string): this {
        this.options.video = video;
        return this;
    }
    
    withThumbnail(thumbnail: File | string): this {
        this.options.thumbnail = thumbnail;
        return this;
    }
    
    publishTo(platform: 'youtube' | 'tiktok' | 'facebook' | 'instagram', config: any): this {
        this.options.platforms!.push(platform);
        this.options[platform] = config;
        return this;
    }
    
    scheduleFor(date: Date | 'now'): this {
        this.options.schedule = date;
        return this;
    }
    
    withTag(tag: string): this {
        this.options.tag = tag;
        return this;
    }
    
    withRefId(refId: string): this {
        this.options.refId = refId;
        return this;
    }
    
    async execute(): Promise<ICreateSocialPublisherTaskResponse> {
        if (!this.options.video) {
            throw new Error('Video is required');
        }
        if (!this.options.platforms || this.options.platforms.length === 0) {
            throw new Error('At least one platform is required');
        }
        
        return this.client.publish(this.options as IPublishOptions);
    }
}

// Add to SocialPublisherTaskClient:
createTask(workspaceId: string): TaskBuilder {
    return new TaskBuilder(this, workspaceId);
}
```

---

### **Option C: Preset Configurations (Simplest)**

Create common presets for typical use cases:

```typescript
// Quick publish to YouTube
await client.quickPublishToYouTube({
    workspaceId: 'workspace-123',
    video: videoFile,
    title: 'My Video',
    description: 'Description',
    tags: ['tag1', 'tag2'],
    thumbnail: thumbFile
});

// Quick publish to multiple platforms
await client.quickPublishToAll({
    workspaceId: 'workspace-123',
    video: videoFile,
    caption: 'Universal caption',
    thumbnail: thumbFile
});

// Repost from platform
await client.repost({
    workspaceId: 'workspace-123',
    from: 'https://facebook.com/video/12345',
    to: ['youtube', 'tiktok'],
    youtube: { title: 'Reposted', description: 'From FB', tags: [] },
    tiktok: { caption: 'Check this!', privacy_level: 'public', disable_duet: false, disable_stitch: false, disable_comment: false }
});
```

---

## 📊 Comparison Table

| Feature | Current API | Option A (Unified) | Option B (Builder) | Option C (Presets) |
|---------|-------------|-------------------|-------------------|-------------------|
| **Ease of Use** | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Flexibility** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Code Lines** | 20-30 | 10-15 | 8-12 | 5-8 |
| **Learning Curve** | High | Medium | Low | Very Low |
| **Type Safety** | ✅ | ✅ | ✅ | ✅ |
| **Breaking Changes** | N/A | ❌ None | ❌ None | ❌ None |
| **Backward Compatible** | N/A | ✅ Yes | ✅ Yes | ✅ Yes |

---

## 🎯 Recommended Approach

**Implement Option A + Option C Together:**

1. **Add the unified `publish()` method** (Option A) for flexibility
2. **Add quick helper methods** (Option C) for common use cases
3. **Keep existing methods** for backward compatibility
4. **Mark old methods as deprecated** with migration guides

### Migration Path:

```typescript
/**
 * @deprecated Use `publish()` instead
 * @example
 * // Old way:
 * await client.publishShortVideoByFile(settings, video, thumb);
 * 
 * // New way:
 * await client.publish({
 *     workspaceId: settings.workspaceId,
 *     video: video,
 *     thumbnail: thumb,
 *     platforms: ['youtube'],
 *     youtube: settings.youTube
 * });
 */
async publishShortVideoByFile(settings: ITaskSetting, video: File, thumb?: File | string) {
    // Implementation stays the same
}
```

---

## 💡 Additional Improvements

### 1. **Default Values**
```typescript
export interface IPublishOptions {
    workspaceId: string;
    video: File | string;
    thumbnail?: File | string;
    platforms: Array<'youtube' | 'tiktok' | 'facebook' | 'instagram'>;
    
    // Smart defaults
    youtube?: IYouTubeConfig | 'auto';  // 'auto' = extract from video metadata
    tiktok?: ITikTokConfig | 'auto';
    facebook?: IFacebookPageConfig | 'auto';
    instagram?: IInstagramConfig | 'auto';
    
    schedule?: 'now' | Date;  // Default: 'now'
}
```

### 2. **Validation Helpers**
```typescript
// Validate before publishing
const validation = await client.validatePublishOptions(options);
if (!validation.valid) {
    console.error(validation.errors);
}
```

### 3. **Progress Callbacks**
```typescript
await client.publish({
    // ... options
    onProgress: (progress) => {
        console.log(`${progress.step}: ${progress.percent}%`);
        // Output:
        // "Uploading thumbnail: 50%"
        // "Uploading video: 75%"
        // "Creating task: 100%"
    }
});
```

### 4. **Batch Publishing**
```typescript
// Publish multiple videos at once
await client.publishBatch([
    { workspaceId: 'ws-1', video: video1, platforms: ['youtube'] },
    { workspaceId: 'ws-1', video: video2, platforms: ['tiktok'] },
    { workspaceId: 'ws-1', video: video3, platforms: ['youtube', 'tiktok'] }
]);
```

---

## 📝 Implementation Priority

### Phase 1: Core Refactoring (Week 1)
- ✅ Add `IPublishOptions` interface
- ✅ Implement `publish()` method
- ✅ Add `detectVideoSource()` helper
- ✅ Write unit tests

### Phase 2: Quick Helpers (Week 2)
- ✅ Add `quickPublishToYouTube()`
- ✅ Add `quickPublishToTikTok()`
- ✅ Add `quickPublishToAll()`
- ✅ Add `repost()` method

### Phase 3: Advanced Features (Week 3)
- ✅ Add validation helpers
- ✅ Add progress callbacks
- ✅ Add batch publishing
- ✅ Update documentation

### Phase 4: Deprecation (Week 4)
- ✅ Mark old methods as deprecated
- ✅ Add migration guides
- ✅ Update examples in README

---

## 🚀 Benefits Summary

### For Users:
- ✅ **80% less code** to write
- ✅ **Simpler API** - one method vs five
- ✅ **Auto-detection** of video sources
- ✅ **Better defaults** - less configuration needed
- ✅ **Type safety** maintained
- ✅ **Easier to learn** and use

### For Maintainers:
- ✅ **Single source of truth** for publishing logic
- ✅ **Easier to test** - fewer methods to test
- ✅ **Easier to extend** - add new platforms easily
- ✅ **Better code reuse**
- ✅ **Backward compatible** - no breaking changes

---

## 📖 Documentation Updates Needed

1. **README.md** - Update with new `publish()` examples
2. **MIGRATION_GUIDE.md** - Create migration guide from old to new API
3. **API_REFERENCE.md** - Document new interfaces and methods
4. **EXAMPLES.md** - Add real-world usage examples
5. **CHANGELOG.md** - Document new features and deprecations

---

## ✅ Recommendation

**I strongly recommend implementing Option A + Option C:**

This approach provides:
- ✅ Maximum flexibility with `publish()`
- ✅ Maximum simplicity with quick helpers
- ✅ Zero breaking changes
- ✅ Clear migration path
- ✅ Best of both worlds

The refactored API will be **significantly easier to use** while maintaining all current functionality and adding new capabilities.

Would you like me to implement this refactoring?
