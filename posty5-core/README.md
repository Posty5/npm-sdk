# @posty5/core

Core HTTP client and utilities for the Posty5 SDK ecosystem. This package provides the foundational infrastructure that powers all other Posty5 SDK modules.

---

## 🌟 What is Posty5?

**Posty5** is a comprehensive suite of free online tools designed to enhance your digital marketing and social media presence. With over 4+ powerful tools and counting, Posty5 provides everything you need to:

- 🔗 **Shorten URLs** - Create memorable, trackable short links
- 📱 **Generate QR Codes** - Transform URLs, WiFi credentials, contact cards, and more into scannable codes
- 🌐 **Host HTML Pages** - Deploy static HTML pages with dynamic variables and form submission handling
- 📢 **Automate Social Media** - Schedule and manage social media posts across multiple platforms
- 📊 **Track Performance** - Monitor and analyze your digital marketing efforts

Posty5 empowers businesses, marketers, and developers to streamline their online workflows—all from a unified control panel.

**Learn more:** [https://posty5.com](https://posty5.com)

---

## 📦 About This Package

`@posty5/core` is the **foundation package** for the entire Posty5 SDK ecosystem. It provides:

- **HTTP Client** - Axios-based client with built-in retry logic and error handling
- **Authentication** - API key management for secure API communication
- **Error Handling** - Typed error classes for robust error management
- **File Upload** - Utilities for uploading files to Cloudflare R2 with progress tracking
- **Type Definitions** - Full TypeScript support with comprehensive type definitions
- **Dual Module Support** - Compatible with both ESM and CommonJS

### Role in the Posty5 Ecosystem

This package serves as the **core dependency** for all Posty5 SDK modules. It handles:

- API authentication and request management
- Network communication with the Posty5 API
- Standardized error handling across all SDK packages
- File upload operations for media-rich features

---

## 📥 Installation

Install via npm:

```bash
npm install @posty5/core
```

---

## ⚠️ Important: Not a Standalone Package

**This package is NOT designed to work as a standalone solution.**

`@posty5/core` provides the foundational infrastructure and utilities that other Posty5 SDK packages depend on. While it can be used directly for low-level API interactions, it is primarily intended to be used **in combination with other Posty5 tool packages** such as:

- `@posty5/short-link` - For URL shortening
- `@posty5/qr-code` - For QR code generation
- `@posty5/html-hosting` - For HTML page hosting
- `@posty5/social-publisher-workspace` - For social media workspace management
- `@posty5/social-publisher-task` - For social media publishing

For most use cases, you should install the specific tool package you need, which will automatically include `@posty5/core` as a dependency.

---

## 🎯 Why This Package Matters

### The Value of @posty5/core

1. **Unified API Communication**
   - Provides a single, consistent HTTP client for all Posty5 SDK packages
   - Eliminates the need for each package to implement its own API communication layer

2. **Automatic Retry Logic**
   - Built-in retry mechanism for transient network failures
   - Configurable timeout and retry settings for optimal reliability

3. **Type-Safe Error Handling**
   - Strongly-typed error classes for different API scenarios
   - Makes error handling predictable and easier to debug

4. **Developer Experience**
   - Full TypeScript support with IntelliSense
   - Debug logging for troubleshooting API interactions
   - Consistent API patterns across all SDK packages

5. **Production-Ready**
   - Battle-tested HTTP client with robust error handling
   - Secure API key authentication
   - Performance-optimized file upload utilities

### When Used Correctly

When integrated with other Posty5 SDK packages, `@posty5/core` enables you to:

- Build reliable integrations with automatic error recovery
- Handle API authentication seamlessly across all tools
- Upload files (images, videos) with progress tracking
- Maintain consistent error handling throughout your application
- Leverage TypeScript for type-safe API interactions

---

## 🚀 Basic Usage

### Initialize the HTTP Client

```typescript
import { HttpClient } from "@posty5/core";

// Minimal configuration
const client = new HttpClient({
  apiKey: "your-api-key", // Get your API key from studio.posty5.com/account/settings?tab=APIKeys
});

// With debug logging enabled
const debugClient = new HttpClient({
  apiKey: "your-api-key",
  debug: true, // Enable console logging for debugging
});
```

### Error Handling

```typescript
import { HttpClient, AuthenticationError, ValidationError, NotFoundError, RateLimitError } from "@posty5/core";

try {
  const data = await client.get("/api/endpoint");
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error("Authentication failed:", error.message);
    // Handle: Invalid or missing API key
  } else if (error instanceof ValidationError) {
    console.error("Validation errors:", error.errors);
    // Handle: Invalid request data
  } else if (error instanceof NotFoundError) {
    console.error("Resource not found");
    // Handle: Resource doesn't exist
  } else if (error instanceof RateLimitError) {
    console.error("Rate limit exceeded, retry after:", error.retryAfter);
    // Handle: Too many requests
  }
}
```

## 📚 API Reference

### HttpClient

#### Constructor Options

```typescript
interface Posty5Config {
  apiKey?: string; // Your API key from dashboard
  debug?: boolean; // Enable debug logging (default: false)
}
```

### Error Classes

All errors extend the base `Posty5Error` class:

- **`AuthenticationError`** - 401 Unauthorized (invalid/missing API key)
- **`AuthorizationError`** - 403 Forbidden (insufficient permissions)
- **`ValidationError`** - 400 Bad Request (invalid request data)
- **`NotFoundError`** - 404 Not Found (resource doesn't exist)
- **`RateLimitError`** - 429 Too Many Requests (rate limit exceeded)
- **`NetworkError`** - Network failures and timeouts
- **`ServerError`** - 5xx server errors

### TypeScript Types

```typescript
// Pagination
interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
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

---

## 📦 Packages

This SDK ecosystem contains the following tool packages:

| Package | Description | Version | GitHub | NPM |
| --- | --- | --- | --- | --- |
| @posty5/short-link | URL shortener client | 1.0.2 | [📖 Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-short-link) | [📦 NPM](https://www.npmjs.com/package/@posty5/short-link) |
| @posty5/qr-code | QR code generator client | 1.0.2 | [📖 Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-qr-code) | [📦 NPM](https://www.npmjs.com/package/@posty5/qr-code) |
| @posty5/html-hosting | HTML hosting client | 1.0.2 | [📖 Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-html-hosting) | [📦 NPM](https://www.npmjs.com/package/@posty5/html-hosting) |
| @posty5/html-hosting-variables | HTML hosting variables client | 1.0.2 | [📖 Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-html-hosting-variables) | [📦 NPM](https://www.npmjs.com/package/@posty5/html-hosting-variables) |
| @posty5/html-hosting-form-submission | Form submission client | 1.0.2 | [📖 Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-html-hosting-form-submission) | [📦 NPM](https://www.npmjs.com/package/@posty5/html-hosting-form-submission) |
| @posty5/social-publisher-workspace | Social publisher workspace client | 1.0.2 | [📖 Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-social-publisher-workspace) | [📦 NPM](https://www.npmjs.com/package/@posty5/social-publisher-workspace) |
| @posty5/social-publisher-task | Social publisher task client | 1.0.2 | [📖 Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-social-publisher-task) | [📦 NPM](https://www.npmjs.com/package/@posty5/social-publisher-task) |

---

## 💻 Node.js Compatibility

- **Node.js**: >= 16.0.0
- **Module Systems**: ESM and CommonJS
- **TypeScript**: Full type definitions included

---

## 🆘 Support

We're here to help you succeed with Posty5!

### Get Help

- **Documentation**: [https://guide.posty5.com](https://guide.posty5.com)
- **Contact Us**: [https://posty5.com/contact-us](https://posty5.com/contact-us)
- **GitHub Issues**: [Report bugs or request features](https://github.com/Posty5/npm-sdk/issues)
- **API Status**: Check API status and uptime at [https://status.posty5.com](https://status.posty5.com)

### Common Issues

1. **Authentication Errors**
   - Ensure your API key is valid and active
   - Get your API key from [studio.posty5.com/account/settings?tab=APIKeys](studio.posty5.com/account/settings?tab=APIKeys)

2. **Network Errors**
   - Check your internet connection
   - Verify firewall settings allow connections to `api.posty5.com`

3. **Rate Limiting**
   - The SDK includes automatic retry logic
   - Check your API plan limits in the dashboard

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

---

## 🔗 Useful Links

- **Website**: [https://posty5.com](https://posty5.com)
- **Dashboard**: [studio.posty5.com/account/settings?tab=APIKeys](studio.posty5.com/account/settings?tab=APIKeys)
- **API Documentation**: [https://docs.posty5.com](https://docs.posty5.com)
- **GitHub**: [https://github.com/Posty5/npm-sdk](https://github.com/Posty5/npm-sdk)

---

Made with ❤️ by the Posty5 team
