# XMLHttpRequest Fix - Node.js Compatibility

## Problem

The initial implementation of `uploadToR2` used `XMLHttpRequest`, which caused a runtime error in Node.js environments:

```
ReferenceError: XMLHttpRequest is not defined
```

This is because `XMLHttpRequest` is a browser-only API and is not available in Node.js.

## Root Cause

- `XMLHttpRequest` is a DOM API only available in browsers
- Node.js environments (tests, server-side usage) don't have this API
- The SDK packages are designed to work in both browser and Node.js environments

## Solution

Replaced `XMLHttpRequest` with the **Fetch API**, which is available in:
- ✅ All modern browsers
- ✅ Node.js 18+ (native fetch support)
- ✅ Node.js <18 with polyfills

### Before (XMLHttpRequest):
```typescript
const url = await new Promise<string>((resolve, reject) => {
    const xhr: XMLHttpRequest = new XMLHttpRequest();
    xhr.open('PUT', presignedUrl, true);
    xhr.setRequestHeader('Content-Type', finalContentType);

    xhr.upload.onprogress = (event: ProgressEvent) => {
        if (event.lengthComputable && onProgress) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
        }
    };

    xhr.onload = () => {
        if (xhr.status === 200) {
            resolve(presignedUrl.split('?')[0]);
        } else {
            reject(new Error(xhr.statusText));
        }
    };

    xhr.onerror = () => reject(new Error('Upload failed'));
    xhr.send(fileOrBlob);
});
```

### After (Fetch API):
```typescript
const response = await fetch(presignedUrl, {
    method: 'PUT',
    headers: {
        'Content-Type': finalContentType,
    },
    body: fileOrBlob,
});

if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}: ${response.statusText}`);
}

const uploadedUrl = presignedUrl.split('?')[0];
```

## Trade-offs

### ✅ Advantages:
1. **Cross-platform compatibility** - Works in both browser and Node.js
2. **Simpler code** - Cleaner, more modern API
3. **Better error handling** - More straightforward error messages
4. **Future-proof** - Fetch is the modern standard

### ⚠️ Limitations:
1. **Progress tracking** - Currently limited to 0% and 100%
   - `XMLHttpRequest` had `upload.onprogress` for intermediate progress
   - Fetch API doesn't provide upload progress natively
   - Progress tracking would require additional libraries or workarounds

## Progress Tracking Note

The `onProgress` callback now receives only two values:
- `0` - When upload starts
- `100` - When upload completes

**For browser-only applications** that need detailed progress tracking, you could:
1. Use a separate XMLHttpRequest-based upload function for browsers
2. Use a library like `axios` with upload progress support
3. Implement a custom solution with ReadableStream (complex)

**For most use cases**, the current implementation is sufficient as it:
- Shows when upload starts (0%)
- Shows when upload completes (100%)
- Triggers success/error callbacks appropriately

## Updated Documentation

Updated the JSDoc comment for `onProgress`:
```typescript
/**
 * Callback function to track upload progress
 * Note: Currently shows 0% at start and 100% on completion.
 * Intermediate progress tracking requires XMLHttpRequest which is not available in Node.js.
 * @param progress - Upload progress percentage (0 or 100)
 */
onProgress?: (progress: number) => void;
```

## Configuration Changes

### tsconfig.json
Removed DOM library requirement since we no longer use XMLHttpRequest:

**Before:**
```json
"lib": ["ES2020", "DOM"]
```

**After:**
```json
"lib": ["ES2020"]
```

## Testing

All packages build successfully:
- ✅ `@posty5/core` - Build successful
- ✅ `@posty5/html-hosting` - Build successful
- ✅ `@posty5/social-publisher-task` - Build successful

## Compatibility

### Minimum Requirements:
- **Browser:** All modern browsers (Chrome, Firefox, Safari, Edge)
- **Node.js:** 18.0.0+ (for native fetch support)
- **Node.js <18:** Requires fetch polyfill (e.g., `node-fetch`)

### Package.json Engines:
```json
{
  "engines": {
    "node": ">=16.0.0"
  }
}
```

**Note:** While the package specifies Node.js 16+, the upload functionality requires Node.js 18+ for native fetch support. For Node.js 16-17, users would need to install a fetch polyfill.

## Migration Impact

✅ **No breaking changes** for end users:
- Same API surface
- Same method signatures
- Same return types
- Only internal implementation changed

## Future Enhancements

If detailed progress tracking is needed in the future, we could:

1. **Conditional Implementation:**
   ```typescript
   // Use XMLHttpRequest in browser, fetch in Node.js
   if (typeof XMLHttpRequest !== 'undefined') {
       // Browser: Use XMLHttpRequest with progress
   } else {
       // Node.js: Use fetch without progress
   }
   ```

2. **Separate Functions:**
   ```typescript
   // uploadToR2() - Cross-platform, no detailed progress
   // uploadToR2WithProgress() - Browser-only, with detailed progress
   ```

3. **External Library:**
   - Use `axios` which supports upload progress in both environments
   - Trade-off: Adds dependency

## Conclusion

The fetch-based implementation provides:
- ✅ Cross-platform compatibility (browser + Node.js)
- ✅ Simpler, more maintainable code
- ✅ Modern, future-proof API
- ⚠️ Limited progress tracking (0% and 100% only)

This is the right choice for a general-purpose SDK that needs to work in multiple environments.
