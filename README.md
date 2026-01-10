# Posty5 SDK

Official TypeScript/JavaScript SDK for the Posty5 API.

## 📦 Packages

This monorepo contains the following packages:

| Package | Description | Version |
|---------|-------------|---------|
| [@posty5/core](./posty5-core) | Core client and utilities | 1.0.0 |
| [@posty5/short-link](./posty5-short-link) | URL shortener client | 1.0.0 |
| [@posty5/qr-code](./posty5-qr-code) | QR code generator client | 1.0.0 |
| [@posty5/html-hosting](./posty5-html-hosting) | HTML hosting client | 1.0.0 |
| [@posty5/html-hosting-variables](./posty5-html-hosting-variables) | HTML hosting variables client | 1.0.0 |
| [@posty5/html-hosting-form-submission](./posty5-html-hosting-form-submission) | Form submission client | 1.0.0 |
| [@posty5/social-publisher-workspace](./posty5-social-publisher-workspace) | Social publisher workspace client | 1.0.0 |
| [@posty5/social-publisher-task](./posty5-social-publisher-task) | Social publisher task client | 1.0.0 |

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
});

console.log('Short URL:', result.data?.shortUrl);
```

## 🧪 Testing

### Run All Tests

```bash
# Install dependencies first
npm install

# Run the test suite
npm test
```

### Configure Tests

1. Open `test.ts`
2. Replace `YOUR_API_KEY` with your actual API key
3. Run `npm test`

The test suite will:
- ✅ Test all SDK packages
- ✅ Verify API connectivity
- ✅ Display detailed results
- ✅ Show pass/fail summary

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

```typescript
import { ShortLinkClient } from '@posty5/short-link';

const client = new ShortLinkClient(posty5);

// Create short link
await client.create({ targetUrl: 'https://example.com' });

// Get all links
await client.getAll({ page: 1, take: 10 });

// Get by ID
await client.getById('link-id');

// Update
await client.update('link-id', { title: 'New Title' });

// Delete
await client.delete('link-id');
```

### QR Code Package
Generate and manage QR codes.

```typescript
import { QRCodeClient } from '@posty5/qr-code';

const client = new QRCodeClient(posty5);

// Create QR code for URL
await client.createUrl({ url: 'https://example.com' });

// Create QR code for email
await client.createEmail({ email: 'test@example.com' });

// Create QR code for WiFi
await client.createWifi({
  ssid: 'MyNetwork',
  password: 'password123',
  encryption: 'WPA',
});

// Get all QR codes
await client.getAll({ page: 1, take: 10 });
```

### HTML Hosting Package
Deploy and manage static HTML pages.

```typescript
import { HtmlHostingClient } from '@posty5/html-hosting';

const client = new HtmlHostingClient(posty5);

// Create hosted page
await client.create({
  title: 'My Page',
  htmlContent: '<h1>Hello World</h1>',
});

// Get all pages
await client.getAll({ page: 1, take: 10 });

// Update page
await client.update('page-id', { title: 'Updated Title' });
```

### Social Publisher Workspace Package
Manage social media publishing workspaces.

```typescript
import { SocialPublisherWorkspaceClient } from '@posty5/social-publisher-workspace';

const client = new SocialPublisherWorkspaceClient(posty5);

// Create workspace
await client.create({
  name: 'My Workspace',
  description: 'Social media workspace',
});

// Get all workspaces
await client.getAll({ page: 1, take: 10 });

// Get workspace details
await client.getById('workspace-id');
```

### Social Publisher Task Package
Create and manage social media publishing tasks.

```typescript
import { SocialPublisherTaskClient } from '@posty5/social-publisher-task';

const client = new SocialPublisherTaskClient(posty5);

// Create task
await client.create({
  workspaceId: 'workspace-id',
  title: 'My Post',
  description: 'Post description',
  scheduledAt: new Date(),
});

// Get all tasks
await client.getAll({ page: 1, take: 10 });

// Get task by ID
await client.getById('task-id');
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

### Project Structure

```
posty5-sdk/
├── posty5-core/                    # Core package
├── posty5-short-link/              # Short link package
├── posty5-qr-code/                 # QR code package
├── posty5-html-hosting/            # HTML hosting package
├── posty5-html-hosting-variables/  # HTML hosting variables
├── posty5-html-hosting-form-submission/ # Form submissions
├── posty5-social-publisher-workspace/   # Social publisher workspaces
├── posty5-social-publisher-task/   # Social publisher tasks
├── test.ts                         # Test suite
├── package.json                    # Monorepo config
└── README.md                       # This file
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
