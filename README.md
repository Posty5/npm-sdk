# Posty5 SDK

Official TypeScript/JavaScript SDK for the Posty5 API - A comprehensive toolkit for URL shortening, QR code generation, HTML hosting, and social media publishing.

## 📦 Packages

This monorepo contains the following packages:

| Package | Description | Version | NPM |
|---------|-------------|---------|-----|
| [@posty5/core](./posty5-core) | Core client and utilities | 1.0.0 | `npm install @posty5/core` |
| [@posty5/short-link](./posty5-short-link) | URL shortener client | 1.0.0 | `npm install @posty5/short-link` |
| [@posty5/qr-code](./posty5-qr-code) | QR code generator client | 1.0.0 | `npm install @posty5/qr-code` |
| [@posty5/html-hosting](./posty5-html-hosting) | HTML hosting client | 1.0.0 | `npm install @posty5/html-hosting` |
| [@posty5/html-hosting-variables](./posty5-html-hosting-variables) | HTML hosting variables client | 1.0.0 | `npm install @posty5/html-hosting-variables` |
| [@posty5/html-hosting-form-submission](./posty5-html-hosting-form-submission) | Form submission client | 1.0.0 | `npm install @posty5/html-hosting-form-submission` |
| [@posty5/social-publisher-workspace](./posty5-social-publisher-workspace) | Social publisher workspace client | 1.0.0 | `npm install @posty5/social-publisher-workspace` |
| [@posty5/social-publisher-task](./posty5-social-publisher-task) | Social publisher task client | 1.0.0 | `npm install @posty5/social-publisher-task` |

## 🚀 Quick Start

### Installation

```bash
# Install core package (required)
npm install @posty5/core

# Install specific tools you need
npm install @posty5/short-link
npm install @posty5/qr-code
npm install @posty5/html-hosting
npm install @posty5/social-publisher-workspace
npm install @posty5/social-publisher-task
```

### Basic Usage

```typescript
import { Posty5Client } from '@posty5/core';
import { ShortLinkClient } from '@posty5/short-link';

// Initialize the core client
const posty5 = new Posty5Client({
  apiKey: 'your-api-key',
  baseURL: 'https://api.posty5.com',
});

// Use a specific tool client
const shortLinkClient = new ShortLinkClient(posty5);

// Create a short link
const result = await shortLinkClient.create({
  targetUrl: 'https://example.com',
  title: 'My Short Link',
  tag: 'marketing',        // Optional: Tag for categorization
  refId: 'campaign-123',   // Optional: Your custom reference ID
});

console.log('Short URL:', result.items?.shortUrl);
```

## 🏷️ Tag and RefId Features

All SDK packages support two powerful fields for organizing and tracking your resources:

### Tag Field
Use tags to categorize and organize your resources:

```typescript
// Create resources with tags
await shortLinkClient.create({
  targetUrl: 'https://example.com',
  tag: 'marketing',  // Categorize by campaign type
});

await htmlHostingClient.create({
  title: 'Landing Page',
  htmlContent: '<h1>Hello</h1>',
  tag: 'product-launch',  // Tag by project
});

// Filter by tag
const marketingLinks = await shortLinkClient.getAll({
  page: 1,
  take: 10,
  tag: 'marketing',  // Get all marketing links
});
```

### RefId Field
Use `refId` to link Posty5 resources with your external system:

```typescript
// Create with your system's ID
await shortLinkClient.create({
  targetUrl: 'https://example.com',
  refId: 'order-12345',  // Your order ID
});

await workspaceClient.create({
  name: 'Client Workspace',
  refId: 'client-abc-123',  // Your client ID
});

// Find resources by your reference ID
const orderLink = await shortLinkClient.getAll({
  page: 1,
  take: 10,
  refId: 'order-12345',  // Find by your order ID
});
```

### Combined Usage
Use both fields together for powerful organization:

```typescript
await taskClient.create({
  workspaceId: 'workspace-id',
  title: 'Social Post',
  tag: 'black-friday',      // Campaign tag
  refId: 'promo-2024-11',   // Your promotion ID
});

// Filter by both
const campaignTasks = await taskClient.getAll({
  page: 1,
  take: 10,
  tag: 'black-friday',
  refId: 'promo-2024-11',
});
```

## 🔑 API Key Filtering

All resources are automatically associated with the API key used to create them. You can filter resources by API key:

```typescript
// Filter resources by API key
const resources = await shortLinkClient.getAll({
  page: 1,
  take: 10,
  apiKeyId: 'your-api-key-id',  // Filter by specific API key
});
```

This is useful for:
- Multi-tenant applications
- Separating resources by environment (dev/staging/prod)
- Tracking resource usage per API key

## 📚 Package Documentation

### Core Package
The foundation package that all other packages depend on.

```typescript
import { Posty5Client } from '@posty5/core';

const client = new Posty5Client({
  apiKey: 'your-api-key',
  baseURL: 'https://api.posty5.com',
});
```

### Short Link Package
Create and manage shortened URLs.

**Available Methods:**
- `create(data)` - Create a new short link
- `getAll(params)` - List all short links with pagination
- `getById(id)` - Get a specific short link
- `update(id, data)` - Update a short link
- `delete(id)` - Delete a short link

```typescript
import { ShortLinkClient } from '@posty5/short-link';

const client = new ShortLinkClient(posty5);

// Create short link
const link = await client.create({ 
  targetUrl: 'https://example.com',
  title: 'My Link',
  tag: 'social-media',
  refId: 'post-123',
});

// Get all links with filters
const links = await client.getAll({ 
  page: 1, 
  take: 10,
  tag: 'social-media',
  apiKeyId: 'key-id',
});

// Get by ID
const link = await client.getById('link-id');

// Update
await client.update('link-id', { title: 'New Title' });

// Delete
await client.delete('link-id');
```

### QR Code Package
Generate and manage QR codes for various purposes.

**Available Methods:**
- `createUrl(data)` - Create QR code for URL
- `createEmail(data)` - Create QR code for email
- `createWifi(data)` - Create QR code for WiFi
- `createPhone(data)` - Create QR code for phone
- `createSms(data)` - Create QR code for SMS
- `createVCard(data)` - Create QR code for contact card
- `getAll(params)` - List all QR codes
- `getById(id)` - Get a specific QR code
- `update(id, data)` - Update a QR code
- `delete(id)` - Delete a QR code

```typescript
import { QRCodeClient } from '@posty5/qr-code';

const client = new QRCodeClient(posty5);

// Create QR code for URL
const qr = await client.createUrl({
  url: 'https://example.com',
  title: 'My QR Code',
  tag: 'event',
  refId: 'event-2024',
});

// Create QR code for email
await client.createEmail({
  email: 'test@example.com',
  subject: 'Hello',
  body: 'Message',
  tag: 'contact',
});

// Create QR code for WiFi
await client.createWifi({
  ssid: 'MyNetwork',
  password: 'password123',
  encryption: 'WPA',
  tag: 'office-wifi',
});

// Get all QR codes with filters
const codes = await client.getAll({ 
  page: 1, 
  take: 10,
  targetType: 'url',
  tag: 'event',
});
```

### HTML Hosting Package
Deploy and manage static HTML pages.

**Available Methods:**
- `create(data)` - Create a new hosted page
- `getAll(params)` - List all hosted pages
- `getById(id)` - Get a specific page
- `update(id, data)` - Update a page
- `delete(id)` - Delete a page

```typescript
import { HtmlHostingClient } from '@posty5/html-hosting';

const client = new HtmlHostingClient(posty5);

// Create hosted page
const page = await client.create({
  title: 'My Page',
  htmlContent: '<h1>Hello World</h1>',
  tag: 'landing-pages',
  refId: 'campaign-landing-1',
});

// Get all pages with filters
const pages = await client.getAll({ 
  page: 1, 
  take: 10,
  tag: 'landing-pages',
  isEnableMonetization: true,
});

// Update page
await client.update('page-id', { 
  title: 'Updated Title',
  tag: 'updated-pages',
});
```

### HTML Hosting Variables Package
Manage dynamic variables for HTML pages.

**Available Methods:**
- `create(data)` - Create a new variable
- `getAll(params)` - List all variables
- `getById(id)` - Get a specific variable
- `update(id, data)` - Update a variable
- `delete(id)` - Delete a variable

```typescript
import { HtmlHostingVariablesClient } from '@posty5/html-hosting-variables';

const client = new HtmlHostingVariablesClient(posty5);

// Create variable
await client.create({
  name: 'API_URL',
  key: 'api_url',
  value: 'https://api.example.com',
  tag: 'production',
  refId: 'env-prod',
});

// Filter by tag
const prodVars = await client.getAll({
  page: 1,
  take: 10,
  tag: 'production',
});
```

### Social Publisher Workspace Package
Manage social media publishing workspaces.

**Available Methods:**
- `create(data)` - Create a new workspace
- `getAll(params)` - List all workspaces
- `getById(id)` - Get a specific workspace
- `update(id, data)` - Update a workspace
- `delete(id)` - Delete a workspace

```typescript
import { SocialPublisherWorkspaceClient } from '@posty5/social-publisher-workspace';

const client = new SocialPublisherWorkspaceClient(posty5);

// Create workspace
const workspace = await client.create({
  name: 'My Workspace',
  description: 'Social media workspace',
  tag: 'client-a',
  refId: 'client-a-workspace-1',
});

// Get all workspaces for a client
const clientWorkspaces = await client.getAll({ 
  page: 1, 
  take: 10,
  tag: 'client-a',
});

// Get workspace details
const details = await client.getById('workspace-id');
```

### Social Publisher Task Package
Create and manage social media publishing tasks.

**Available Methods:**
- `create(data)` - Create a new task
- `getAll(params)` - List all tasks
- `getById(id)` - Get a specific task
- `update(id, data)` - Update a task
- `delete(id)` - Delete a task

```typescript
import { SocialPublisherTaskClient } from '@posty5/social-publisher-task';

const client = new SocialPublisherTaskClient(posty5);

// Create task
const task = await client.create({
  workspaceId: 'workspace-id',
  title: 'My Post',
  description: 'Post description',
  scheduledAt: new Date(),
  tag: 'campaign-2024',
  refId: 'post-abc-123',
});

// Get all tasks for a campaign
const campaignTasks = await client.getAll({ 
  page: 1, 
  take: 10,
  tag: 'campaign-2024',
  status: 'pending',
});

// Get task by your reference ID
const myTask = await client.getAll({
  page: 1,
  take: 1,
  refId: 'post-abc-123',
});
```

## 🔍 Advanced Filtering

All `getAll()` methods support comprehensive filtering:

```typescript
// Combine multiple filters
const results = await shortLinkClient.getAll({
  page: 1,
  take: 20,
  search: 'keyword',        // Search in title/description
  tag: 'marketing',         // Filter by tag
  refId: 'campaign-123',    // Filter by your reference ID
  apiKeyId: 'key-id',       // Filter by API key
  // ... other package-specific filters
});
```

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

## 📖 API Reference

For detailed API documentation, visit: [https://docs.posty5.com](https://docs.posty5.com)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## 💡 Best Practices

### Using Tags
- Use consistent tag naming conventions
- Examples: `marketing`, `product-launch`, `client-name`
- Tags are case-sensitive
- Use tags for categorization and filtering

### Using RefId
- Use `refId` to link with your system's IDs
- Examples: `order-123`, `user-abc`, `campaign-2024-q1`
- Helps maintain relationships between systems
- Makes it easy to find resources created for specific entities

### Using API Key Filtering
- Separate resources by environment (dev/staging/prod)
- Track resource usage per API key
- Implement multi-tenant applications

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- [Website](https://posty5.com)
- [API Documentation](https://docs.posty5.com)
- [Support](https://posty5.com/support)

## 🆘 Support

- Email: support@posty5.com
- Issues: [GitHub Issues](https://github.com/posty5/sdk/issues)
- Discord: [Join our community](https://discord.gg/posty5)

---

Made with ❤️ by the Posty5 team
