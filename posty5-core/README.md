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
- 📝 **TypeScript** - Full TypeScript support with type definitions
- 🎯 **Dual Module** - Supports both ESM and CommonJS

## Usage

### Basic HTTP Client

```typescript
import { HttpClient } from '@posty5/core';

const client = new HttpClient({
  baseUrl: 'https://api.posty5.com',
  apiKey: 'your-api-key',
  timeout: 30000,
  maxRetries: 3,
});

// Make requests
const data = await client.get('/api/endpoint');
const result = await client.post('/api/endpoint', { key: 'value' });
```

### Update API Key

```typescript
const client = new HttpClient({
  baseUrl: 'https://api.posty5.com',
  apiKey: 'your-api-key',
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

## API Reference

### HttpClient

#### Constructor Options

```typescript
interface HttpClientConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number; // default: 30000ms
  maxRetries?: number; // default: 3
  retryDelay?: number; // default: 1000ms
  headers?: Record<string, string>;
  debug?: boolean;
}
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
