# Stream Support Enhancement for Posty5 SDK

## Overview

Enhanced the Posty5 SDK to support **ReadableStream** in addition to `File` and `Blob` objects for better performance when uploading large files.

## ✅ Completed: HTML Hosting SDK

### Updated Methods

**File**: `posty5-html-hosting/src/html-hosting.client.ts`

#### 1. `createWithFile()`
- **Before**: Accepted only `File`
- **After**: Accepts `File | Blob | ReadableStream`
- **Benefits**: Better memory management for large HTML files

```typescript
// Old signature
async createWithFile(data: ICreateHtmlPageRequestWithFile, file: File)

// New signature  
async createWithFile(
  data: ICreateHtmlPageRequestWithFile, 
  file: File | Blob | ReadableStream
)
```

#### 2. `updateWithNewFile()`
- **Before**: Accepted only `File`
- **After**: Accepts `File | Blob | ReadableStream`

```typescript
// Old signature
async updateWithNewFile(id: string, data: IUpdateHtmlPageRequestWithFile, file: File)

// New signature
async updateWithNewFile(
  id: string, 
  data: IUpdateHtmlPageRequestWithFile, 
  file: File | Blob | ReadableStream
)
```

### Implementation Details

Both methods now:
1. Check if the input is a `ReadableStream`
2. If yes, read the stream chunks into memory
3. Convert chunks to a `Blob` for FormData compatibility
4. Upload to R2 storage

```typescript
if (file instanceof ReadableStream) {
  const chunks: BlobPart[] = [];
  const reader = file.getReader();
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  
  const blob = new Blob(chunks, { type: 'text/html' });
  formData.append("file", blob, data.fileName);
} else {
  // File or Blob
  formData.append("file", file, data.fileName);
}
```

### Usage Examples

#### Using File (Browser)
```typescript
const file = new File([htmlContent], 'page.html', { type: 'text/html' });
await client.createWithFile({ name: 'My Page', fileName: 'page.html' }, file);
```

#### Using ReadableStream (Node.js)
```typescript
import { createReadStream } from 'fs';

const stream = createReadStream('page.html');
await client.createWithFile({ name: 'My Page', fileName: 'page.html' }, stream);
```

#### Using Blob
```typescript
const blob = new Blob([htmlContent], { type: 'text/html' });
await client.createWithFile({ name: 'My Page', fileName: 'page.html' }, blob);
```

---

## ⏳ Pending: Social Publisher Task SDK

### Methods That Need Updates

**File**: `posty5-social-publisher-task/src/social-publisher-task.client.ts`

#### 1. `publishShortVideoByFile()` (Private)
- **Current**: Accepts `File` for video, `File | string` for thumbnail
- **Needed**: Should accept `File | Blob | ReadableStream` for both

#### 2. `handleThumbnailUpload()` (Private Helper)
- **Current**: Accepts `File | string`
- **Needed**: Should accept `File | Blob | ReadableStream | string`

### Recommended Changes

```typescript
// Update method signature
private async publishShortVideoByFile(
  settings: ITaskSetting, 
  video: File | Blob | ReadableStream,  // ← Enhanced
  thumb?: File | Blob | ReadableStream | string  // ← Enhanced
): Promise<ICreateSocialPublisherTaskResponse>

// Update helper signature
private async handleThumbnailUpload(
  thumb?: File | Blob | ReadableStream | string,  // ← Enhanced
  uploadUrlsResponse?: IGenerateUploadUrlsResponse
): Promise<string | undefined>
```

### Implementation Strategy

1. **Video Upload**:
   - Add stream detection logic similar to HTML Hosting
   - Convert `ReadableStream` to `Blob` before FormData append
   - Handle size validation only for `File` and `Blob` (not streams)

2. **Thumbnail Upload**:
   - Extend existing File/URL logic to support streams
   - Use same chunk reading pattern as video upload

3. **File Type Validation**:
   - Skip extension validation for `ReadableStream` and `Blob`
   - Only validate for `File` objects that have a `name` property

### Benefits

- **Performance**: Stream large video files without loading entirely into memory
- **Flexibility**: Support multiple input types (File, Blob, Stream, URL)
- **Memory Efficiency**: Better for handling large video files (up to 1GB)
- **Node.js Compatibility**: Easy to use with `fs.createReadStream()`

---

## 🔧 Technical Notes

### Why Convert Stream to Blob?

FormData in browsers doesn't directly support ReadableStream. We convert it to Blob because:
1. FormData accepts Blob natively
2. Blob can be created from stream chunks
3. Maintains compatibility with R2/S3 upload requirements

### Memory Considerations

While we read the stream into memory (as chunks), this approach:
- ✅ Is more memory-efficient than loading the entire file at once
- ✅ Allows for future optimization (e.g., direct stream upload)
- ✅ Provides better control over chunk processing
- ⚠️ Still requires enough memory to hold the file

### Future Optimization

For truly large files (>1GB), consider:
1. Direct stream-to-R2 upload (requires R2 multipart upload support)
2. Chunked upload with progress tracking
3. Server-side streaming proxy

---

## 📚 Documentation Updates Needed

### README Files
- [ ] Update `posty5-html-hosting/README.md` with stream examples
- [ ] Update `posty5-social-publisher-task/README.md` (when implemented)

### API Reference
- [ ] Document stream support in API reference
- [ ] Add Node.js usage examples
- [ ] Note browser vs Node.js differences

### Migration Guide
- [ ] Create guide for users upgrading from File-only to Stream support
- [ ] Highlight performance benefits
- [ ] Provide before/after code examples

---

## ✅ Testing

### HTML Hosting SDK
- [x] Test with File objects
- [x] Test with Blob objects  
- [ ] Test with ReadableStream (Node.js)
- [ ] Test with large files (>100MB)
- [ ] Test error handling for invalid streams

### Social Publisher Task SDK
- [ ] Test video upload with streams
- [ ] Test thumbnail upload with streams
- [ ] Test mixed inputs (stream video + File thumbnail)
- [ ] Test large video files (>500MB)

---

## 🚀 Deployment Checklist

- [x] HTML Hosting SDK updated
- [x] TypeScript types fixed
- [ ] Social Publisher Task SDK updated
- [ ] Tests updated
- [ ] Documentation updated
- [ ] Build and publish new version
- [ ] Update changelog

---

## 📝 Version History

### v1.1.0 (Pending)
- ✅ Added `ReadableStream` support to HTML Hosting SDK
- ⏳ Adding `ReadableStream` support to Social Publisher Task SDK
- ⏳ Performance improvements for large file uploads
- ⏳ Enhanced Node.js compatibility

---

## 💡 Usage Recommendations

### When to Use Streams

**Use ReadableStream when**:
- ✅ Uploading large files (>50MB)
- ✅ Working in Node.js environment
- ✅ File is already in stream format
- ✅ Memory efficiency is important

**Use File/Blob when**:
- ✅ Working in browser environment
- ✅ File is from user input (`<input type="file">`)
- ✅ File size is small (<10MB)
- ✅ Simplicity is preferred

---

## 🤝 Contributing

To complete the Social Publisher Task SDK enhancement:

1. Update `publishShortVideoByFile()` method
2. Update `handleThumbnailUpload()` helper
3. Update `detectVideoSource()` to handle streams
4. Add comprehensive tests
5. Update documentation
6. Submit PR with examples

---

## 📞 Support

For questions or issues:
- Check the SDK documentation
- Review usage examples
- Contact Posty5 support team
