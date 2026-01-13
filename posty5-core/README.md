# @posty5/core

Core utilities and HTTP client for the Posty5 SDK. This package provides the foundation for all other Posty5 SDK modules.

## Installation

```bash
npm install @posty5/core
```

## Features

- 🚀 **HTTP Client** - Axios-based client with automatic retry logic
- 🔐 **Authentication** - Built-in support for API key authentication
- ⚠️ **Error Handling** - Typed error classes for different scenarios
- 🔄 **Retry Logic** - Automatic retry for failed requests
- 📤 **File Upload** - Utilities for uploading files to Cloudflare R2 with progress tracking
- 📝 **TypeScript** - Full TypeScript support with type definitions
- 🎯 **Dual Module** - Supports both ESM and CommonJS

## Usage

### Basic HTTP Client

```typescript
import { HttpClient } from '@posty5/core';

// Minimal configuration (uses default baseUrl: https://api.posty5.com)
const client = new HttpClient({
  apiKey: 'your-api-key',
});

// With debug logging enabled
const debugClient = new HttpClient({
  apiKey: 'your-api-key',
  debug: true,
});

// Or with custom baseUrl
const customClient = new HttpClient({
  baseUrl: 'https://custom-api.example.com',
  apiKey: 'your-api-key',
});

// Make requests
const data = await client.get('/api/endpoint');
const result = await client.post('/api/endpoint', { key: 'value' });
```

### Update API Key

```typescript
const client = new HttpClient({
  apiKey: 'your-api-key',
  // baseUrl defaults to https://api.posty5.com
});

// Update API key later
client.setApiKey('new-api-key');
```

### Error Handling

```typescript
import {
  HttpClient,
  AuthenticationError,
  ValidationError,
  NotFoundError,
  RateLimitError,
} from '@posty5/core';

try {
  const data = await client.get('/api/endpoint');
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Authentication failed:', error.message);
  } else if (error instanceof ValidationError) {
    console.error('Validation errors:', error.errors);
  } else if (error instanceof NotFoundError) {
    console.error('Resource not found');
  } else if (error instanceof RateLimitError) {
    console.error('Rate limit exceeded, retry after:', error.retryAfter);
  }
}
```

### R2 File Upload

Upload files to Cloudflare R2 storage with progress tracking:

```typescript
import { uploadToR2 } from '@posty5/core';

// Basic upload
const url = await uploadToR2(presignedUrl, file);

// Upload with progress tracking
const url = await uploadToR2(presignedUrl, file, {
  contentType: 'image/jpeg',
  onProgress: (progress) => {
    console.log(`Upload progress: ${progress}%`);
  },
  onSuccess: (url) => {
    console.log('Upload successful:', url);
  },
  onError: (error) => {
    console.error('Upload failed:', error);
  }
});
```

For detailed documentation and examples, see [UPLOAD_UTILITY.md](./UPLOAD_UTILITY.md).

## API Reference

### HttpClient

#### Constructor Options

```typescript
interface Posty5Config {
  baseUrl?: string;  // default: 'https://api.posty5.com'
  apiKey?: string;   // Your API key from dashboard
  debug?: boolean;   // Enable debug logging (default: false)
}

// Internal settings (not configurable by users):
// - timeout: 30000ms (30 seconds)
// - maxRetries: 3
// - retryDelay: 1000ms (1 second)
```
```

#### Methods

- `get<T>(url: string, config?: RequestConfig): Promise<T>`
- `post<T>(url: string, data?: any, config?: RequestConfig): Promise<T>`
- `put<T>(url: string, data?: any, config?: RequestConfig): Promise<T>`
- `patch<T>(url: string, data?: any, config?: RequestConfig): Promise<T>`
- `delete<T>(url: string, config?: RequestConfig): Promise<T>`
- `setApiKey(apiKey: string): void`


### Error Classes

- `Posty5Error` - Base error class
- `AuthenticationError` - 401 errors
- `AuthorizationError` - 403 errors
- `ValidationError` - 400 errors with validation details
- `NotFoundError` - 404 errors
- `RateLimitError` - 429 errors with retry information
- `NetworkError` - Network and timeout errors
- `ServerError` - 5xx server errors

### Types

```typescript
// Pagination
interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface PaginationResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// API Response
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: any;
}
```

## Node.js Compatibility

- Node.js >= 16.0.0
- Supports both ESM and CommonJS

## License

MIT

## Related Packages

- [@posty5/qr-code](https://www.npmjs.com/package/@posty5/qr-code) - QR Code generation
- [@posty5/auth](https://www.npmjs.com/package/@posty5/auth) - Authentication
- [@posty5/html-hosting](https://www.npmjs.com/package/@posty5/html-hosting) - HTML hosting
- [@posty5/sdk](https://www.npmjs.com/package/@posty5/sdk) - Complete SDK
