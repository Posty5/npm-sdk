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

### Test Suite Features:

- ✅ Tests all 8 packages
- ✅ Verifies API connectivity
- ✅ Shows detailed results
- ✅ Provides pass/fail summary

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

### Create a Short Link

```typescript
import { Posty5Client } from '@posty5/core';
import { ShortLinkClient } from '@posty5/short-link';

const posty5 = new Posty5Client({ apiKey: 'your-key' });
const client = new ShortLinkClient(posty5);

const link = await client.create({
  targetUrl: 'https://example.com',
  title: 'My Link',
});

console.log(link.data?.shortUrl);
```

### Generate a QR Code

```typescript
import { QRCodeClient } from '@posty5/qr-code';

const client = new QRCodeClient(posty5);

const qr = await client.createUrl({
  url: 'https://example.com',
  title: 'My QR Code',
});

console.log(qr.data?.qrCodeUrl);
```

### Create a Workspace

```typescript
import { SocialPublisherWorkspaceClient } from '@posty5/social-publisher-workspace';

const client = new SocialPublisherWorkspaceClient(posty5);

const workspace = await client.create({
  name: 'My Workspace',
  description: 'Social media management',
});

console.log(workspace.data?._id);
```

## 🎓 Next Steps

1. ✅ Run the test suite to verify everything works
2. 📖 Read the full [README.md](./README.md) for detailed documentation
3. 🔍 Explore individual package READMEs in each folder
4. 💻 Start building your application!

## 🆘 Need Help?

- 📧 Email: support@posty5.com
- 📚 Docs: https://docs.posty5.com
- 💬 Discord: https://discord.gg/posty5

---

**Happy coding! 🚀**
