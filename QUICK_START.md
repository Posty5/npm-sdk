# Posty5 SDK - Quick Start Guide

## 🎯 Getting Started in 3 Steps

### Step 1: Install Dependencies

```bash
cd posty5-sdk
npm install
```

### Step 2: Configure Your API Key

Open `test.ts` and replace the API key:

```typescript
const API_KEY = 'your-actual-api-key-here';
```

### Step 3: Run Tests

```bash
npm test
```

## 📦 What's Included

### 8 SDK Packages Ready to Use:

1. **@posty5/core** - Core client (required)
2. **@posty5/short-link** - URL shortener
3. **@posty5/qr-code** - QR code generator
4. **@posty5/html-hosting** - HTML page hosting
5. **@posty5/html-hosting-variables** - Dynamic variables
6. **@posty5/html-hosting-form-submission** - Form handling
7. **@posty5/social-publisher-workspace** - Social media workspaces
8. **@posty5/social-publisher-task** - Social media tasks

## 🏷️ Using Tags and RefId

### What are Tags?
Tags help you categorize and organize your resources. Think of them as labels you can use to group related items.

**Examples:**
- `marketing` - For marketing campaigns
- `client-abc` - For a specific client
- `product-launch` - For product launch materials
- `black-friday` - For seasonal campaigns

### What is RefId?
RefId (Reference ID) is your custom identifier that links Posty5 resources with your external system.

**Examples:**
- `order-12345` - Link to your order system
- `user-abc-123` - Link to your user ID
- `campaign-2024-q1` - Link to your campaign ID
- `project-xyz` - Link to your project management system

### How to Use Them

```typescript
import { Posty5Client } from '@posty5/core';
import { ShortLinkClient } from '@posty5/short-link';

const posty5 = new Posty5Client({ apiKey: 'your-key' });
const client = new ShortLinkClient(posty5);

// Create a resource with tag and refId
const link = await client.create({
  targetUrl: 'https://example.com/product',
  title: 'Product Page',
  tag: 'product-launch',      // Tag for categorization
  refId: 'product-123',        // Your product ID
});

// Later, find all resources for this product
const productLinks = await client.getAll({
  page: 1,
  take: 10,
  refId: 'product-123',  // Find by your product ID
});

// Or find all product launch materials
const launchMaterials = await client.getAll({
  page: 1,
  take: 10,
  tag: 'product-launch',  // Find by tag
});
```

## 🧪 Test Suite Features

The test suite demonstrates all features:

- ✅ Tests all 8 packages
- ✅ Verifies API connectivity
- ✅ Shows detailed results
- ✅ Provides pass/fail summary
- ✅ Demonstrates tag and refId usage

## 🧪 Test Output Example

```
╔════════════════════════════════════════╗
║   Posty5 SDK Test Suite                ║
╚════════════════════════════════════════╝

🔗 Testing Short Link Client...
✅ Created short link: https://p5.to/abc123
✅ Retrieved 5 short links

📱 Testing QR Code Client...
✅ Created QR code: https://qr.posty5.com/xyz789
✅ Retrieved 3 QR codes

... (more tests)

╔════════════════════════════════════════╗
║   Test Results Summary                 ║
╚════════════════════════════════════════╝

✅ shortLink                PASSED
✅ qrCode                   PASSED
✅ htmlHosting              PASSED
✅ htmlHostingVariables     PASSED
✅ formSubmission           PASSED
✅ workspace                PASSED
✅ task                     PASSED

📊 Total: 7/7 tests passed
🎉 All tests passed!
```

## 🔧 Development Commands

```bash
# Run tests
npm test

# Build all packages
npm run build:all

# Clean build artifacts
npm run clean
```

## 📚 Usage Examples

### Create a Short Link with Tag and RefId

```typescript
import { Posty5Client } from '@posty5/core';
import { ShortLinkClient } from '@posty5/short-link';

const posty5 = new Posty5Client({ apiKey: 'your-key' });
const client = new ShortLinkClient(posty5);

const link = await client.create({
  targetUrl: 'https://example.com',
  title: 'My Link',
  tag: 'email-campaign',       // Categorize by campaign type
  refId: 'email-2024-01-10',   // Your email campaign ID
});

console.log(link.data?.shortUrl);
```

### Generate a QR Code for an Event

```typescript
import { QRCodeClient } from '@posty5/qr-code';

const client = new QRCodeClient(posty5);

const qr = await client.createUrl({
  url: 'https://event.example.com',
  title: 'Event Registration',
  tag: 'conference-2024',       // Event tag
  refId: 'event-reg-001',       // Your event ID
});

console.log(qr.data?.qrCodeUrl);
```

### Create a Workspace for a Client

```typescript
import { SocialPublisherWorkspaceClient } from '@posty5/social-publisher-workspace';

const client = new SocialPublisherWorkspaceClient(posty5);

const workspace = await client.create({
  name: 'Client ABC Workspace',
  description: 'Social media management for Client ABC',
  tag: 'client-abc',            // Client tag
  refId: 'client-abc-main',     // Your client ID
});

console.log(workspace.data?._id);
```

### Filter Resources by Tag

```typescript
// Get all resources tagged with 'marketing'
const marketingLinks = await shortLinkClient.getAll({
  page: 1,
  take: 10,
  tag: 'marketing',
});

console.log(`Found ${marketingLinks.data?.items.length} marketing links`);
```

### Filter Resources by RefId

```typescript
// Get all resources linked to order-12345
const orderResources = await shortLinkClient.getAll({
  page: 1,
  take: 10,
  refId: 'order-12345',
});

console.log(`Found ${orderResources.data?.items.length} resources for this order`);
```

### Filter by API Key

```typescript
// Get resources created with a specific API key
const resources = await shortLinkClient.getAll({
  page: 1,
  take: 10,
  apiKeyId: 'your-api-key-id',
});

console.log(`Found ${resources.data?.items.length} resources`);
```

## 💡 Pro Tips

### Organizing with Tags
1. **Use consistent naming** - Stick to a naming convention (e.g., lowercase with hyphens)
2. **Be specific** - `product-launch-2024` is better than just `launch`
3. **Use hierarchies** - `client-abc-campaign-1`, `client-abc-campaign-2`

### Using RefId Effectively
1. **Link to your system** - Use your database IDs
2. **Make it unique** - Ensure refId is unique within your system
3. **Use prefixes** - `order-123`, `user-456`, `campaign-789`

### Combining Filters
```typescript
// Find specific resources with multiple filters
const results = await client.getAll({
  page: 1,
  take: 10,
  tag: 'marketing',
  refId: 'campaign-2024-q1',
  apiKeyId: 'prod-api-key',
  search: 'product',
});
```

## 🎓 Next Steps

1. ✅ Run the test suite to verify everything works
2. 📖 Read the full [README.md](./README.md) for detailed documentation
3. 🔍 Explore individual package READMEs in each folder
4. 💻 Start building your application!
5. 🏷️ Use tags and refId to organize your resources
6. 🔑 Leverage API key filtering for multi-tenant apps

## 🆘 Need Help?

- 📧 Email: support@posty5.com
- 📚 Docs: https://docs.posty5.com
- 💬 Discord: https://discord.gg/posty5

## 📋 Common Use Cases

### E-commerce Platform
```typescript
// Create short links for products
await shortLinkClient.create({
  targetUrl: 'https://shop.com/product/123',
  title: 'Product 123',
  tag: 'products',
  refId: 'product-123',  // Your product ID
});

// Later, get all links for a product
const productLinks = await shortLinkClient.getAll({
  refId: 'product-123',
});
```

### Marketing Agency
```typescript
// Create workspace for each client
await workspaceClient.create({
  name: 'Client ABC',
  tag: 'client-abc',
  refId: 'client-abc-001',  // Your CRM client ID
});

// Create tasks for campaigns
await taskClient.create({
  workspaceId: 'workspace-id',
  title: 'Black Friday Post',
  tag: 'black-friday-2024',
  refId: 'campaign-bf-2024',  // Your campaign ID
});
```

### SaaS Application
```typescript
// Separate resources by environment
await htmlHostingClient.create({
  title: 'Landing Page',
  htmlContent: '<h1>Hello</h1>',
  tag: 'production',
  refId: 'landing-v2',
});

// Filter by environment
const prodPages = await htmlHostingClient.getAll({
  tag: 'production',
  apiKeyId: 'prod-api-key',
});
```

---

**Happy coding! 🚀**
