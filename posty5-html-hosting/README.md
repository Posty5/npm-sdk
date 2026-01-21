# @posty5/html-hosting

Deploy and manage static HTML pages with the Posty5 HTML Hosting SDK. This package provides a complete TypeScript/JavaScript client for creating, updating, and managing hosted HTML pages with features like GitHub integration, form submission tracking, monetization, and analytics.

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

`@posty5/html-hosting` is a **specialized tool package** for deploying and managing static HTML pages through the Posty5 platform. It enables developers to quickly host landing pages, product pages, portfolios, and any static HTML content with professional features.

### Key Capabilities

- **📁 File Upload Hosting** - Upload HTML files directly to high-performance cloud storage
- **🐙 GitHub Integration** - Deploy HTML files directly from GitHub repositories
- **📊 Analytics & Tracking** - Monitor page views, visitor locations, devices, and more
- **💰 Monetization** - Generate revenue through embedded advertisements
- **📝 Form Submission Tracking** - Capture and track form submissions automatically
- **🔄 Dynamic Variables** - Inject real-time data into your static pages
- **📱 Google Sheets Integration** - Auto-save form data to Google Sheets
- **⚡ High Performance** - Fast global CDN delivery with caching
- **🔒 Secure Hosting** - HTTPS enabled with 24/7 security monitoring

### Role in the Posty5 Ecosystem

This package works seamlessly with other Posty5 SDK modules:

- Use `@posty5/html-hosting-variables` to manage dynamic variables
- Use `@posty5/html-hosting-form-submission` to handle form submissions
- Use `@posty5/short-link` to create shortened URLs for your pages
- Use `@posty5/qr-code` to generate QR codes linking to your pages

Perfect for **developers**, **marketers**, **designers**, and **entrepreneurs** who need fast, reliable HTML hosting with built-in tracking and monetization capabilities.

---

## 📥 Installation

Install the package along with the required core dependency:

```bash
npm install @posty5/html-hosting @posty5/core
```

---

## 🚀 Quick Start

Here's a minimal example to get you started:

```typescript
import { HttpClient } from "@posty5/core";
import { HtmlHostingClient } from "@posty5/html-hosting";

// Initialize the HTTP client with your API key
const httpClient = new HttpClient({
  apiKey: "your-api-key", // Get from https://studio.posty5.com/account/settings?tab=APIKeys
});

// Create the HTML Hosting client
const htmlHosting = new HtmlHostingClient(httpClient);

// Create and deploy an HTML page
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>My Landing Page</title>
</head>
<body>
  <h1>Welcome to My Page!</h1>
  <p>This page is hosted on Posty5.</p>
</body>
</html>
`;

const file = new Blob([htmlContent], { type: "text/html" });

const page = await htmlHosting.createWithFile(
  {
    name: "My First Landing Page", // Page name for your dashboard
    fileName: "landing.html", // File name
  },
  file,
);

console.log("Page URL:", page.shorterLink);
console.log("Page ID:", page._id);
```

---

## 📚 API Reference & Examples

### Creating HTML Pages

#### createWithFile()

Upload an HTML file to create a hosted page.

**Parameters:**

- `data` (ICreateHtmlPageRequestWithFile): Configuration for the page
  - `name` (string): Display name for the page in your dashboard
  - `fileName` (string): Name of the HTML file
  - `customLandingId` (string, optional): Custom URL identifier
  - `isEnableMonetization` (boolean, optional): Enable ad monetization
  - `autoSaveInGoogleSheet` (boolean, optional): Auto-save form data to Google Sheets
  - `tag` (string, optional): Tag for categorization
  - `refId` (string, optional): Your custom reference ID
- `file` (File | Blob): The HTML file content

**Returns:** `Promise<IHtmlPageCreateWithFileResponse>`

- `_id` (string): Unique page ID
- `shorterLink` (string): Public URL to access the page
- `fileUrl` (string): Direct URL to the uploaded file

**Example:**

```typescript
// Basic page creation
const htmlContent = "<html><body><h1>Hello World</h1></body></html>";
const file = new Blob([htmlContent], { type: "text/html" });

const page = await htmlHosting.createWithFile(
  {
    name: "Simple Page", // Page name in dashboard
    fileName: "index.html", // File name
  },
  file,
);

console.log("Live URL:", page.shorterLink);
```

```typescript
// Page with custom URL and monetization
const page = await htmlHosting.createWithFile(
  {
    name: "Product Launch Page",
    fileName: "product.html",
    customLandingId: "product-2024", // Custom URL: posty5.com/product-2024
    isEnableMonetization: true, // Enable ads for revenue
    tag: "marketing", // Tag for organization
    refId: "campaign-spring-2024", // Your reference ID
  },
  file,
);
```

```typescript
// Page with form submission tracking
const page = await htmlHosting.createWithFile(
  {
    name: "Contact Form",
    fileName: "contact.html",
    autoSaveInGoogleSheet: true, // Auto-save form data to Google Sheets
    tag: "forms",
  },
  file,
);
```

---

#### createWithGithubFile()

Deploy an HTML file directly from a GitHub repository.

**Parameters:**

- `data` (ICreateHtmlPageRequestWithGithub): Configuration for the page
  - `name` (string): Display name for the page
  - `githubInfo` (object): GitHub file information
    - `fileURL` (string): Full GitHub file URL (e.g., `https://github.com/user/repo/blob/main/index.html`)
  - `customLandingId` (string, optional): Custom URL identifier
  - `isEnableMonetization` (boolean, optional): Enable monetization
  - `autoSaveInGoogleSheet` (boolean, optional): Auto-save form data
  - `tag` (string, optional): Tag for categorization
  - `refId` (string, optional): Your custom reference ID

**Returns:** `Promise<IHtmlPageCreateWithGithubResponse>`

- `_id` (string): Unique page ID
- `shorterLink` (string): Public URL to access the page
- `githubInfo` (object): GitHub file information

**Example:**

```typescript
// Deploy from GitHub
const page = await htmlHosting.createWithGithubFile({
  name: "Portfolio Site",
  githubInfo: {
    fileURL: "https://github.com/username/portfolio/blob/main/index.html",
  },
});

console.log("Deployed URL:", page.shorterLink);
```

```typescript
// GitHub deployment with all options
const page = await htmlHosting.createWithGithubFile({
  name: "Open Source Landing Page",
  githubInfo: {
    fileURL: "https://github.com/Netflix/netflix.github.com/blob/master/index.html",
  },
  customLandingId: "oss-project",
  isEnableMonetization: false, // No ads on this page
  tag: "open-source",
  refId: "github-deploy-001",
});
```

---

### Retrieving HTML Pages

#### get()

Retrieve details of a specific HTML page by ID.

**Parameters:**

- `id` (string): The unique page ID

**Returns:** `Promise<IHtmlPageResponse>` - Complete page details including:

- `_id` (string): Page ID
- `name` (string): Page name
- `shorterLink` (string): Public URL
- `sourceType` ('file' | 'github'): Source of the HTML
- `fileUrl` (string, optional): Uploaded file URL
- `githubInfo` (object, optional): GitHub source info
- `isEnableMonetization` (boolean): Monetization status
- `autoSaveInGoogleSheet` (boolean): Google Sheets integration status
- `tag` (string, optional): Page tag
- `refId` (string, optional): Your reference ID
- `createdAt` (string): Creation timestamp
- `updatedAt` (string): Last update timestamp

**Example:**

```typescript
const page = await htmlHosting.get("page-id-123");

console.log("Page Name:", page.name);
console.log("URL:", page.shorterLink);
console.log("Created:", new Date(page.createdAt).toLocaleDateString());

if (page.sourceType === "github") {
  console.log("GitHub URL:", page.githubInfo.fileURL);
}
```

---

#### list()

Search and filter HTML pages with pagination.

**Parameters:**

- `params` (IListParams, optional): Filter criteria
  - `name` (string, optional): Search by page name
  - `sourceType` ('file' | 'github', optional): Filter by source type
  - `tag` (string, optional): Filter by tag
  - `refId` (string, optional): Filter by reference ID
  - `isEnableMonetization` (boolean, optional): Filter by monetization status
  - `autoSaveInGoogleSheet` (boolean, optional): Filter by Google Sheets integration
  - `isTemp` (boolean, optional): Filter temporary pages
- `pagination` (IPaginationParams, optional): Pagination options
  - `page` (number, optional): Page number (default: 1)
  - `pageSize` (number, optional): Items per page (default: 10)

**Returns:** `Promise<ISearchHtmlPagesResponse>`

- `items` (array): Array of HTML pages
- `pagination` (object): Pagination metadata
  - `page` (number): Current page
  - `pageSize` (number): Items per page
  - `totalItems` (number): Total count
  - `totalPages` (number): Total pages

**Example:**

```typescript
// Get all pages with pagination
const result = await htmlHosting.list({}, { page: 1, pageSize: 20 });

console.log(`Found ${result.pagination.totalItems} pages`);
result.items.forEach((page) => {
  console.log(`- ${page.name}: ${page.shorterLink}`);
});
```

```typescript
// Search by name
const searchResult = await htmlHosting.list({ name: "landing" }, { page: 1, pageSize: 10 });
```

```typescript
// Filter by multiple criteria
const filtered = await htmlHosting.list({
  sourceType: "file", // Only uploaded files
  isEnableMonetization: true, // Only monetized pages
  tag: "marketing", // Tagged as 'marketing'
});
```

```typescript
// Get pages by your reference ID
const myPages = await htmlHosting.list({
  refId: "campaign-2024-q1",
});
```

---

#### lookup()

Get a simplified list of pages (ID and name only). Useful for dropdowns and selection lists.

**Returns:** `Promise<ILookupHtmlPagesResponse>` - Array of objects with:

- `_id` (string): Page ID
- `name` (string): Page name

**Example:**

```typescript
const pages = await htmlHosting.lookup();

// Use in a dropdown
pages.forEach((page) => {
  console.log(`<option value="${page._id}">${page.name}</option>`);
});
```

---

#### lookupForms()

Get form IDs detected in an HTML page (useful for form submission tracking).

**Parameters:**

- `id` (string): HTML page ID

**Returns:** `Promise<ILookupFormsResponse>` - Array of form information

**Example:**

```typescript
const forms = await htmlHosting.lookupForms("page-id-123");

console.log(`Found ${forms.length} forms on this page`);
forms.forEach((form) => {
  console.log(`Form ID: ${form.id}, Name: ${form.name}`);
});
```

---

### Updating HTML Pages

#### updateWithNewFile()

Update an existing page with a new HTML file.

**Parameters:**

- `id` (string): Page ID to update
- `data` (IUpdateHtmlPageRequestWithFile): Update configuration
  - `name` (string, optional): New page name
  - `fileName` (string): New file name
  - `customLandingId` (string, optional): New custom URL
  - `isEnableMonetization` (boolean, optional): Toggle monetization
  - `autoSaveInGoogleSheet` (boolean, optional): Toggle Google Sheets
  - `tag` (string, optional): New tag
  - `refId` (string, optional): New reference ID
- `file` (File | Blob): New HTML file content

**Returns:** `Promise<IHtmlPageCreateWithFileResponse>`

**Example:**

```typescript
const updatedContent = `
<!DOCTYPE html>
<html>
<head><title>Updated Page</title></head>
<body>
  <h1>Content has been updated!</h1>
  <p>Version 2.0</p>
</body>
</html>
`;

const file = new Blob([updatedContent], { type: "text/html" });

const updated = await htmlHosting.updateWithNewFile(
  "page-id-123",
  {
    name: "Updated Landing Page",
    fileName: "landing-v2.html",
  },
  file,
);

console.log("Updated URL:", updated.shorterLink);
```

---

#### updateWithGithubFile()

Update a page to use a different GitHub file or update GitHub settings.

**Parameters:**

- `id` (string): Page ID to update
- `data` (IUpdateHtmlPageRequestWithGithub): Update configuration
  - `name` (string, optional): New page name
  - `githubInfo` (object): New GitHub file information
    - `fileURL` (string): New GitHub file URL
  - `customLandingId` (string, optional): New custom URL
  - `isEnableMonetization` (boolean, optional): Toggle monetization
  - `autoSaveInGoogleSheet` (boolean, optional): Toggle Google Sheets
  - `tag` (string, optional): New tag
  - `refId` (string, optional): New reference ID

**Returns:** `Promise<IHtmlPageCreateWithGithubResponse>`

**Example:**

```typescript
const updated = await htmlHosting.updateWithGithubFile("page-id-123", {
  name: "Updated from GitHub",
  githubInfo: {
    fileURL: "https://github.com/username/repo/blob/main/updated.html",
  },
  isEnableMonetization: false, // Disable ads
});
```

---

### Page Operations

#### cleanCache()

Clear the cache for a page to force fresh content delivery. Useful after updating content.

**Parameters:**

- `id` (string): HTML page ID

**Returns:** `Promise<void>`

**Example:**

```typescript
// Clear cache after updating external content
await htmlHosting.cleanCache("page-id-123");
console.log("Cache cleared - fresh content will be served");
```

---

#### delete()

Permanently delete an HTML page.

**Parameters:**

- `id` (string): HTML page ID to delete

**Returns:** `Promise<void>`

**Example:**

```typescript
await htmlHosting.delete("page-id-123");
console.log("Page deleted successfully");
```

---

### Error Handling

All methods may throw errors from `@posty5/core`. Handle them appropriately:

```typescript
import { AuthenticationError, NotFoundError, ValidationError, RateLimitError } from "@posty5/core";

try {
  const page = await htmlHosting.get("invalid-id");
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error("Invalid API key");
  } else if (error instanceof NotFoundError) {
    console.error("Page not found");
  } else if (error instanceof ValidationError) {
    console.error("Invalid data:", error.errors);
  } else if (error instanceof RateLimitError) {
    console.error("Rate limit exceeded, retry after:", error.retryAfter);
  } else {
    console.error("Unexpected error:", error);
  }
}
```

---

## 📦 Packages

This SDK ecosystem contains the following tool packages:

| Package | Description | Version | GitHub | NPM |
| --- | --- | --- | --- | --- |
| @posty5/short-link | URL shortener client | 1.0.0 | [📖 Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-short-link) | [📦 NPM](https://www.npmjs.com/package/@posty5/short-link) |
| @posty5/qr-code | QR code generator client | 1.0.0 | [📖 Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-qr-code) | [📦 NPM](https://www.npmjs.com/package/@posty5/qr-code) |
| @posty5/html-hosting | HTML hosting client | 1.0.0 | [📖 Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-html-hosting) | [📦 NPM](https://www.npmjs.com/package/@posty5/html-hosting) |
| @posty5/html-hosting-variables | HTML hosting variables client | 1.0.0 | [📖 Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-html-hosting-variables) | [📦 NPM](https://www.npmjs.com/package/@posty5/html-hosting-variables) |
| @posty5/html-hosting-form-submission | Form submission client | 1.0.0 | [📖 Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-html-hosting-form-submission) | [📦 NPM](https://www.npmjs.com/package/@posty5/html-hosting-form-submission) |
| @posty5/social-publisher-workspace | Social publisher workspace client | 1.0.0 | [📖 Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-social-publisher-workspace) | [📦 NPM](https://www.npmjs.com/package/@posty5/social-publisher-workspace) |
| @posty5/social-publisher-task | Social publisher task client | 1.0.0 | [📖 Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-social-publisher-task) | [📦 NPM](https://www.npmjs.com/package/@posty5/social-publisher-task) |

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
