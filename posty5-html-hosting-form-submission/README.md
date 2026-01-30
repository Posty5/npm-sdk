# @posty5/html-hosting-form-submission

Track, manage, and process form submissions from your Posty5-hosted HTML pages. This package provides a complete TypeScript/JavaScript client for managing form submissions with features like status tracking, Google Sheets integration, navigation, and comprehensive filtering.

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

`@posty5/html-hosting-form-submission` is a **specialized tool package** for managing form submissions captured from HTML pages hosted on the Posty5 platform. It enables developers to build powerful form management systems with status workflows and data export capabilities.

### Key Capabilities

- **📋 Form Submission Tracking** - Automatically capture and store form submissions from hosted HTML pages
- **🔄 Status Management** - Track submission lifecycle with 11 customizable status types
- **📊 Status History** - Complete audit trail of all status changes with timestamps and notes
- **📱 Google Sheets Integration** - Auto-sync form data to Google Sheets for analysis
- **🔍 Advanced Filtering** - Search and filter submissions by page, form, status, and custom fields
- **⬅️➡️ Navigation** - Easily navigate between previous and next submissions
- **📈 Visitor Tracking** - Link submissions to visitor sessions for behavior analysis
- **🔢 Automatic Numbering** - Each submission gets a unique sequential number

### Role in the Posty5 Ecosystem

This package works seamlessly with other Posty5 SDK modules:

- Use `@posty5/html-hosting` to create and manage HTML pages with forms
- Use `@posty5/html-hosting-variables` to inject dynamic data into forms
- Combine with analytics tools to track conversion rates and form performance

Perfect for **developers**, **product managers**, **customer support teams**, and **marketers** who need to manage form submissions, lead capture, contact forms, surveys, and customer feedback systems.

---

## 📥 Installation

Install the package along with the required core dependency:

```bash
npm install @posty5/html-hosting-form-submission @posty5/core
```

---

## 🚀 Quick Start

Here's a minimal example to get you started:

```typescript
import { HttpClient } from "@posty5/core";
import { HtmlHostingFormSubmissionClient } from "@posty5/html-hosting-form-submission";

// Initialize the HTTP client with your API key
const httpClient = new HttpClient({
  apiKey: "your-api-key", // Get from https://studio.posty5.com/account/settings?tab=APIKeys
});

// Create the Form Submission client
const formSubmissions = new HtmlHostingFormSubmissionClient(httpClient);

// List all submissions for a specific HTML page
const submissions = await formSubmissions.list(
  {
    htmlHostingId: "your-html-page-id", // Required: The HTML page containing forms
    status: "New", // Optional: Filter by status
  },
  {
    page: 1,
    pageSize: 20,
  },
);

console.log(`Found ${submissions.pagination.totalItems} submissions`);
submissions.items.forEach((submission) => {
  console.log(`#${submission.numbering}: ${submission.status}`);
  console.log("Form Data:", submission.data);
});

// Get a specific submission
const submission = await formSubmissions.get("submission-id-123");
console.log("Visitor Data:", submission.data);
console.log("Current Status:", submission.status);
console.log("Status History:", submission.statusHistory);
```

---

## 📚 API Reference & Examples

### Retrieving Form Submissions

#### get()

Retrieve complete details of a specific form submission by ID.

**Parameters:**

- `id` (string): The unique submission ID

**Returns:** `Promise<IGetFormSubmissionResponse>` - Complete submission details including:

- `_id` (string): Submission ID
- `htmlHostingId` (string): HTML page ID where form was submitted
- `formId` (string): Form ID within the HTML page
- `visitorId` (string): Visitor session ID
- `numbering` (number): Sequential submission number
- `data` (Record<string, any>): Form field data as key-value pairs
- `fields` (string[], optional): List of form field names
- `ownerUserId` (string): User who owns the HTML page
- `status` (IFormStatusType): Current status
- `statusHistory` (IStatusHistoryEntry[]): Complete status change history
- `syncing` (ISyncingStatus): Google Sheets sync status
- `createdAt` (string): Submission timestamp
- `updatedAt` (string, optional): Last update timestamp

**Example:**

```typescript
const submission = await formSubmissions.get("submission-id-123");

// Access form data
console.log("Name:", submission.data.name);
console.log("Email:", submission.data.email);
console.log("Message:", submission.data.message);

// Check current status
console.log("Status:", submission.status); // e.g., "new", "inProgress", "completed"

// Review status history
submission.statusHistory.forEach((history) => {
  console.log(`${history.status} - ${history.changedAt}`);
  if (history.notes) {
    console.log(`  Notes: ${history.notes}`);
  }
});

// Check Google Sheets sync status
if (submission.syncing.isDone) {
  console.log("✓ Synced to Google Sheets");
} else if (submission.syncing.lastError) {
  console.error("Sync error:", submission.syncing.lastError);
}
```

---

#### list()

Search and filter form submissions with advanced pagination and filtering options.

**Parameters:**

- `params` (IListParams): Filter criteria
  - `htmlHostingId` (string, **required**): HTML page ID to get submissions from
  - `formId` (string, optional): Filter by specific form ID
  - `numbering` (string, optional): Search by submission number
  - `status` (IFormStatusType, optional): Filter by status
  - `filteredFields` (string, optional): Comma-separated field names to enable search on (e.g., "name,phone,email")
- `pagination` (IPaginationParams, optional): Pagination options
  - `page` (number, optional): Page number (default: 1)
  - `pageSize` (number, optional): Items per page (default: 10)

**Returns:** `Promise<ISearchFormSubmissionsResponse>`

- `items` (array): Array of form submissions
- `pagination` (object): Pagination metadata
  - `page` (number): Current page
  - `pageSize` (number): Items per page
  - `totalItems` (number): Total count
  - `totalPages` (number): Total pages

**Example:**

```typescript
// Get all submissions for an HTML page
const allSubmissions = await formSubmissions.list(
  {
    htmlHostingId: "html-page-123",
  },
  {
    page: 1,
    pageSize: 50,
  },
);

console.log(`Total: ${allSubmissions.pagination.totalItems}`);
allSubmissions.items.forEach((sub) => {
  console.log(`#${sub.numbering}: ${sub.data.email} - ${sub.status}`);
});
```

```typescript
// Filter by status - get only new submissions
const newSubmissions = await formSubmissions.list({
  htmlHostingId: "html-page-123",
  status: "New",
});

console.log(`${newSubmissions.items.length} new submissions to review`);
```

```typescript
// Filter by specific form on a page with multiple forms
const contactFormSubmissions = await formSubmissions.list({
  htmlHostingId: "html-page-123",
  formId: "contact-form",
});
```

```typescript
// Search by submission number
const submission = await formSubmissions.list({
  htmlHostingId: "html-page-123",
  numbering: "42",
});
```

```typescript
// Enable search on specific fields
// This allows searching within form data fields
const searchableSubmissions = await formSubmissions.list({
  htmlHostingId: "html-page-123",
  filteredFields: "name,email,phone", // Enable search on these fields
});
```

```typescript
// Pagination example - get second page
const page2 = await formSubmissions.list(
  {
    htmlHostingId: "html-page-123",
    status: "inProgress",
  },
  {
    page: 2,
    pageSize: 25,
  },
);
```

---

#### getNextPrevious()

Get references to the next and previous submissions for easy navigation. Useful for building submission review interfaces.

**Parameters:**

- `id` (string): Current submission ID

**Returns:** `Promise<INextPreviousSubmissionsResponse>`

- `previous` (object, optional): Previous submission reference
  - `_id` (string): Submission ID
  - `numbering` (string): Formatted numbering (padded)
- `next` (object, optional): Next submission reference
  - `_id` (string): Submission ID
  - `numbering` (string): Formatted numbering (padded)

**Example:**

```typescript
const current = await formSubmissions.get("submission-id-123");
const navigation = await formSubmissions.getNextPrevious("submission-id-123");

console.log(`Current: #${current.numbering}`);

if (navigation.previous) {
  console.log(`← Previous: #${navigation.previous.numbering}`);
  console.log(`   ID: ${navigation.previous._id}`);
}

if (navigation.next) {
  console.log(`→ Next: #${navigation.next.numbering}`);
  console.log(`   ID: ${navigation.next._id}`);
}

// Build navigation links
if (navigation.previous) {
  // Show "Previous" button linking to navigation.previous._id
}
if (navigation.next) {
  // Show "Next" button linking to navigation.next._id
}
```

```typescript
// Navigation UI example
async function navigateSubmissions(currentId: string) {
  const nav = await formSubmissions.getNextPrevious(currentId);

  return {
    hasPrevious: !!nav.previous,
    hasNext: !!nav.next,
    previousUrl: nav.previous ? `/submissions/${nav.previous._id}` : null,
    nextUrl: nav.next ? `/submissions/${nav.next._id}` : null,
  };
}
```

---

### Managing Submissions

#### delete()

Permanently delete a form submission (soft delete - marked as deleted but not removed from database).

**Parameters:**

- `id` (string): Submission ID to delete

**Returns:** `Promise<void>`

**Example:**

```typescript
// Delete a submission
await formSubmissions.delete("submission-id-123");
console.log("Submission deleted");
```

```typescript
// Delete with confirmation
async function deleteSubmission(id: string) {
  const submission = await formSubmissions.get(id);

  console.log(`Are you sure you want to delete submission #${submission.numbering}?`);
  console.log(`From: ${submission.data.email}`);

  // After user confirmation
  await formSubmissions.delete(id);
  console.log("✓ Deleted successfully");
}
```

---

### Status Types

The following status types are available for form submissions:

```typescript
type IFormStatusType =
  | "new" // Just received, not yet reviewed
  | "pendingReview" // Queued for review
  | "inProgress" // Being actively processed
  | "onHold" // Temporarily paused
  | "needMoreInfo" // Requires additional information
  | "approved" // Fully approved
  | "partiallyApproved" // Some parts approved
  | "rejected" // Declined or invalid
  | "completed" // Successfully processed
  | "archived" // Moved to archive
  | "cancelled"; // Cancelled by user or system
```

**Example Usage:**

```typescript
// Get all submissions by status
const newLeads = await formSubmissions.list({
  htmlHostingId: "page-123",
  status: "New",
});

const inProgress = await formSubmissions.list({
  htmlHostingId: "page-123",
  status: "inProgress",
});

const completed = await formSubmissions.list({
  htmlHostingId: "page-123",
  status: "Completed",
});

console.log(`Pipeline: ${newLeads.items.length} new, ${inProgress.items.length} inProgress, ${completed.items.length} completed`);
```

---

### Understanding Submission Data

#### Form Data Structure

The `data` field contains all form field values as key-value pairs:

```typescript
const submission = await formSubmissions.get("submission-id-123");

// Access form fields
const formData = submission.data;

console.log("Name:", formData.name);
console.log("Email:", formData.email);
console.log("Phone:", formData.phone);
console.log("Message:", formData.message);
console.log("Company:", formData.company);

// Dynamic field access
Object.keys(formData).forEach((fieldName) => {
  console.log(`${fieldName}: ${formData[fieldName]}`);
});
```

#### Status History Tracking

Every status change is recorded in the `statusHistory` array:

```typescript
const submission = await formSubmissions.get("submission-id-123");

// Review complete status history
submission.statusHistory.forEach((history, index) => {
  console.log(`${index + 1}. ${history.status}`);
  console.log(`   Date: ${new Date(history.changedAt).toLocaleString()}`);

  if (history.notes) {
    console.log(`   Notes: ${history.notes}`);
  }

  if (history.rejectedReason) {
    console.log(`   Rejection Reason: ${history.rejectedReason}`);
  }
});

// Find when submission was approved
const approvedEntry = submission.statusHistory.find((h) => h.status === "Approved");
if (approvedEntry) {
  console.log("Approved on:", new Date(approvedEntry.changedAt).toLocaleDateString());
}
```

#### Google Sheets Sync Status

Track whether submissions have been synced to Google Sheets:

```typescript
const submission = await formSubmissions.get("submission-id-123");

console.log("Sync Status:", submission.syncing);

if (submission.syncing.isDone) {
  console.log("✓ Successfully synced to Google Sheets");
} else {
  console.log("⏳ Pending sync...");

  if (submission.syncing.lastError) {
    console.error("Last sync error:", submission.syncing.lastError);
    console.log("Last attempt:", submission.syncing.lastAttemptAt);
  }
}
```

---

### Error Handling

All methods may throw errors from `@posty5/core`. Handle them appropriately:

```typescript
import { AuthenticationError, NotFoundError, ValidationError, RateLimitError } from "@posty5/core";

try {
  const submission = await formSubmissions.get("invalid-id");
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error("Invalid API key");
  } else if (error instanceof NotFoundError) {
    console.error("Submission not found");
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

### Complete Workflow Example

Here's a complete example showing a typical form submission management workflow:

```typescript
import { HttpClient } from "@posty5/core";
import { HtmlHostingFormSubmissionClient } from "@posty5/html-hosting-form-submission";

// Initialize
const httpClient = new HttpClient({
  apiKey: process.env.POSTY5_API_KEY!,
});
const formSubmissions = new HtmlHostingFormSubmissionClient(httpClient);

const HTML_PAGE_ID = "your-contact-page-id";

// 1. Get all new submissions
console.log("📋 Checking for new submissions...");
const newSubmissions = await formSubmissions.list({
  htmlHostingId: HTML_PAGE_ID,
  status: "New",
});

console.log(`Found ${newSubmissions.items.length} new submissions to review`);

// 2. Process each submission
for (const submission of newSubmissions.items) {
  console.log(`\n#${submission.numbering} - ${submission.data.email}`);

  // Get full details
  const details = await formSubmissions.get(submission._id);

  // Display form data
  console.log("Name:", details.data.name);
  console.log("Email:", details.data.email);
  console.log("Message:", details.data.message);

  // Check Google Sheets sync
  if (details.syncing.isDone) {
    console.log("✓ Synced to Google Sheets");
  }

  // Get navigation
  const nav = await formSubmissions.getNextPrevious(details._id);
  console.log(`Navigation: Previous: ${nav.previous?._id || "none"}, Next: ${nav.next?._id || "none"}`);
}

// 3. Get submissions by different statuses for reporting
const statusReport = {
  new: await formSubmissions.list({
    htmlHostingId: HTML_PAGE_ID,
    status: "new",
  }),
  inProgress: await formSubmissions.list({
    htmlHostingId: HTML_PAGE_ID,
    status: "inProgress",
  }),
  completed: await formSubmissions.list({
    htmlHostingId: HTML_PAGE_ID,
    status: "completed",
  }),
};

console.log("\n📊 Status Report:");
console.log(`new: ${statusReport.new.pagination.totalItems}`);
console.log(`inProgress: ${statusReport.inProgress.pagination.totalItems}`);
console.log(`completed: ${statusReport.completed.pagination.totalItems}`);
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
