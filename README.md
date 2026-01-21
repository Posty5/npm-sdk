# Posty5 SDK

Official TypeScript/JavaScript SDK for the Posty5 API - A comprehensive toolkit for URL shortening, QR code generation, HTML hosting, and social media publishing.

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

## 📦 Packages

This monorepo contains the following packages:

| Package                                                                       | Description                       | Version | NPM                                                |
| ----------------------------------------------------------------------------- | --------------------------------- | ------- | -------------------------------------------------- |
| [@posty5/core](./posty5-core)                                                 | Core HTTP client and utilities    | 1.0.2   | `npm install @posty5/core`                         |
| [@posty5/short-link](./posty5-short-link)                                     | URL shortener client              | 1.0.2   | `npm install @posty5/short-link`                   |
| [@posty5/qr-code](./posty5-qr-code)                                           | QR code generator client          | 1.0.2   | `npm install @posty5/qr-code`                      |
| [@posty5/html-hosting](./posty5-html-hosting)                                 | HTML hosting client               | 1.0.2   | `npm install @posty5/html-hosting`                 |
| [@posty5/html-hosting-variables](./posty5-html-hosting-variables)             | HTML hosting variables client     | 1.0.2   | `npm install @posty5/html-hosting-variables`       |
| [@posty5/html-hosting-form-submission](./posty5-html-hosting-form-submission) | Form submission client            | 1.0.2   | `npm install @posty5/html-hosting-form-submission` |
| [@posty5/social-publisher-workspace](./posty5-social-publisher-workspace)     | Social publisher workspace client | 1.0.2   | `npm install @posty5/social-publisher-workspace`   |
| [@posty5/social-publisher-task](./posty5-social-publisher-task)               | Social publisher task client      | 1.0.2   | `npm install @posty5/social-publisher-task`        |

---

## 🚀 Quick Start

### Installation

```bash
# Install core package (required for all other packages)
npm install @posty5/core

# Install specific tool packages you need
npm install @posty5/short-link
npm install @posty5/qr-code
npm install @posty5/html-hosting
npm install @posty5/social-publisher-workspace
npm install @posty5/social-publisher-task
```

### Basic Setup

```typescript
import { HttpClient } from "@posty5/core";
import { ShortLinkClient } from "@posty5/short-link";

// Initialize the HTTP client with your API key
const httpClient = new HttpClient({
  apiKey: "your-api-key", // Get from studio.posty5.com/account/settings?tab=APIKeys
  debug: true, // Optional: Enable debug logging
});

// Create a tool client
const shortLinks = new ShortLinkClient(httpClient);

// Use the client
const link = await shortLinks.create({
  name: "My Campaign Link",
  baseUrl: "https://example.com/campaign",
  tag: "marketing", // Optional: Organize with tags
  refId: "campaign-2024-01", // Optional: Link to your system
});

console.log("Short URL:", link.shorterLink);
```

---

## 📚 Package Documentation

### [@posty5/core](./posty5-core) - Core HTTP Client

**Foundation package for the entire Posty5 SDK ecosystem.**

The core package provides the HTTP client, authentication management, error handling, and file upload utilities that power all other Posty5 SDK modules. It's designed to work seamlessly with all tool packages.

**Key Features:**

- Axios-based HTTP client with built-in retry logic
- API key authentication and request management
- Typed error classes for robust error handling (AuthenticationError, ValidationError, NotFoundError, etc.)
- File upload utilities for Cloudflare R2 with progress tracking
- Full TypeScript support with comprehensive type definitions
- Dual module support (ESM and CommonJS)

**Note:** This package is NOT designed to work standalone. It serves as the foundation dependency for all other Posty5 SDK packages. Install specific tool packages (like `@posty5/short-link` or `@posty5/qr-code`) which automatically include this as a dependency.

**Documentation:** [View Full Documentation](./posty5-core/README.md)

---

### [@posty5/short-link](./posty5-short-link) - URL Shortener

**Create and manage branded short links with analytics tracking, custom slugs, and QR code generation.**

Transform long URLs into short, memorable links perfect for social media, marketing campaigns, and tracking. Each short link includes automatic QR code generation, customizable landing pages, and comprehensive analytics.

**Key Features:**

- Create branded short links with custom slugs
- Automatic QR code generation for every link
- Edit destination URLs without changing the short link
- Analytics tracking (clicks, visitors, last visit dates)
- Custom landing pages with titles and descriptions
- Monetization options (partner earnings)
- Template support for QR code customization
- Tag and reference ID support for organization
- Advanced filtering and pagination

**Use Cases:**

- Social media link sharing
- Marketing campaign tracking
- Affiliate marketing
- Email marketing campaigns
- Print materials with QR codes
- Product packaging links

**Methods:** `create()`, `get()`, `list()`, `update()`, `delete()`

**Documentation:** [View Full Documentation](./posty5-short-link/README.md)

---

### [@posty5/qr-code](./posty5-qr-code) - QR Code Generator

**Generate and manage customizable QR codes for multiple use cases including URLs, WiFi, email, SMS, phone calls, and more.**

Create professional QR codes with template support, analytics tracking, and dynamic content management. Supports 7 different QR code types, each with specific update methods and configuration options.

**Key Features:**

- **7 QR Code Types:** URL, Free Text, Email, WiFi, SMS, Phone Call, Geolocation
- Professional template support for branded QR codes
- Dynamic QR codes (update content without changing the code)
- Analytics tracking (scans, visitor counts, timestamps)
- Custom landing pages for each QR code
- Automatic short link generation
- Separate update methods for each QR type
- Tag and reference ID support
- Advanced filtering and search

**Use Cases:**

- Restaurant digital menus
- WiFi credential sharing
- Business card contact information
- Event check-ins and tickets
- Product information and authentication
- Location-based services
- Marketing campaigns
- Contactless payments

**Methods:** `createURL()`, `createFreeText()`, `createEmail()`, `createWifi()`, `createCall()`, `createSMS()`, `createGeolocation()`, `updateURL()`, `updateFreeText()`, `updateEmail()`, `updateWifi()`, `updateCall()`, `updateSMS()`, `updateGeolocation()`, `get()`, `list()`, `delete()`

**Documentation:** [View Full Documentation](./posty5-qr-code/README.md)

---

### [@posty5/html-hosting](./posty5-html-hosting) - Static HTML Hosting

**Deploy and manage static HTML pages with GitHub integration, form submission tracking, monetization, and analytics.**

Host landing pages, product pages, portfolios, and any static HTML content with professional features. Supports both direct file upload and GitHub repository integration for automated deployments.

**Key Features:**

- **Two Deployment Methods:** Direct file upload or GitHub repository integration
- High-performance global CDN delivery with caching
- HTTPS enabled with 24/7 security monitoring
- Form submission tracking with Google Sheets integration
- Analytics and visitor tracking
- Monetization through embedded advertisements
- Dynamic variables support (inject real-time data)
- Custom slugs for branded URLs
- Tag and reference ID support

**Use Cases:**

- Landing pages for marketing campaigns
- Product showcase pages
- Portfolio and resume hosting
- Event registration pages
- Lead capture forms
- Documentation sites
- Promotional microsites
- Coming soon pages

**Methods:** `createWithFile()`, `createWithGithubFile()`, `get()`, `list()`, `update()`, `delete()`

**Documentation:** [View Full Documentation](./posty5-html-hosting/README.md)

---

### [@posty5/html-hosting-variables](./posty5-html-hosting-variables) - Dynamic Variables

**Manage dynamic variables for HTML pages with centralized configuration and real-time content injection.**

Store and manage key-value variables that can be injected into any hosted HTML page using `{{variable_key}}` syntax. Perfect for configuration management, multi-language content, A/B testing, and feature flags.

**Key Features:**

- Key-value storage for dynamic content
- Real-time updates (changes reflect immediately on pages)
- Variable injection via `{{key}}` syntax in HTML
- Automatic `pst5_` prefix validation for namespace consistency
- Tag and reference ID support for organization
- Advanced filtering by name, key, value, tag, or refId
- Complete CRUD operations
- API key scoping for multi-tenant applications

**Use Cases:**

- Configuration management (API keys, URLs)
- Multi-language content management
- A/B testing and feature flags
- Dynamic announcements and promotions
- Environment-specific variables (dev/staging/prod)
- Centralized content updates
- Template placeholder replacement

**Methods:** `create()`, `get()`, `list()`, `update()`, `delete()`

**Documentation:** [View Full Documentation](./posty5-html-hosting-variables/README.md)

---

### [@posty5/html-hosting-form-submission](./posty5-html-hosting-form-submission) - Form Submissions

**Track, manage, and process form submissions from hosted HTML pages with status workflows and Google Sheets integration.**

Automatically capture and manage form submissions with a complete status workflow system. Includes 11 customizable status types, complete audit trails, and automatic Google Sheets synchronization.

**Key Features:**

- Automatic form submission capture from hosted pages
- 11 status types with customizable workflows (New, In Progress, Completed, etc.)
- Complete status history with timestamps and notes
- Google Sheets auto-sync for data analysis
- Advanced filtering by page, form, status, and custom fields
- Navigation between submissions (previous/next)
- Visitor session tracking
- Unique sequential numbering
- Tag and reference ID support

**Status Types:** New, In Progress, Completed, Pending, On Hold, Cancelled, Rejected, Approved, Archived, Spam, Follow Up

**Use Cases:**

- Lead capture and management
- Contact form processing
- Customer support ticket tracking
- Survey and feedback collection
- Event registration management
- Job application processing
- Order form handling
- Newsletter signups

**Methods:** `get()`, `list()`, `getNextPrevious()`, `delete()`

**Documentation:** [View Full Documentation](./posty5-html-hosting-form-submission/README.md)

---

### [@posty5/social-publisher-workspace](./posty5-social-publisher-workspace) - Workspace Management

**Create and manage social media publishing workspaces that group your connected accounts for multi-platform content distribution.**

Organize your social media accounts into workspaces (organizations) for different brands, clients, or campaigns. Each workspace can contain accounts from YouTube, Facebook, Instagram, and TikTok.

**Key Features:**

- Create workspaces with custom names, descriptions, and logos
- Group multiple platform accounts (YouTube, Facebook, Instagram, TikTok)
- View connected account details and authentication status
- Logo upload with automatic image optimization
- List and search with pagination
- Tag and reference ID support for organization
- Update workspace details and logos
- API key scoping for multi-tenant applications

**Use Cases:**

- Multi-client social media management
- Brand-specific content distribution
- Team collaboration and organization
- Campaign-based account grouping
- Agency client management
- Multi-brand businesses

**Methods:** `create()`, `get()`, `list()`, `update()`, `delete()`

**Documentation:** [View Full Documentation](./posty5-social-publisher-workspace/README.md)

---

### [@posty5/social-publisher-task](./posty5-social-publisher-task) - Social Media Publishing

**Publish short-form videos to YouTube Shorts, TikTok, Facebook Reels, and Instagram Reels with a unified API.**

Create publishing tasks that automatically distribute your video content across multiple social media platforms with platform-specific configuration, scheduling, and status tracking.

**Key Features:**

- **Multi-Platform Publishing:** YouTube Shorts, TikTok, Facebook Reels, Instagram Reels
- **Flexible Video Sources:** Upload files, provide URLs, or repost from other platforms
- Auto-detection of video source type (File, URL, Facebook, TikTok, YouTube)
- Smart thumbnail handling (upload files or provide URLs)
- Platform-specific configuration (titles, descriptions, captions, tags, privacy)
- Schedule publishing or publish immediately
- Task status tracking with platform-specific progress
- Content repurposing (repost from other platforms)
- Tag and reference ID support
- Advanced filtering and pagination

**Supported Platforms:**

- YouTube Shorts (with custom thumbnails)
- TikTok
- Facebook Reels
- Instagram Reels

**Use Cases:**

- Multi-platform content distribution
- Automated social media posting
- Content repurposing and reposting
- Campaign video distribution
- Scheduled video publishing
- Viral content sharing across platforms

**Methods:** `publishShortVideo()`, `list()`, `getStatus()`, `getDefaultSettings()`, `getNextAndPrevious()`

**Documentation:** [View Full Documentation](./posty5-social-publisher-task/README.md)

---

## 🏷️ Tag and RefId Features

All SDK packages support two powerful fields for organizing and tracking your resources:

### Tag Field

Use tags to categorize and organize your resources for filtering and grouping:

- **Marketing Campaigns:** `"summer-sale"`, `"black-friday-2024"`
- **Client Projects:** `"client-acme"`, `"client-techcorp"`
- **Content Types:** `"blog-posts"`, `"product-pages"`, `"landing-pages"`
- **Environments:** `"production"`, `"staging"`, `"development"`
- **Teams:** `"marketing-team"`, `"sales-team"`

**Example:**

```typescript
// Create resource with tag
await shortLinks.create({
  name: "Summer Sale Link",
  baseUrl: "https://example.com/summer-sale",
  tag: "summer-campaign-2024",
});

// Filter by tag
const campaignLinks = await shortLinks.list(
  {
    tag: "summer-campaign-2024",
  },
  { page: 1, pageSize: 20 },
);
```

---

### RefId Field

Use `refId` to link Posty5 resources with your external system's identifiers:

- **Order IDs:** `"order-12345"`
- **User IDs:** `"user-abc-123"`
- **Campaign IDs:** `"campaign-q1-2024"`
- **Product SKUs:** `"SKU-WIDGET-001"`
- **Ticket Numbers:** `"TICKET-789"`

**Example:**

```typescript
// Create resource with your system's ID
await workspaces.create({
  name: "Client Workspace",
  description: "Social media workspace for ACME Corp",
  refId: "client-acme-ws-001", // Your client system ID
});

// Find by your reference ID
const workspace = await workspaces.list(
  {
    refId: "client-acme-ws-001",
  },
  { page: 1, pageSize: 1 },
);
```

---

### Combined Usage

Combine tags and refIds for powerful organization and cross-system tracking:

```typescript
// Create resource with both tag and refId
await tasks.publishShortVideo({
  workspaceId: "workspace-123",
  video: videoFile,
  platforms: ["youtube", "tiktok"],
  youtube: { title: "Product Launch", description: "New product", tags: [] },
  tiktok: { caption: "Check this out!", privacy_level: "public", disable_duet: false, disable_stitch: false, disable_comment: false },
  tag: "product-launch-2024", // Campaign tag
  refId: "product-001-video-1", // Your product/video ID
});

// Filter by both
const productVideos = await tasks.list(
  {
    tag: "product-launch-2024",
    refId: "product-001-video-1",
  },
  { page: 1, pageSize: 10 },
);
```

---

## 🔑 API Key Filtering

All resources are automatically associated with the API key used to create them. Filter resources by API key for:

- **Multi-tenant Applications:** Separate resources per tenant/customer
- **Environment Separation:** Different keys for dev/staging/production
- **Resource Usage Tracking:** Monitor which API key created what
- **Team Separation:** Different keys for different teams

**Example:**

```typescript
const resources = await shortLinks.list(
  {
    apiKeyId: "your-api-key-id",
  },
  { page: 1, pageSize: 50 },
);
```

---

## 🔍 Pagination and Filtering

All `list()` methods support comprehensive pagination and filtering:

```typescript
// Basic pagination
const results = await client.list(
  {},
  {
    page: 1,
    pageSize: 20,
  },
);

// Advanced filtering
const filtered = await client.list(
  {
    name: "search term", // Search in name/title
    tag: "marketing", // Filter by tag
    refId: "campaign-123", // Filter by your reference ID
    apiKeyId: "key-id", // Filter by API key
    // ... package-specific filters
  },
  {
    page: 2,
    pageSize: 50,
  },
);

console.log(`Total: ${filtered.pagination.totalCount}`);
console.log(`Pages: ${filtered.pagination.totalPages}`);
console.log(`Current Page: ${filtered.pagination.page}`);
```

---

## 💻 Node.js Compatibility

- **Node.js:** >= 16.0.0
- **Module Systems:** ESM and CommonJS
- **TypeScript:** Full type definitions included

---

## 📖 Resources

- **Website:** [https://posty5.com](https://posty5.com)
- **Dashboard:** [https://studio.posty5.com](https://studio.posty5.com)
- **API Documentation:** [https://docs.posty5.com](https://docs.posty5.com)
- **Guide:** [https://guide.posty5.com](https://guide.posty5.com)
- **API Keys:** [Get your API key](https://studio.posty5.com/account/settings?tab=APIKeys)
- **GitHub:** [https://github.com/Posty5/npm-sdk](https://github.com/Posty5/npm-sdk)
- **Support:** [https://posty5.com/contact-us](https://posty5.com/contact-us)

---

## 🆘 Support

We're here to help you succeed with Posty5!

### Get Help

- **Documentation:** [https://guide.posty5.com](https://guide.posty5.com)
- **Contact Us:** [https://posty5.com/contact-us](https://posty5.com/contact-us)
- **GitHub Issues:** [Report bugs or request features](https://github.com/Posty5/npm-sdk/issues)
- **API Status:** Check API status and uptime at [https://status.posty5.com](https://status.posty5.com)

### Common Issues

1. **Authentication Errors**
   - Ensure your API key is valid and active
   - Get your API key from [studio.posty5.com/account/settings?tab=APIKeys](https://studio.posty5.com/account/settings?tab=APIKeys)

2. **Network Errors**
   - Check your internet connection
   - Verify firewall settings allow connections to `api.posty5.com`

3. **Rate Limiting**
   - The SDK includes automatic retry logic
   - Check your API plan limits in the dashboard

---

## 🛠️ Development

### Build All Packages

```bash
npm run build:all
```

### Clean Build Artifacts

```bash
npm run clean
```

### Run Tests

```bash
npm test
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Submit a pull request

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

---

Made with ❤️ by the Posty5 team
