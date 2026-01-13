# Quick Reference: R2 Upload Utility

## Import

```typescript
import { uploadToR2, uploadToR2WithResult, IUploadOptions, IUploadResult } from '@posty5/core';
```

## Basic Usage

```typescript
// Simple upload
const url = await uploadToR2(presignedUrl, file);

// Upload with content type
const url = await uploadToR2(presignedUrl, file, { contentType: 'image/jpeg' });
```

## With Progress Tracking

```typescript
const url = await uploadToR2(presignedUrl, file, {
  onProgress: (progress) => console.log(`${progress}%`)
});
```

## With All Callbacks

```typescript
const url = await uploadToR2(presignedUrl, file, {
  contentType: 'image/jpeg',
  onStart: () => console.log('Starting upload...'),
  onProgress: (progress) => console.log(`Progress: ${progress}%`),
  onSuccess: (url) => console.log('Success:', url),
  onError: (error) => console.error('Error:', error),
  onComplete: () => console.log('Upload finished')
});
```

## With Result Object (No Throw)

```typescript
const result = await uploadToR2WithResult(presignedUrl, file);

if (result.success) {
  console.log('Uploaded to:', result.url);
} else {
  console.log('Upload failed');
}
```

## Error Handling

```typescript
try {
  const url = await uploadToR2(presignedUrl, file);
  console.log('Success:', url);
} catch (error) {
  console.error('Failed:', error);
}
```

## TypeScript Types

```typescript
interface IUploadOptions {
  contentType?: string;
  onProgress?: (progress: number) => void;
  onStart?: () => void;
  onSuccess?: (url: string) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

interface IUploadResult {
  url: string;
  success: boolean;
}
```

## Angular Integration

```typescript
import { Injectable } from '@angular/core';
import { uploadToR2 } from '@posty5/core';

@Injectable({ providedIn: 'root' })
export class UploadService {
  async upload(presignedUrl: string, file: File) {
    return await uploadToR2(presignedUrl, file, {
      onProgress: (p) => this.progressSubject.next(p),
      onStart: () => this.loadingSubject.next(true),
      onComplete: () => this.loadingSubject.next(false)
    });
  }
}
```

## React Hook

```typescript
import { useState } from 'react';
import { uploadToR2 } from '@posty5/core';

function useUpload() {
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  const upload = async (presignedUrl: string, file: File) => {
    return await uploadToR2(presignedUrl, file, {
      onProgress: setProgress,
      onStart: () => setLoading(true),
      onComplete: () => setLoading(false)
    });
  };

  return { upload, progress, loading };
}
```

## Vue Composable

```typescript
import { ref } from 'vue';
import { uploadToR2 } from '@posty5/core';

export function useUpload() {
  const progress = ref(0);
  const loading = ref(false);

  const upload = async (presignedUrl: string, file: File) => {
    return await uploadToR2(presignedUrl, file, {
      onProgress: (p) => progress.value = p,
      onStart: () => loading.value = true,
      onComplete: () => loading.value = false
    });
  };

  return { upload, progress, loading };
}
```
