# @posty5/social-publisher-workspace

Official Posty5 SDK for managing social media publishing workspaces. Create, manage, and organize workspaces to group your social media accounts and streamline multi-platform content distribution.

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

`@posty5/social-publisher-workspace` is the **workspace management client** for the Posty5 Social Media Publisher. This package enables you to programmatically create and manage workspaces (organizations) that group your social media accounts for streamlined content distribution.

### What are Social Publisher Workspaces?

Workspaces (also called organizations) are containers that group your connected social media accounts. Each workspace can contain multiple accounts from YouTube, Facebook, Instagram, and TikTok, allowing you to manage different brands, clients, or campaigns independently.

### Key Capabilities

- **Create Workspaces** - Programmatically create new workspaces with custom names, descriptions, and logos
- **List & Search** - Retrieve all workspaces with pagination, filtering, and search capabilities
- **Update Workspaces** - Modify workspace details including name, description, and logo image
- **Delete Workspaces** - Remove workspaces when no longer needed
- **Tag & Reference System** - Organize workspaces using custom tags and reference IDs for integration with your systems
- **Account Management** - View connected social media accounts (YouTube, Facebook, Instagram, TikTok) within each workspace
- **Logo Upload** - Upload custom workspace logos with automatic image optimization

### Why Use This Package?

- **Team Collaboration**: Manage multiple clients or brands with separate workspaces
- **Automated Workflow**: Integrate workspace management into your content distribution pipeline
- **Custom Organization**: Use tags and reference IDs to map workspaces to your internal systems
- **Multi-Platform Support**: Group accounts from YouTube, Facebook, Instagram, and TikTok
- **Logo Branding**: Upload custom logos for professional workspace presentation

---

## 📥 Installation

Install via npm:

```bash
npm install @posty5/social-publisher-workspace @posty5/core
```

---

## 🚀 Quick Start

```typescript
import { HttpClient } from "@posty5/core";
import { SocialPublisherWorkspaceClient } from "@posty5/social-publisher-workspace";

// Initialize the HTTP client with your API key
const httpClient = new HttpClient({
  apiKey: "your-api-key", // Get from studio.posty5.com/account/settings?tab=APIKeys
  debug: true, // Optional: Enable debug logging
});

// Create workspace client
const client = new SocialPublisherWorkspaceClient(httpClient);

// Create a new workspace
const workspaceId = await client.create({
  name: "My Brand Workspace",
  description: "Workspace for managing social media accounts",
  tag: "brand-2024", // Optional: Custom tag for filtering
  refId: "WORKSPACE-001", // Optional: Your internal reference ID
});

console.log("Created workspace:", workspaceId);

// Get workspace details
const workspace = await client.get(workspaceId);
console.log("Workspace:", workspace.name);
console.log("Connected accounts:", workspace.account);

// List all workspaces
const workspaces = await client.list(
  {},
  {
    page: 1,
    pageSize: 10,
  },
);

console.log(`Found ${workspaces.pagination.totalCount} workspaces`);
```

---

## 📚 API Reference & Examples

### create()

Create a new social media workspace with optional logo image upload.

**Parameters:**

- `data` (ICreateWorkspaceRequest): Workspace configuration
  - `name` (string): Workspace name
  - `description` (string): Workspace description
  - `tag` (string, optional): Custom tag for filtering
  - `refId` (string, optional): Your internal reference ID
- `logo` (File | Blob, optional): Logo image file (PNG, JPG, or WebP)

**Returns:** `Promise<string>` - Created workspace ID

**Example:**

```typescript
// Create workspace without logo
const workspaceId = await client.create({
  name: "Client A - Social Media",
  description: "Managing social accounts for Client A",
  tag: "client-a",
  refId: "CLIENT-A-WS-001",
});

console.log("Workspace created:", workspaceId);

// Create workspace with logo upload
import * as fs from "fs";

const logoFile = fs.readFileSync("./logo.png");
const logoBlob = new Blob([logoFile], { type: "image/png" });
const logo = new File([logoBlob], "logo.png", { type: "image/png" });

const workspaceWithLogo = await client.create(
  {
    name: "Brand Workspace",
    description: "Workspace with custom branding",
  },
  logo,
);

console.log("Workspace with logo:", workspaceWithLogo);
```

---

### get()

Retrieve detailed information about a specific workspace by ID.

**Parameters:**

- `id` (string): Workspace ID

**Returns:** `Promise<IWorkspaceResponse>` - Workspace details including connected accounts

**Response Structure:**

```typescript
{
  _id: string;                    // Workspace ID
  name: string;                   // Workspace name
  account: {                      // Connected social media accounts
    youtube?: {                   // YouTube account (if connected)
      link: string;               // Account URL
      name: string;               // Channel name
      thumbnail: string;          // Channel thumbnail
      platformAccountId: string;  // YouTube channel ID
      status: 'active' | 'inactive' | 'authenticationExpired';
    };
    facebook?: { /* ... */ };     // Facebook page account
    instagram?: { /* ... */ };    // Instagram account
    tiktok?: { /* ... */ };       // TikTok account
  };
}
```

**Example:**

```typescript
// Get workspace details
const workspace = await client.get("workspace-id-here");

console.log("Workspace:", workspace.name);

// Check connected accounts
if (workspace.account.youtube) {
  console.log("YouTube channel:", workspace.account.youtube.name);
  console.log("Status:", workspace.account.youtube.status);
}

if (workspace.account.tiktok) {
  console.log("TikTok account:", workspace.account.tiktok.name);
  console.log("Profile:", workspace.account.tiktok.link);
}

// Handle authentication expiration
for (const [platform, account] of Object.entries(workspace.account)) {
  if (account && account.status === "authenticationExpired") {
    console.warn(`${platform} account needs re-authentication`);
  }
}
```

---

### list()

Search and retrieve workspaces with pagination and filtering options.

**Parameters:**

- `params` (IListParams, optional): Search and filter options
  - `name` (string, optional): Filter by workspace name (partial match)
  - `description` (string, optional): Filter by description (partial match)
  - `tag` (string, optional): Filter by custom tag
  - `refId` (string, optional): Filter by reference ID
  - `apiKeyId` (string, optional): Filter by API key
- `pagination` (IPaginationParams, optional): Pagination settings
  - `page` (number): Page number (default: 1)
  - `pageSize` (number): Items per page (default: 10)

**Returns:** `Promise<ISearchWorkspaceResponse>` - Paginated workspace list

**Response Structure:**

```typescript
{
  items: Array<{
    _id: string; // Workspace ID
    name: string; // Workspace name
    description: string; // Workspace description
    imageUrl?: string; // Logo URL (if uploaded)
    createdAt: string; // Creation timestamp
  }>;
  pagination: {
    page: number; // Current page
    pageSize: number; // Items per page
    totalCount: number; // Total workspaces
    totalPages: number; // Total pages
  }
}
```

**Example:**

```typescript
// Get all workspaces with pagination
const allWorkspaces = await client.list(
  {},
  {
    page: 1,
    pageSize: 20,
  },
);

console.log(`Total workspaces: ${allWorkspaces.pagination.totalCount}`);
console.log(`Showing page ${allWorkspaces.pagination.page} of ${allWorkspaces.pagination.totalPages}`);

// Display workspaces
allWorkspaces.items.forEach((workspace) => {
  console.log(`- ${workspace.name}: ${workspace.description}`);
});

// Search by name
const searchResults = await client.list(
  {
    name: "brand", // Finds workspaces with "brand" in the name
  },
  {
    page: 1,
    pageSize: 10,
  },
);

console.log(`Found ${searchResults.items.length} matching workspaces`);

// Filter by tag
const clientWorkspaces = await client.list(
  {
    tag: "client-a", // Get all workspaces tagged with 'client-a'
  },
  {
    page: 1,
    pageSize: 50,
  },
);

console.log(`Client A has ${clientWorkspaces.items.length} workspaces`);

// Filter by reference ID
const specificWorkspace = await client.list(
  {
    refId: "WORKSPACE-001", // Find workspace by your internal ID
  },
  {
    page: 1,
    pageSize: 1,
  },
);

if (specificWorkspace.items.length > 0) {
  console.log("Found workspace:", specificWorkspace.items[0].name);
}

// Pagination example - fetch all pages
async function getAllWorkspaces() {
  const allItems = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const result = await client.list({}, { page, pageSize: 50 });
    allItems.push(...result.items);
    totalPages = result.pagination.totalPages;
    page++;
  }

  return allItems;
}

const allMyWorkspaces = await getAllWorkspaces();
console.log(`Total workspaces: ${allMyWorkspaces.length}`);
```

---

### update()

Update workspace details including name, description, and optional logo image.

**Parameters:**

- `id` (string): Workspace ID to update
- `data` (IUpdateWorkspaceRequest): Updated workspace data
  - `name` (string): New workspace name
  - `description` (string): New workspace description
  - `tag` (string, optional): Updated custom tag
  - `refId` (string, optional): Updated reference ID
- `logo` (File | Blob, optional): New logo image file

**Returns:** `Promise<void>` - No return value on success

**Example:**

```typescript
// Update workspace name and description
await client.update("workspace-id", {
  name: "Updated Workspace Name",
  description: "New description for this workspace",
  tag: "updated-tag",
  refId: "NEW-REF-ID",
});

console.log("Workspace updated successfully");

// Update with new logo
import * as fs from "fs";

const newLogoFile = fs.readFileSync("./new-logo.png");
const newLogoBlob = new Blob([newLogoFile], { type: "image/png" });
const newLogo = new File([newLogoBlob], "new-logo.png", { type: "image/png" });

await client.update(
  "workspace-id",
  {
    name: "Workspace with New Logo",
    description: "Updated branding",
  },
  newLogo,
);

console.log("Workspace and logo updated");

// Update only specific fields
await client.update("workspace-id", {
  name: "New Name",
  description: "New Description",
  // tag and refId remain unchanged
});
```

---

### delete()

Delete a workspace. Note: This will remove the workspace and all its settings, but connected social media accounts will remain in your account.

**Parameters:**

- `id` (string): Workspace ID to delete

**Returns:** `Promise<void>` - No return value on success

**Example:**

```typescript
// Delete workspace
await client.delete("workspace-id-to-delete");
console.log("Workspace deleted successfully");

// Delete with error handling
try {
  await client.delete("workspace-id");
  console.log("Workspace deleted");
} catch (error) {
  if (error instanceof NotFoundError) {
    console.error("Workspace not found");
  } else {
    console.error("Failed to delete workspace:", error.message);
  }
}

// Delete workspace and verify
const workspaceId = "workspace-to-delete";

await client.delete(workspaceId);

// Try to get it (should throw NotFoundError)
try {
  await client.get(workspaceId);
  console.error("Workspace still exists!");
} catch (error) {
  console.log("Workspace successfully deleted");
}
```

---

## 🔄 Complete Workflow Example

```typescript
import { HttpClient } from "@posty5/core";
import { SocialPublisherWorkspaceClient } from "@posty5/social-publisher-workspace";

// Initialize client
const httpClient = new HttpClient({
  apiKey: process.env.POSTY5_API_KEY!,
  debug: false,
});

const client = new SocialPublisherWorkspaceClient(httpClient);

async function manageWorkspaces() {
  try {
    // 1. Create a new workspace
    console.log("Creating workspace...");
    const workspaceId = await client.create({
      name: "E-commerce Brand 2024",
      description: "Social media accounts for our e-commerce store",
      tag: "ecommerce",
      refId: "ECOM-WS-001",
    });
    console.log("✓ Created workspace:", workspaceId);

    // 2. Get workspace details
    console.log("\nFetching workspace details...");
    const workspace = await client.get(workspaceId);
    console.log("✓ Workspace:", workspace.name);
    console.log("  Connected accounts:");

    if (workspace.account.youtube) {
      console.log(`  - YouTube: ${workspace.account.youtube.name}`);
    }
    if (workspace.account.tiktok) {
      console.log(`  - TikTok: ${workspace.account.tiktok.name}`);
    }
    if (workspace.account.facebook) {
      console.log(`  - Facebook: ${workspace.account.facebook.name}`);
    }
    if (workspace.account.instagram) {
      console.log(`  - Instagram: ${workspace.account.instagram.name}`);
    }

    // 3. List all workspaces for this tag
    console.log("\nListing all e-commerce workspaces...");
    const workspaces = await client.list(
      {
        tag: "ecommerce",
      },
      {
        page: 1,
        pageSize: 10,
      },
    );
    console.log(`✓ Found ${workspaces.pagination.totalCount} workspaces`);

    // 4. Update workspace
    console.log("\nUpdating workspace...");
    await client.update(workspaceId, {
      name: "E-commerce Brand 2024 (Updated)",
      description: "Updated description",
      tag: "ecommerce",
      refId: "ECOM-WS-001",
    });
    console.log("✓ Workspace updated");

    // 5. Delete workspace
    console.log("\nDeleting workspace...");
    await client.delete(workspaceId);
    console.log("✓ Workspace deleted");
  } catch (error) {
    console.error("Error:", error.message);
    throw error;
  }
}

// Run the workflow
manageWorkspaces();
```

---

## 📘 TypeScript Support

Full TypeScript support with exported interfaces:

```typescript
import {
  // Client
  SocialPublisherWorkspaceClient,

  // Request interfaces
  ICreateWorkspaceRequest,
  IUpdateWorkspaceRequest,
  IListParams,

  // Response interfaces
  IWorkspaceResponse,
  ISearchWorkspaceResponse,
  IWorkspaceAccount,
  IAccountSampleDetails,
  IWorkspaceSampleDetails,

  // Types
  SocialPublisherAccountStatusType, // 'active' | 'inactive' | 'authenticationExpired'
} from "@posty5/social-publisher-workspace";
```

---

## 📦 Related Packages

This SDK ecosystem contains the following tool packages:

| Package | Description | Version | GitHub | NPM |
| --- | --- | --- | --- | --- |
| @posty5/short-link | URL shortener client | 1.0.1 | [📖 Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-short-link) | [📦 NPM](https://www.npmjs.com/package/@posty5/short-link) |
| @posty5/qr-code | QR code generator client | 1.0.1 | [📖 Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-qr-code) | [📦 NPM](https://www.npmjs.com/package/@posty5/qr-code) |
| @posty5/html-hosting | HTML hosting client | 1.0.1 | [📖 Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-html-hosting) | [📦 NPM](https://www.npmjs.com/package/@posty5/html-hosting) |
| @posty5/html-hosting-variables | HTML hosting variables client | 1.0.1 | [📖 Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-html-hosting-variables) | [📦 NPM](https://www.npmjs.com/package/@posty5/html-hosting-variables) |
| @posty5/html-hosting-form-submission | Form submission client | 1.0.1 | [📖 Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-html-hosting-form-submission) | [📦 NPM](https://www.npmjs.com/package/@posty5/html-hosting-form-submission) |
| @posty5/social-publisher-workspace | Social publisher workspace client | 1.0.1 | [📖 Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-social-publisher-workspace) | [📦 NPM](https://www.npmjs.com/package/@posty5/social-publisher-workspace) |
| @posty5/social-publisher-task | Social publisher task client | 1.0.1 | [📖 Docs](https://github.com/Posty5/npm-sdk/tree/main/posty5-social-publisher-task) | [📦 NPM](https://www.npmjs.com/package/@posty5/social-publisher-task) |

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
