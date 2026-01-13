# R2 Upload Utility

The `@posty5/core` package includes utilities for uploading files to Cloudflare R2 storage using presigned URLs.

## Installation

```bash
npm install @posty5/core
```

## Usage

### Basic Upload

```typescript
import { uploadToR2 } from '@posty5/core';

// Get presigned URL from your API
const presignedUrl = await getPresignedUrl(); // Your API call

// Upload file
const file = document.querySelector('input[type="file"]').files[0];
const url = await uploadToR2(presignedUrl, file);

console.log('File uploaded to:', url);
```

### Upload with Progress Tracking

```typescript
import { uploadToR2 } from '@posty5/core';

const url = await uploadToR2(presignedUrl, file, {
  contentType: 'image/jpeg',
  onProgress: (progress) => {
    console.log(`Upload progress: ${progress}%`);
    // Update your UI progress bar
    progressBar.style.width = `${progress}%`;
  },
  onStart: () => {
    console.log('Upload started');
    showSpinner();
  },
  onSuccess: (url) => {
    console.log('Upload successful:', url);
    showSuccessMessage();
  },
  onError: (error) => {
    console.error('Upload failed:', error);
    showErrorMessage(error.message);
  },
  onComplete: () => {
    console.log('Upload finished');
    hideSpinner();
  }
});
```

### Upload with Result Object

```typescript
import { uploadToR2WithResult } from '@posty5/core';

const result = await uploadToR2WithResult(presignedUrl, file, {
  onProgress: (progress) => console.log(`${progress}%`)
});

if (result.success) {
  console.log('File uploaded to:', result.url);
} else {
  console.error('Upload failed');
}
```

### Upload Blob

```typescript
import { uploadToR2 } from '@posty5/core';

// Create a blob from canvas
const canvas = document.querySelector('canvas');
canvas.toBlob(async (blob) => {
  const url = await uploadToR2(presignedUrl, blob, {
    contentType: 'image/png'
  });
  console.log('Canvas uploaded to:', url);
});
```

## API Reference

### `uploadToR2(presignedUrl, fileOrBlob, options?)`

Upload a file or blob to Cloudflare R2 using a presigned URL.

**Parameters:**

- `presignedUrl` (string): The presigned URL obtained from the API
- `fileOrBlob` (File | Blob): The file or blob to upload
- `options` (IUploadOptions, optional): Upload configuration options

**Returns:** `Promise<string>` - The final URL of the uploaded file (without query parameters)

**Throws:** Error if upload fails

### `uploadToR2WithResult(presignedUrl, fileOrBlob, options?)`

Upload a file or blob with a detailed result object.

**Parameters:**

- `presignedUrl` (string): The presigned URL obtained from the API
- `fileOrBlob` (File | Blob): The file or blob to upload
- `options` (IUploadOptions, optional): Upload configuration options

**Returns:** `Promise<IUploadResult>` - Object containing `url` and `success` status

### `IUploadOptions`

Configuration options for file upload.

```typescript
interface IUploadOptions {
  /** Content type of the file (e.g., 'image/png', 'video/mp4') */
  contentType?: string;
  
  /** Callback function to track upload progress (0-100) */
  onProgress?: (progress: number) => void;
  
  /** Callback function called when upload starts */
  onStart?: () => void;
  
  /** Callback function called when upload completes successfully */
  onSuccess?: (url: string) => void;
  
  /** Callback function called when upload fails */
  onError?: (error: Error) => void;
  
  /** Callback function called when upload finishes (success or failure) */
  onComplete?: () => void;
}
```

### `IUploadResult`

Result of a file upload operation.

```typescript
interface IUploadResult {
  /** The final URL of the uploaded file (without query parameters) */
  url: string;
  
  /** Whether the upload was successful */
  success: boolean;
}
```

## Examples

### React Component Example

```typescript
import React, { useState } from 'react';
import { uploadToR2 } from '@posty5/core';

function FileUploader() {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Get presigned URL from your API
      const presignedUrl = await getPresignedUrl(file.name);

      // Upload file
      const url = await uploadToR2(presignedUrl, file, {
        onProgress: setProgress,
        onStart: () => setUploading(true),
        onComplete: () => setUploading(false),
        onSuccess: setUploadedUrl
      });

      console.log('Upload complete:', url);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileUpload} disabled={uploading} />
      {uploading && (
        <div>
          <progress value={progress} max="100" />
          <span>{progress}%</span>
        </div>
      )}
      {uploadedUrl && <img src={uploadedUrl} alt="Uploaded" />}
    </div>
  );
}
```

### Angular Service Example

```typescript
import { Injectable } from '@angular/core';
import { uploadToR2 } from '@posty5/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UploadService {
  public uploadProgress$ = new BehaviorSubject<number>(0);
  public isUploading$ = new BehaviorSubject<boolean>(false);

  async uploadFile(presignedUrl: string, file: File): Promise<string> {
    try {
      const url = await uploadToR2(presignedUrl, file, {
        onProgress: (progress) => this.uploadProgress$.next(progress),
        onStart: () => this.isUploading$.next(true),
        onComplete: () => this.isUploading$.next(false)
      });

      return url;
    } catch (error) {
      this.isUploading$.next(false);
      this.uploadProgress$.next(0);
      throw error;
    }
  }
}
```

### Vue Composition API Example

```typescript
import { ref } from 'vue';
import { uploadToR2 } from '@posty5/core';

export function useFileUpload() {
  const progress = ref(0);
  const uploading = ref(false);
  const uploadedUrl = ref('');
  const error = ref<Error | null>(null);

  const uploadFile = async (presignedUrl: string, file: File) => {
    error.value = null;
    
    try {
      const url = await uploadToR2(presignedUrl, file, {
        onProgress: (p) => progress.value = p,
        onStart: () => uploading.value = true,
        onComplete: () => uploading.value = false,
        onSuccess: (url) => uploadedUrl.value = url,
        onError: (err) => error.value = err
      });

      return url;
    } catch (err) {
      error.value = err as Error;
      throw err;
    }
  };

  return {
    progress,
    uploading,
    uploadedUrl,
    error,
    uploadFile
  };
}
```

## Error Handling

The upload utility throws errors when uploads fail. Always wrap your upload calls in try-catch blocks:

```typescript
try {
  const url = await uploadToR2(presignedUrl, file);
  console.log('Success:', url);
} catch (error) {
  console.error('Upload failed:', error);
  // Handle error appropriately
}
```

You can also use the `onError` callback for error handling:

```typescript
await uploadToR2(presignedUrl, file, {
  onError: (error) => {
    // Handle error
    alert(`Upload failed: ${error.message}`);
  }
});
```

## Browser Compatibility

The upload utility uses `XMLHttpRequest` which is supported in all modern browsers:

- Chrome/Edge: ✅
- Firefox: ✅
- Safari: ✅
- Opera: ✅

## License

MIT
