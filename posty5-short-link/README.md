# @posty5/short-link

Create and manage branded short links with analytics tracking, custom slugs, and QR code generation. This package provides a complete TypeScript/JavaScript client for building URL shortening solutions with editable destinations, comprehensive tracking, and monetization options.

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

`@posty5/short-link` is a **specialized tool package** for creating and managing URL shorteners on the Posty5 platform. It enables developers to build link management systems for marketing campaigns, social media, analytics tracking, and more.

### Key Capabilities

- **🔗 URL Shortening** - Transform long URLs into short, memorable links
- **🎨 Custom Slugs** - Create branded short links with custom aliases
- **🔄 Editable URLs** - Update destination URLs without changing the short link
- **📊 Analytics Tracking** - Monitor clicks, visitor counts, and last visitor dates
- **📱 Free QR Codes** - Automatic QR code generation for each short link
- **🏷️ Tag & Reference Support** - Organize links with custom tags and reference IDs
- **🎯 Landing Pages** - Create custom landing pages with titles and descriptions
- **💰 Monetization** - Enable partner earnings on short links
- **🔍 Advanced Filtering** - Search by name, URL, status, tag, or reference ID
- **📝 CRUD Operations** - Complete create, read, update, delete operations
- **🔐 API Key Scoping** - Multi-tenant support with API key filtering
- **📈 Pagination Support** - Efficiently handle large link collections
- **📊 Template Support** - Apply professional templates for QR code customization

### Role in the Posty5 Ecosystem

This package works seamlessly with other Posty5 SDK modules:

- Combine with `@posty5/qr-code` for enhanced QR code customization
- Use with `@posty5/html-hosting` to create short links for hosted pages
- Build comprehensive marketing campaigns with full tracking and analytics

Perfect for **marketers**, **social media managers**, **content creators**, **affiliate marketers**, **businesses**, and **developers** who need URL shortening, link tracking, campaign management, social media optimization, analytics, and branded links.

---

## 📥 Installation

Install the package along with the required core dependency:

```bash
npm install @posty5/short-link @posty5/core
```

---

## 🚀 Quick Start

Here's a minimal example to get you started:

```typescript
import { HttpClient } from "@posty5/core";
import { ShortLinkClient } from "@posty5/short-link";

// Initialize the HTTP client with your API key
const httpClient = new HttpClient({
  apiKey: "your-api-key", // Get from https://studio.posty5.com/account/settings?tab=APIKeys
});

// Create the Short Link client
const shortLinks = new ShortLinkClient(httpClient);

// Create a short link
const shortLink = await shortLinks.create({
  name: "Campaign Landing Page",
  baseUrl: "https://example.com/long-url-to-campaign-page",
  customLandingId: "summer-sale", // Optional: Custom slug
  templateId: "template-123", // Optional: QR code template ID
  tag: "marketing", // Optional: For organization
  refId: "CAMPAIGN-001", // Optional: External reference
});

console.log("Short Link:", shortLink.shorterLink);
console.log("QR Code:", shortLink.qrCodeDownloadURL);
console.log("Landing Page:", shortLink.qrCodeLandingPage);

// List all short links
const allLinks = await shortLinks.list(
  {},
  {
    page: 1,
    pageSize: 20,
  },
);

console.log(`Total links: ${allLinks.pagination.totalCount}`);
allLinks.items.forEach((link) => {
  console.log(`${link.name}: ${link.numberOfVisitors} clicks`);
});

// Update destination URL (short link stays the same!)
await shortLinks.update(shortLink._id, {
  baseUrl: "https://example.com/updated-campaign-page",
  templateId: "template-123",
});

console.log("✓ Destination updated - same short link, new target!");
```

---

## 📚 API Reference & Examples

### Creating Short Links

#### create()

Create a new short link with optional custom slug, landing page, and tracking parameters.

**Parameters:**

- `data` (ICreateShortLinkRequest): Short link data
  - `baseUrl` (string, **required**): Destination URL to redirect to
  - `name` (string, optional): Human-readable name for the link
  - `customLandingId` (string, optional): Custom slug for branded short links
  - `templateId` (string, optional): QR code template ID
  - `tag` (string, optional): Custom tag for grouping/filtering
  - `refId` (string, optional): External reference ID from your system
  - `isEnableMonetization` (boolean, optional): Enable partner earnings
  - `pageInfo` (object, optional): Landing page metadata
    - `title` (string): Page title
    - `description` (string): Page description
    - `descriptionIsHtmlFile` (boolean): Whether description is HTML

**Returns:** `Promise<ICreateShortLinkResponse>` - Created short link including:

- `_id` (string): Database ID
- `shortLinkId` (string): Unique identifier
- `shorterLink` (string): The actual short URL
- `baseUrl` (string): Destination URL
- `qrCodeDownloadURL` (string): QR code download link
- `qrCodeLandingPage` (string): QR code landing page
- `numberOfVisitors` (number): Click count
- `status` (string): Link status
- `createdAt` (string): Creation timestamp

**Example:**

```typescript
// Basic short link
const shortLink = await shortLinks.create({
  baseUrl: "https://example.com/product/awesome-widget",
  name: "Product Page - Awesome Widget",
});

console.log("Share this:", shortLink.shorterLink);
// Output: https://posty5.com/abc123
```

```typescript
// Short link with custom slug (branded link)
const brandedLink = await shortLinks.create({
  baseUrl: "https://example.com/summer-sale-2026",
  name: "Summer Sale 2026",
  customLandingId: "summer-sale", // Creates: posty5.com/summer-sale
  tag: "seasonal-campaigns",
  refId: "SUMMER-2026",
});

console.log("Branded link:", brandedLink.shorterLink);
// Output: https://posty5.com/summer-sale
```

```typescript
// Short link with landing page
const linkWithLanding = await shortLinks.create({
  baseUrl: "https://example.com/webinar-registration",
  name: "Q1 Webinar Registration",
  customLandingId: "q1-webinar",
  templateId: "template-123",
  pageInfo: {
    title: "Join Our Q1 Marketing Webinar",
    description: "Learn the latest digital marketing strategies from industry experts. Register now for exclusive insights!",
  },
  tag: "webinars",
});

console.log("Landing page:", linkWithLanding.qrCodeLandingPage);
```

```typescript
// Monetized short link
const monetizedLink = await shortLinks.create({
  baseUrl: "https://affiliate-product.com/offer",
  name: "Affiliate Offer Link",
  isEnableMonetization: true,
  tag: "affiliate",
  refId: "AFF-12345",
});

console.log("Earning link:", monetizedLink.shorterLink);
```

```typescript
// Campaign tracking link
const campaignLink = await shortLinks.create({
  baseUrl: "https://example.com/landing-page",
  name: "Facebook Ad Campaign - Jan 2026",
  customLandingId: "fb-jan26",
  tag: "facebook-ads",
  refId: "FB-CAMP-012",
  templateId: "template-123",
});

console.log("Campaign link:", campaignLink.shorterLink);
console.log("QR Code for print:", campaignLink.qrCodeDownloadURL);
```

---

### Retrieving Short Links

#### get()

Retrieve complete details of a specific short link by ID.

**Parameters:**

- `id` (string): The unique short link ID

**Returns:** `Promise<IShortLinkResponse>` - Short link details including:

- `_id` (string): Database ID
- `shortLinkId` (string): Unique identifier
- `shorterLink` (string): Short URL
- `baseUrl` (string): Destination URL
- `name` (string): Link name
- `numberOfVisitors` (number): Total clicks
- `lastVisitorDate` (string): Last click timestamp
- `qrCodeDownloadURL` (string): QR code URL
- `qrCodeLandingPage` (string): Landing page URL
- `status` (string): Link status
- `tag` (string): Custom tag
- `refId` (string): External reference
- `createdAt` (string): Creation timestamp
- `updatedAt` (string): Last update timestamp

**Example:**

```typescript
const link = await shortLinks.get("short-link-id-123");

console.log("Short Link Details:");
console.log("  Name:", link.name);
console.log("  Short URL:", link.shorterLink);
console.log("  Destination:", link.baseUrl);
console.log("  Total Clicks:", link.numberOfVisitors);
console.log("  Status:", link.status);

if (link.lastVisitorDate) {
  console.log("  Last Click:", new Date(link.lastVisitorDate).toLocaleString());
}

console.log("  QR Code:", link.qrCodeDownloadURL);
```

```typescript
// Check link performance
const campaignLink = await shortLinks.get("campaign-link-id");

if (campaignLink.numberOfVisitors > 500) {
  console.log("🎉 Campaign performing well!");
  console.log(`${campaignLink.numberOfVisitors} clicks so far`);
} else {
  console.log(`Current performance: ${campaignLink.numberOfVisitors} clicks`);
  console.log("Consider optimizing your campaign strategy");
}
```

```typescript
// Use link data in application
const link = await shortLinks.get("link-id");

// Display in UI
const linkCard = {
  title: link.name,
  url: link.shorterLink,
  clicks: link.numberOfVisitors,
  destination: link.baseUrl,
  qrCode: link.qrCodeDownloadURL,
  created: new Date(link.createdAt!).toLocaleDateString(),
};

console.log("Link Card Data:", linkCard);
```

---

#### list()

Search and filter short links with advanced pagination and filtering options.

**Parameters:**

- `params` (IListParams, optional): Filter criteria
  - `name` (string, optional): Filter by link name
  - `baseUrl` (string, optional): Filter by destination URL (partial match)
  - `shortLinkId` (string, optional): Filter by short link ID
  - `tag` (string, optional): Filter by tag
  - `refId` (string, optional): Filter by reference ID
  - `status` (string, optional): Filter by status
  - `templateId` (string, optional): Filter by template ID
  - `apiKeyId` (string, optional): Filter by API key ID
  - `isEnableMonetization` (boolean, optional): Filter by monetization status
  - `pageinfo.title` (string, optional): Filter by landing page title
- `pagination` (IPaginationParams, optional): Pagination options
  - `page` (number, optional): Page number (default: 1)
  - `pageSize` (number, optional): Items per page (default: 10)

**Returns:** `Promise<ISearchShortLinkResponse>`

- `items` (array): Array of short links
- `pagination` (object): Pagination metadata
  - `page` (number): Current page
  - `pageSize` (number): Items per page
  - `totalCount` (number): Total items
  - `totalPages` (number): Total pages

**Example:**

```typescript
// Get all short links
const allLinks = await shortLinks.list(
  {},
  {
    page: 1,
    pageSize: 50,
  },
);

console.log(`Total: ${allLinks.pagination.totalCount}`);
allLinks.items.forEach((link) => {
  console.log(`${link.name}: ${link.shorterLink} (${link.numberOfVisitors} clicks)`);
});
```

```typescript
// Filter by tag - get all marketing links
const marketingLinks = await shortLinks.list({
  tag: "marketing",
});

console.log("Marketing Links:");
marketingLinks.items.forEach((link) => {
  console.log(`  ${link.name} - ${link.numberOfVisitors} clicks`);
});
```

```typescript
// Search by destination URL
const exampleLinks = await shortLinks.list({
  baseUrl: "example.com", // Finds all links containing 'example.com'
});

console.log(`Found ${exampleLinks.items.length} links to example.com`);
```

```typescript
// Filter by reference ID - campaign tracking
const campaignLinks = await shortLinks.list({
  refId: "SUMMER-2026",
});

let totalClicks = 0;
campaignLinks.items.forEach((link) => {
  totalClicks += link.numberOfVisitors || 0;
  console.log(`${link.name}: ${link.numberOfVisitors} clicks`);
});

console.log(`\nCampaign Total: ${totalClicks} clicks`);
```

```typescript
// Filter by status
const approvedLinks = await shortLinks.list({
  status: "approved",
});

console.log(`${approvedLinks.items.length} approved links`);
```

```typescript
// Find monetized links
const earningLinks = await shortLinks.list({
  isEnableMonetization: true,
});

console.log("Monetized Links:");
earningLinks.items.forEach((link) => {
  console.log(`  ${link.shorterLink} - ${link.numberOfVisitors} clicks`);
});
```

```typescript
// Search by link name
const webinarLinks = await shortLinks.list({
  name: "webinar",
});

console.log(
  "Webinar-related links:",
  webinarLinks.items.map((l) => l.name),
);
```

```typescript
// Pagination example - get second page
const page2 = await shortLinks.list(
  {
    tag: "social-media",
  },
  {
    page: 2,
    pageSize: 25,
  },
);

console.log(`Page ${page2.pagination.page} of ${page2.pagination.totalPages}`);
```

---

### Updating Short Links

#### update()

Update an existing short link's destination URL or metadata. The short URL remains the same!

**Parameters:**

- `id` (string): Short link ID to update
- `data` (IUpdateShortLinkRequest): Updated data
  - `baseUrl` (string, **required**): New destination URL
  - `name` (string, optional): Updated link name
  - `templateId` (string, optional): Updated template ID
  - `tag` (string, optional): Updated tag
  - `refId` (string, optional): Updated reference ID
  - `isEnableMonetization` (boolean, optional): Enable/disable monetization
  - `pageInfo` (object, optional): Updated landing page metadata

**Returns:** `Promise<IUpdateShortLinkResponse>`

**Example:**

```typescript
// Update destination URL (most common use case)
await shortLinks.update("link-id-123", {
  baseUrl: "https://example.com/new-destination",
  templateId: "template-123",
});

console.log("✓ Destination updated - short link stays the same!");
```

```typescript
// Update campaign link for new season
await shortLinks.update("campaign-link-id", {
  name: "Fall Sale 2026",
  baseUrl: "https://example.com/fall-sale",
  tag: "seasonal-campaigns",
  refId: "FALL-2026",
  templateId: "template-123",
});
```

```typescript
// Update landing page content
await shortLinks.update("webinar-link-id", {
  baseUrl: "https://example.com/webinar-q2",
  templateId: "template-123",
  pageInfo: {
    title: "Q2 Marketing Webinar - Updated",
    description: "NEW DATE: Join us for updated insights on Q2 marketing strategies!",
  },
});
```

```typescript
// Enable monetization on existing link
await shortLinks.update("affiliate-link-id", {
  baseUrl: "https://affiliate-product.com/offer",
  isEnableMonetization: true,
  templateId: "template-123",
});

console.log("✓ Monetization enabled");
```

```typescript
// Fix broken link
const link = await shortLinks.get("old-link-id");
console.log("Old destination:", link.baseUrl);

await shortLinks.update("old-link-id", {
  baseUrl: "https://example.com/fixed-url",
  templateId: "template-123",
});

console.log("✓ Link fixed - all existing shares still work!");
```

```typescript
// Update multiple links programmatically
const campaignLinks = await shortLinks.list({ refId: "OLD-CAMPAIGN" });

for (const link of campaignLinks.items) {
  await shortLinks.update(link._id, {
    baseUrl: link.baseUrl, // Keep same destination
    refId: "NEW-CAMPAIGN", // Update reference
    templateId: "template-123",
  });
}

console.log(`Updated ${campaignLinks.items.length} campaign links`);
```

---

### Managing Short Links

#### delete()

Permanently delete a short link. The short URL will no longer work.

**Parameters:**

- `id` (string): Short link ID to delete

**Returns:** `Promise<void>`

**Example:**

```typescript
// Delete a short link
await shortLinks.delete("link-id-123");
console.log("Short link deleted");
```

```typescript
// Delete with confirmation
async function deleteShortLink(id: string) {
  const link = await shortLinks.get(id);

  console.log(`Are you sure you want to delete "${link.name}"?`);
  console.log(`Short URL: ${link.shorterLink}`);
  console.log(`Total Clicks: ${link.numberOfVisitors}`);

  // After user confirmation
  await shortLinks.delete(id);
  console.log("✓ Short link deleted successfully");
}
```

```typescript
// Clean up old campaign links
const oldCampaign = await shortLinks.list({
  tag: "campaign-2023",
});

for (const link of oldCampaign.items) {
  await shortLinks.delete(link._id);
  console.log(`Deleted: ${link.name}`);
}

console.log(`Cleaned up ${oldCampaign.items.length} old links`);
```

---

### Complete Workflow Example

Here's a complete example showing a typical short link management workflow:

```typescript
import { HttpClient } from "@posty5/core";
import { ShortLinkClient } from "@posty5/short-link";

// Initialize
const httpClient = new HttpClient({
  apiKey: process.env.POSTY5_API_KEY!,
});
const shortLinks = new ShortLinkClient(httpClient);

const TEMPLATE_ID = "your-template-id";

// 1. Create short links for a marketing campaign
console.log("🚀 Creating marketing campaign links...");

// Email campaign link
const emailLink = await shortLinks.create({
  name: "Email Newsletter - January",
  baseUrl: "https://example.com/email-promo",
  customLandingId: "email-jan",
  templateId: TEMPLATE_ID,
  tag: "email-marketing",
  refId: "EMAIL-JAN-2026",
  pageInfo: {
    title: "Exclusive Email Offer",
    description: "Thank you for being a subscriber! Enjoy this exclusive offer.",
  },
});

console.log("Email link:", emailLink.shorterLink);

// Social media link
const socialLink = await shortLinks.create({
  name: "Facebook Ad - Product Launch",
  baseUrl: "https://example.com/product-launch",
  customLandingId: "fb-launch",
  templateId: TEMPLATE_ID,
  tag: "social-media",
  refId: "FB-LAUNCH-2026",
});

console.log("Social link:", socialLink.shorterLink);

// Affiliate link with monetization
const affiliateLink = await shortLinks.create({
  name: "Affiliate Partner Link",
  baseUrl: "https://partner.com/exclusive-offer",
  isEnableMonetization: true,
  tag: "affiliate",
  refId: "AFF-PARTNER-01",
  templateId: TEMPLATE_ID,
});

console.log("Affiliate link:", affiliateLink.shorterLink);

// Print marketing link with QR code
const printLink = await shortLinks.create({
  name: "Print Ad - Magazine",
  baseUrl: "https://example.com/magazine-offer",
  customLandingId: "mag-jan",
  templateId: TEMPLATE_ID,
  tag: "print-marketing",
  refId: "PRINT-JAN-2026",
});

console.log("Print QR code:", printLink.qrCodeDownloadURL);

// 2. List all campaign links
console.log("\n📋 Campaign Links:");
const campaignLinks = await shortLinks.list({
  tag: "email-marketing",
});

let totalClicks = 0;
campaignLinks.items.forEach((link) => {
  const clicks = link.numberOfVisitors || 0;
  totalClicks += clicks;
  console.log(`  ${link.name}: ${clicks} clicks`);
});

console.log(`\nTotal campaign clicks: ${totalClicks}`);

// 3. Update email link destination (A/B test new landing page)
console.log("\n🔄 Running A/B test - updating email link...");
await shortLinks.update(emailLink._id, {
  name: "Email Newsletter - January (Version B)",
  baseUrl: "https://example.com/email-promo-v2",
  templateId: TEMPLATE_ID,
  tag: "email-marketing",
  refId: "EMAIL-JAN-2026-VB",
});

console.log("✓ A/B test variant deployed - same link, new page!");

// 4. Analytics report
console.log("\n📊 Campaign Performance:");

const allCampaignLinks = await shortLinks.list({
  refId: "JAN-2026",
});

for (const link of allCampaignLinks.items) {
  const details = await shortLinks.get(link._id);

  console.log(`\n${details.name}:`);
  console.log(`  Short URL: ${details.shorterLink}`);
  console.log(`  Clicks: ${details.numberOfVisitors || 0}`);

  if (details.lastVisitorDate) {
    const daysSinceLastClick = Math.floor((Date.now() - new Date(details.lastVisitorDate).getTime()) / (1000 * 60 * 60 * 24));
    console.log(`  Last Click: ${daysSinceLastClick} days ago`);
  }

  console.log(`  Status: ${details.status}`);
}

// 5. Generate campaign report
console.log("\n📈 Campaign Summary:");
const emailCampaign = await shortLinks.list({ tag: "email-marketing" });
const socialCampaign = await shortLinks.list({ tag: "social-media" });
const affiliateCampaign = await shortLinks.list({ tag: "affiliate" });

const calculateClicks = (links: typeof emailCampaign.items) => links.reduce((sum, link) => sum + (link.numberOfVisitors || 0), 0);

console.log(`Email Marketing: ${calculateClicks(emailCampaign.items)} clicks`);
console.log(`Social Media: ${calculateClicks(socialCampaign.items)} clicks`);
console.log(`Affiliate: ${calculateClicks(affiliateCampaign.items)} clicks`);

// 6. Clean up old test links
console.log("\n🗑️ Cleaning up test links...");
const testLinks = await shortLinks.list({ tag: "test" });

for (const link of testLinks.items) {
  await shortLinks.delete(link._id);
  console.log(`  Deleted: ${link.name}`);
}

console.log("\n✓ Campaign management complete!");
```

---

### Error Handling

All methods may throw errors from `@posty5/core`. Handle them appropriately:

```typescript
import { AuthenticationError, NotFoundError, ValidationError, RateLimitError } from "@posty5/core";

try {
  const shortLink = await shortLinks.create({
    baseUrl: "invalid-url", // Invalid URL format
  });
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error("Invalid API key");
  } else if (error instanceof NotFoundError) {
    console.error("Template not found");
  } else if (error instanceof ValidationError) {
    console.error("Invalid data:", error.errors);
    // Check if it's a URL validation error
    if (error.message.includes("baseUrl")) {
      console.error("Please provide a valid URL with http:// or https://");
    }
  } else if (error instanceof RateLimitError) {
    console.error("Rate limit exceeded, retry after:", error.retryAfter);
  } else {
    console.error("Unexpected error:", error);
  }
}
```

```typescript
// Graceful error handling in production
async function createSafeShortLink(url: string, name: string) {
  try {
    const link = await shortLinks.create({
      baseUrl: url,
      name: name,
      templateId: "template-123",
    });

    return { success: true, link: link.shorterLink };
  } catch (error) {
    console.error("Failed to create short link:", error);
    return { success: false, error: error.message };
  }
}

// Usage
const result = await createSafeShortLink("https://example.com", "Test Link");
if (result.success) {
  console.log("Created:", result.link);
} else {
  console.error("Error:", result.error);
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
