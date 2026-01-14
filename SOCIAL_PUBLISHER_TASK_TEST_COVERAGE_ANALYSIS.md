# Social Publisher Task Test Coverage Analysis

## Executive Summary

This document analyzes the test coverage of `posty5-sdk/__tests__/social-publisher-task.test.ts` against the implementation in `posty5-sdk/posty5-social-publisher-task` to identify gaps, parameter validation issues, and missing SDK methods.

---

## 🔴 **CRITICAL ISSUES FOUND**

### Issue 1: Tests Call Non-Existent Methods

**Severity:** 🔴 **CRITICAL - Tests Will Fail**

**Problem:** The test file calls `get()` and `delete()` methods that **DO NOT EXIST** in the SDK client.

**Test Code (Lines 232, 240, 291, 295):**
```typescript
// Line 232 - Calls non-existent method
const result = await client.get(createdId);

// Line 240 - Calls non-existent method
await expect(client.get('invalid-id-123')).rejects.toThrow();

// Line 291 - Calls non-existent method
await client.delete(createdId);

// Line 295 - Calls non-existent method  
await expect(client.get(createdId)).rejects.toThrow();
```

**SDK Client:** The `SocialPublisherTaskClient` class does **NOT** have `get()` or `delete()` methods.

**API Router:** The API also does **NOT** expose GET by ID or DELETE endpoints for tasks.

**Impact:** These tests will **FAIL** when run because the methods don't exist.

**Root Cause:** The tests were likely copied from another SDK (like workspace or QR code) without verifying the actual API capabilities.

---

## Test Coverage Status

### ✅ **Well Covered Areas**

#### 1. **Create Operations - URL-based Publishing**
- ✅ `publishShortVideoByURL()` - Tested with YouTube
- ✅ `publishShortVideoByURL()` - Tested with TikTok and thumbnail

#### 2. **Create Operations - File-based Publishing**
- ✅ `publishShortVideoByFile()` - Tested with video file
- ✅ `publishShortVideoByFile()` - Tested with video and thumbnail files

#### 3. **Create Operations - Repost from Social Media**
- ✅ `publishRepostVideoByYoutube()` - Tested

#### 4. **Create Operations - Platform-Specific**
- ✅ `publishShortVideoToYouTubeOnly()` - Tested
- ✅ `publishShortVideoToTiktokOnly()` - Tested

#### 5. **List/Search Operations**
- ✅ `list()` - Tested with pagination
- ✅ `list()` - Tested with workspace filter
- ✅ `list()` - Tested with status filter

---

## ❌ **Missing Test Coverage**

### 1. **SDK Methods Not Tested**

| Method | Purpose | Status |
|--------|---------|--------|
| `publish()` | Generic publish with auto-detection | ❌ Not tested |
| `publishShortVideoToFacebookOnly()` | Publish to Facebook only | ❌ Not tested |
| `publishShortVideoToInstagramOnly()` | Publish to Instagram only | ❌ Not tested |
| `getDefaultSettings()` | Get default settings | ❌ Not tested |
| `getStatus()` | Get task status | ❌ Not tested |
| `getNextAndPrevious()` | Get next/previous task IDs | ❌ Not tested |

### 2. **Repost Methods Not Fully Tested**

| Method | Status |
|--------|--------|
| `publishRepostVideoByYoutube()` | ✅ Tested |
| `publishRepostVideoByFacebook()` | ❌ Not tested |
| `publishRepostVideoByTiktok()` | ❌ Not tested |

### 3. **Helper Functions Not Used Properly**

**Current Implementation (Lines 6-18):**
```typescript
function getVideo() {
  const flePath = path.join(__dirname, "assets", "thumb.mp4");
  const fileContent = fs.readFileSync(flePath);
  const blob = new Blob([fileContent], { type: "video/mp4" });
  return blob;
}

function getThumb() {
  const flePath = path.join(__dirname, "assets", "video.jpg");
  const fileContent = fs.readFileSync(flePath);
  const blob = new Blob([fileContent], { type: "image/jpeg" });
  return blob;
}
```

**Problem:** These helper functions are **defined but NEVER USED** in the tests. Instead, the tests duplicate this logic inline (lines 97-100, 127-136).

**Impact:** Code duplication, harder to maintain, inconsistent file loading.

### 4. **Optional Parameters Not Tested**

#### Create/Update Request Parameters
- ❌ `refId` - Custom reference ID
- ❌ `tag` - Custom tag for filtering
- ❌ `schedule` with future date - Only 'now' is tested
- ❌ Platform-specific optional fields (tags, madeForKids, etc.)

#### List/Search Parameters
Tested:
- ✅ `workspaceId` - Filter by workspace
- ✅ `currentStatus` - Filter by status

Not tested:
- ❌ `userId` - Filter by user ID
- ❌ `apiKeyId` - Filter by API key ID
- ❌ `tag` - Filter by tag
- ❌ `refId` - Filter by reference ID
- ❌ `source` - Filter by source type
- ❌ Date range filters

### 5. **Edge Cases Not Tested**

- ❌ File size validation (max 1GB for video, 8MB for thumbnail)
- ❌ Invalid file types
- ❌ Invalid URL formats
- ❌ Missing required platform configurations
- ❌ Invalid schedule dates (past dates)
- ❌ Empty platform arrays
- ❌ Conflicting platform settings
- ❌ Very long strings for titles/descriptions
- ❌ Special characters in metadata
- ❌ Unicode characters

### 6. **Error Scenarios Not Tested**

- ❌ Missing required fields (workspaceId, video, platforms)
- ❌ Invalid workspace ID
- ❌ File upload failures
- ❌ Network errors
- ❌ Unauthorized access (invalid API key)
- ❌ Rate limiting
- ❌ Malformed request bodies
- ❌ Platform-specific validation errors

### 7. **Response Validation Not Tested**

The tests only check for `_id` existence, but don't validate:
- ❌ Complete response structure
- ❌ Task status values
- ❌ Workspace ID in response
- ❌ Platform-specific response fields
- ❌ Schedule information
- ❌ Source type

---

## 🔍 **Parameter Validation Issues**

### Issue 1: Incorrect File Paths in Helper Functions

**Severity:** 🟡 **MEDIUM**

**Location:** Lines 7, 14

**Problem:** The file paths in helper functions are **SWAPPED**:

```typescript
// Line 7 - Says "thumb.mp4" but function is getVideo()
function getVideo() {
  const flePath = path.join(__dirname, "assets", "thumb.mp4");  // ❌ Wrong!
  // ...
}

// Line 14 - Says "video.jpg" but function is getThumb()
function getThumb() {
  const flePath = path.join(__dirname, "assets", "video.jpg");  // ❌ Wrong!
  // ...
}
```

**Expected:**
```typescript
function getVideo() {
  const flePath = path.join(__dirname, "assets", "video.mp4");  // ✅ Correct
  // ...
}

function getThumb() {
  const flePath = path.join(__dirname, "assets", "thumb.jpg");  // ✅ Correct
  // ...
}
```

**Impact:** Tests might be uploading thumbnail as video and vice versa!

### Issue 2: Duplicate File Loading Logic

**Severity:** 🟡 **MEDIUM**

**Location:** Lines 97-100, 127-136

**Problem:** Tests duplicate the file loading logic instead of using the helper functions:

```typescript
// Lines 97-100 - Duplicates getVideo() logic
const videoPath = path.join(__dirname, 'assets', 'thumb.mp4');
const videoBuffer = fs.readFileSync(videoPath);
const videoBlob = new Blob([videoBuffer], { type: 'video/mp4' });
const videoFile = new File([videoBlob], 'test-video.mp4', { type: 'video/mp4' });

// Lines 127-136 - Duplicates both getVideo() and getThumb() logic
const videoPath = path.join(__dirname, 'assets', 'thumb.mp4');
const videoBuffer = fs.readFileSync(videoPath);
const videoBlob = new Blob([videoBuffer], { type: 'video/mp4' });
const videoFile = new File([videoBlob], 'test-video.mp4', { type: 'video/mp4' });

const thumbPath = path.join(__dirname, 'assets', 'video.jpg');
const thumbBuffer = fs.readFileSync(thumbPath);
const thumbBlob = new Blob([thumbBuffer], { type: 'image/jpeg' });
const thumbFile = new File([thumbBlob], 'thumbnail.jpg', { type: 'image/jpeg' });
```

**Recommendation:** Use the helper functions consistently.

### Issue 3: Missing Required Fields in Tests

**Severity:** 🟡 **MEDIUM**

**Location:** Various create tests

**Problem:** Some tests don't include all required fields according to the API schema.

**API Schema Requirements:**
```typescript
// schema.ts:6-7
workspaceId: Joi.string().required(),
source: Joi.string().valid('video-url', 'video-file', ...).required(),
```

**Test Code:** The SDK client automatically sets `source` and `createdFrom`, so this is handled correctly.

**YouTube Required Fields (when isAllowYouTube is true):**
```typescript
// schema.ts:22-25
youTube: Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  tags: Joi.array().items(Joi.string()).required(),
  // ...
}).required()
```

**Test Code (Line 49-53):**
```typescript
youTube: {
    title: 'Test Video - ' + Date.now(),
    description: 'Test video from SDK',
    privacyStatus: 'private',  // ❌ Missing 'tags' array (required)
},
```

**Impact:** Tests might fail if API validation is strict.

### Issue 4: Incorrect Interface Usage

**Severity:** 🟡 **MEDIUM**

**Location:** Test method calls

**Problem:** Tests call private methods directly, which shouldn't be possible:

```typescript
// Line 45 - Calls private method (shouldn't be accessible)
const result = await client.publishShortVideoByURL({...});

// Line 102 - Calls private method (shouldn't be accessible)
const result = await client.publishShortVideoByFile({...});

// Line 164 - Calls private method (shouldn't be accessible)
const result = await client.publishRepostVideoByYoutube({...});
```

**SDK Client (Lines 214, 168, 311):**
```typescript
private async publishShortVideoByURL(...) { ... }
private async publishShortVideoByFile(...) { ... }
private async publishRepostVideoByYoutube(...) { ... }
```

**Impact:** These methods are marked `private` in TypeScript but tests can still call them in JavaScript. This is a **design issue** - these methods should either be:
1. Made `public` if they're meant to be used directly
2. Kept `private` and tests should use the `publish()` method instead

---

## ✅ **Correct Parameter Usage**

### What the Tests Are Doing Right:

1. **Valid Data Types:** All parameters use correct types
2. **Realistic Test Data:** Using realistic URLs, titles, descriptions
3. **File Handling:** Properly creating File objects from buffers
4. **Platform Configuration:** Correctly configuring platform-specific settings
5. **Schedule Testing:** Testing 'now' schedule type
6. **Filter Testing:** Testing workspace and status filters

### Examples of Correct Usage:

#### ✅ YouTube Publishing
```typescript
await client.publishShortVideoByURL({
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
```

#### ✅ File Upload
```typescript
const videoFile = new File([videoBlob], 'test-video.mp4', { type: 'video/mp4' });
await client.publishShortVideoByFile({
    workspaceId: workspaceId,
    videoFile: videoFile,
    // ...
});
```

---

## 📊 **Coverage Metrics**

| Category | Covered | Total | Percentage |
|----------|---------|-------|------------|
| Public SDK Methods | 5 | 11 | 45% |
| Private SDK Methods (tested directly) | 5 | 5 | 100% |
| API Endpoints (Exposed) | 1 | 6 | 17% |
| Required Parameters | 3 | 5+ | 60% |
| Optional Parameters | 2 | 10+ | 20% |
| Search Filters | 2 | 8+ | 25% |
| Error Cases | 0 | 15+ | 0% |
| **Overall Coverage** | **18** | **60+** | **30%** |

---

## 🚨 **Recommendations**

### Priority 1: Fix Critical Issues

#### 1.1 Remove Non-Existent Method Calls
```typescript
describe('GET BY ID', () => {
    // ❌ REMOVE THIS - Method doesn't exist
    it('should get task by ID', async () => {
        const result = await client.get(createdId);
        // ...
    });
});

describe('DELETE', () => {
    // ❌ REMOVE THIS - Method doesn't exist
    it('should delete task', async () => {
        await client.delete(createdId);
        // ...
    });
});
```

**Note:** If get/delete functionality is needed, it must be added to both the API and SDK first.

#### 1.2 Fix Helper Function File Paths
```typescript
function getVideo() {
  const filePath = path.join(__dirname, "assets", "video.mp4");  // ✅ Fixed
  const fileContent = fs.readFileSync(filePath);
  const blob = new Blob([fileContent], { type: "video/mp4" });
  const file = new File([blob], "video.mp4", { type: "video/mp4" });
  return file;  // Return File, not Blob
}

function getThumb() {
  const filePath = path.join(__dirname, "assets", "thumb.jpg");  // ✅ Fixed
  const fileContent = fs.readFileSync(filePath);
  const blob = new Blob([fileContent], { type: "image/jpeg" });
  const file = new File([blob], "thumb.jpg", { type: "image/jpeg" });
  return file;  // Return File, not Blob
}
```

#### 1.3 Use Helper Functions Consistently
```typescript
describe('CREATE - File-based Publishing', () => {
    it('should create task with video file', async () => {
        if (!workspaceId) return;

        const videoFile = getVideo();  // ✅ Use helper

        const result = await client.publishShortVideoByFile({
            workspaceId: workspaceId,
            videoFile: videoFile,
            // ...
        });

        expect(result._id).toBeDefined();
        createdResources.tasks.push(result._id);
    });

    it('should create task with video and thumbnail files', async () => {
        if (!workspaceId) return;

        const videoFile = getVideo();  // ✅ Use helper
        const thumbFile = getThumb();  // ✅ Use helper

        const result = await client.publishShortVideoByFile({
            workspaceId: workspaceId,
            videoFile: videoFile,
            thumbFile: thumbFile,
            // ...
        });

        expect(result._id).toBeDefined();
        createdResources.tasks.push(result._id);
    });
});
```

### Priority 2: Add Missing Tests

#### 2.1 Test Generic `publish()` Method
```typescript
describe('CREATE - Generic Publish Method', () => {
    it('should publish with auto-detection (file)', async () => {
        if (!workspaceId) return;

        const videoFile = getVideo();

        const result = await client.publish({
            workspaceId: workspaceId,
            video: videoFile,
            platforms: ['youtube'],
            youtube: {
                title: 'Auto-detected File',
                description: 'Test',
                tags: ['test']
            }
        });

        expect(result._id).toBeDefined();
        createdResources.tasks.push(result._id);
    });

    it('should publish with auto-detection (URL)', async () => {
        if (!workspaceId) return;

        const result = await client.publish({
            workspaceId: workspaceId,
            video: 'https://example.com/video.mp4',
            platforms: ['youtube'],
            youtube: {
                title: 'Auto-detected URL',
                description: 'Test',
                tags: ['test']
            }
        });

        expect(result._id).toBeDefined();
        createdResources.tasks.push(result._id);
    });

    it('should publish to multiple platforms', async () => {
        if (!workspaceId) return;

        const result = await client.publish({
            workspaceId: workspaceId,
            video: 'https://example.com/video.mp4',
            platforms: ['youtube', 'tiktok'],
            youtube: {
                title: 'Multi-platform',
                description: 'Test',
                tags: ['test']
            },
            tiktok: {
                caption: 'Test caption',
                privacy_level: 'SELF_ONLY',
                disable_duet: false,
                disable_stitch: false,
                disable_comment: false
            }
        });

        expect(result._id).toBeDefined();
        createdResources.tasks.push(result._id);
    });
});
```

#### 2.2 Test Facebook and Instagram Publishing
```typescript
describe('CREATE - Facebook and Instagram', () => {
    it('should publish to Facebook only', async () => {
        if (!workspaceId) return;

        const result = await client.publishShortVideoToFacebookOnly({
            workspaceId: workspaceId,
            video: 'https://example.com/video.mp4',
            title: 'Facebook Video',
            description: 'Test description'
        });

        expect(result._id).toBeDefined();
        createdResources.tasks.push(result._id);
    });

    it('should publish to Instagram only', async () => {
        if (!workspaceId) return;

        const result = await client.publishShortVideoToInstagramOnly({
            workspaceId: workspaceId,
            video: 'https://example.com/video.mp4',
            description: 'Instagram description'
        });

        expect(result._id).toBeDefined();
        createdResources.tasks.push(result._id);
    });
});
```

#### 2.3 Test Repost from Other Platforms
```typescript
describe('CREATE - Repost from Other Platforms', () => {
    it('should repost from Facebook', async () => {
        if (!workspaceId) return;

        const result = await client.publish({
            workspaceId: workspaceId,
            video: 'https://facebook.com/watch/12345',
            platforms: ['youtube'],
            youtube: {
                title: 'Reposted from Facebook',
                description: 'Test',
                tags: ['repost']
            }
        });

        expect(result._id).toBeDefined();
        createdResources.tasks.push(result._id);
    });

    it('should repost from TikTok', async () => {
        if (!workspaceId) return;

        const result = await client.publish({
            workspaceId: workspaceId,
            video: 'https://tiktok.com/@user/video/12345',
            platforms: ['youtube'],
            youtube: {
                title: 'Reposted from TikTok',
                description: 'Test',
                tags: ['repost']
            }
        });

        expect(result._id).toBeDefined();
        createdResources.tasks.push(result._id);
    });
});
```

#### 2.4 Test Utility Methods
```typescript
describe('UTILITY METHODS', () => {
    it('should get default settings', async () => {
        const result = await client.getDefaultSettings();
        expect(result).toBeDefined();
    });

    it('should get task status', async () => {
        if (!createdId) return;

        const result = await client.getStatus(createdId);
        expect(result).toBeDefined();
        expect(result.status).toBeDefined();
    });

    it('should get next and previous tasks', async () => {
        if (!createdId) return;

        const result = await client.getNextAndPrevious(createdId);
        expect(result).toBeDefined();
    });
});
```

### Priority 3: Add Edge Case Tests

```typescript
describe('EDGE CASES', () => {
    it('should reject video file exceeding size limit', async () => {
        if (!workspaceId) return;

        // Create a mock large file (> 1GB)
        const largeBuffer = Buffer.alloc(1073741825); // 1GB + 1 byte
        const largeBlob = new Blob([largeBuffer], { type: 'video/mp4' });
        const largeFile = new File([largeBlob], 'large.mp4', { type: 'video/mp4' });

        await expect(
            client.publish({
                workspaceId: workspaceId,
                video: largeFile,
                platforms: ['youtube'],
                youtube: { title: 'Test', description: 'Test', tags: [] }
            })
        ).rejects.toThrow(/exceeds maximum allowed size/);
    });

    it('should reject invalid video file type', async () => {
        if (!workspaceId) return;

        const buffer = Buffer.from('fake video content');
        const blob = new Blob([buffer], { type: 'application/pdf' });
        const file = new File([blob], 'video.pdf', { type: 'application/pdf' });

        await expect(
            client.publish({
                workspaceId: workspaceId,
                video: file,
                platforms: ['youtube'],
                youtube: { title: 'Test', description: 'Test', tags: [] }
            })
        ).rejects.toThrow(/Invalid video file type/);
    });

    it('should reject invalid video URL', async () => {
        if (!workspaceId) return;

        await expect(
            client.publish({
                workspaceId: workspaceId,
                video: 'not-a-valid-url',
                platforms: ['youtube'],
                youtube: { title: 'Test', description: 'Test', tags: [] }
            })
        ).rejects.toThrow(/Invalid video URL/);
    });

    it('should reject missing platform configuration', async () => {
        if (!workspaceId) return;

        await expect(
            client.publish({
                workspaceId: workspaceId,
                video: 'https://example.com/video.mp4',
                platforms: ['youtube'],
                // ❌ Missing youtube configuration
            } as any)
        ).rejects.toThrow(/YouTube configuration is required/);
    });

    it('should reject empty platforms array', async () => {
        if (!workspaceId) return;

        await expect(
            client.publish({
                workspaceId: workspaceId,
                video: 'https://example.com/video.mp4',
                platforms: [],  // ❌ Empty
                youtube: { title: 'Test', description: 'Test', tags: [] }
            })
        ).rejects.toThrow(/At least one platform must be specified/);
    });

    it('should handle scheduled publishing', async () => {
        if (!workspaceId) return;

        const futureDate = new Date();
        futureDate.setHours(futureDate.getHours() + 1);

        const result = await client.publish({
            workspaceId: workspaceId,
            video: 'https://example.com/video.mp4',
            platforms: ['youtube'],
            youtube: { title: 'Scheduled', description: 'Test', tags: [] },
            schedule: futureDate
        });

        expect(result._id).toBeDefined();
        createdResources.tasks.push(result._id);
    });
});
```

### Priority 4: Add Optional Parameter Tests

```typescript
describe('OPTIONAL PARAMETERS', () => {
    it('should create task with tag and refId', async () => {
        if (!workspaceId) return;

        const result = await client.publish({
            workspaceId: workspaceId,
            video: 'https://example.com/video.mp4',
            platforms: ['youtube'],
            youtube: { title: 'Tagged', description: 'Test', tags: [] },
            tag: 'campaign-2024',
            refId: 'TASK-' + Date.now()
        });

        expect(result._id).toBeDefined();
        createdResources.tasks.push(result._id);
    });

    it('should filter list by tag', async () => {
        const result = await client.list({
            tag: 'campaign-2024'
        });

        expect(result.items).toBeInstanceOf(Array);
    });

    it('should filter list by refId', async () => {
        const result = await client.list({
            refId: 'TASK-123'
        });

        expect(result.items).toBeInstanceOf(Array);
    });
});
```

---

## 📝 **Conclusion**

### Summary of Findings:

1. **🔴 CRITICAL:** Tests call `get()` and `delete()` methods that don't exist
2. **🔴 CRITICAL:** Helper functions have swapped file paths
3. **🟡 MEDIUM:** Helper functions defined but not used
4. **🟡 MEDIUM:** Tests call private methods directly
5. **🟡 MEDIUM:** Missing required `tags` field in YouTube tests
6. **🟡 MEDIUM:** Only 30% overall coverage
7. **✅ GOOD:** File upload logic works correctly
8. **✅ GOOD:** Platform-specific publishing tested

### Overall Assessment:

The tests have **critical issues** that will cause failures:
- **Non-existent methods** being called
- **Incorrect file paths** in helpers
- **Unused helper functions** causing code duplication
- **Very low coverage** (30%) of available functionality
- **No error scenario testing**
- **No edge case testing**

**Immediate Actions Required:**
1. Remove `get()` and `delete()` test cases (methods don't exist)
2. Fix helper function file paths
3. Use helper functions consistently throughout tests
4. Add missing `tags` field to YouTube tests
5. Test the public `publish()` method instead of private methods
6. Expand coverage to at least 70%

**Recommendation:** This test suite needs significant refactoring before it can be considered reliable.
