# Posty5 SDK Testing Guide

## 🧪 Jest Test Suite

This SDK uses Jest for comprehensive testing of all CRUD operations across all packages.

## 📋 Test Coverage

Each SDK package has complete test coverage for:

- ✅ **CREATE** - Creating new resources
- ✅ **GET BY ID** - Retrieving specific resources
- ✅ **GET LIST** - Listing resources with pagination
- ✅ **UPDATE** - Modifying existing resources
- ✅ **DELETE** - Removing resources

### Tested Packages:

1. **Short Link** - `__tests__/short-link.test.ts`
2. **QR Code** - `__tests__/qr-code.test.ts`
3. **HTML Hosting** - `__tests__/html-hosting.test.ts`
4. **Social Publisher Workspace** - `__tests__/social-publisher-workspace.test.ts`
5. **Social Publisher Task** - `__tests__/social-publisher-task.test.ts`

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure API Key

**Option A: Using .env file (Recommended)**

```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your API key
POSTY5_API_KEY=your-actual-api-key
```

**Option B: Using environment variables**

```bash
# Windows PowerShell
$env:POSTY5_API_KEY="your-api-key"

# Linux/Mac
export POSTY5_API_KEY="your-api-key"
```

### 3. Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📊 Test Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode (auto-rerun on changes) |
| `npm run test:coverage` | Run tests with coverage report |

## 🎯 Test Structure

### Example Test File Structure

```typescript
describe('Package Name SDK', () => {
  // Setup
  beforeAll(() => {
    // Initialize clients
  });

  describe('CREATE', () => {
    it('should create a resource', async () => {
      // Test creation
    });
    
    it('should fail without required fields', async () => {
      // Test validation
    });
  });

  describe('GET BY ID', () => {
    it('should get resource by ID', async () => {
      // Test retrieval
    });
    
    it('should fail with invalid ID', async () => {
      // Test error handling
    });
  });

  describe('GET LIST', () => {
    it('should get list of resources', async () => {
      // Test listing
    });
    
    it('should support pagination', async () => {
      // Test pagination
    });
    
    it('should support search', async () => {
      // Test search
    });
  });

  describe('UPDATE', () => {
    it('should update resource', async () => {
      // Test update
    });
    
    it('should fail with invalid ID', async () => {
      // Test error handling
    });
  });

  describe('DELETE', () => {
    it('should delete resource', async () => {
      // Test deletion
    });
    
    it('should fail with invalid ID', async () => {
      // Test error handling
    });
  });
});
```

## 📈 Coverage Reports

After running `npm run test:coverage`, you'll find coverage reports in:

- **Terminal** - Summary in console
- **coverage/lcov-report/index.html** - Detailed HTML report
- **coverage/lcov.info** - LCOV format for CI/CD

### Viewing HTML Coverage Report

```bash
# Windows
start coverage/lcov-report/index.html

# Mac
open coverage/lcov-report/index.html

# Linux
xdg-open coverage/lcov-report/index.html
```

## 🔍 Test Output Example

```
 PASS  __tests__/short-link.test.ts
  Short Link SDK
    CREATE
      ✓ should create a short link (245ms)
      ✓ should fail to create without required fields (12ms)
    GET BY ID
      ✓ should get short link by ID (156ms)
      ✓ should fail with invalid ID (45ms)
    GET LIST
      ✓ should get list of short links (189ms)
      ✓ should support pagination (234ms)
      ✓ should support search (167ms)
    UPDATE
      ✓ should update short link (198ms)
      ✓ should fail to update with invalid ID (34ms)
    DELETE
      ✓ should delete short link (123ms)
      ✓ should fail to delete with invalid ID (28ms)

Test Suites: 1 passed, 1 total
Tests:       11 passed, 11 total
Snapshots:   0 total
Time:        3.456s
```

## 🛠️ Writing Custom Tests

### Adding a New Test

1. Create a new file in `__tests__/` directory
2. Follow the naming convention: `package-name.test.ts`
3. Import required dependencies
4. Write test suites using `describe` and `it`

### Example Custom Test

```typescript
import { Posty5Client } from '@posty5/core';
import { YourClient } from '@posty5/your-package';
import { TEST_CONFIG } from './setup';

describe('Your Package SDK', () => {
  let client: YourClient;

  beforeAll(() => {
    const posty5 = new Posty5Client({
      apiKey: TEST_CONFIG.apiKey,
      baseURL: TEST_CONFIG.baseURL,
    });
    client = new YourClient(posty5);
  });

  it('should do something', async () => {
    const result = await client.someMethod();
    expect(result.success).toBe(true);
  });
});
```

## 🐛 Debugging Tests

### Run Specific Test File

```bash
npm test short-link.test.ts
```

### Run Specific Test Suite

```bash
npm test -- --testNamePattern="CREATE"
```

### Run with Verbose Output

```bash
npm test -- --verbose
```

## ⚙️ Configuration

### Jest Configuration (`jest.config.js`)

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  testTimeout: 30000, // 30 seconds for API calls
};
```

### Test Setup (`__tests__/setup.ts`)

- Loads environment variables
- Configures API key and base URL
- Sets global test timeout
- Tracks created resources for cleanup

## 📝 Best Practices

1. **Always clean up** - Delete created resources after tests
2. **Use unique identifiers** - Add timestamps to test data
3. **Test error cases** - Verify proper error handling
4. **Mock when needed** - Mock external dependencies
5. **Keep tests independent** - Each test should work standalone
6. **Use descriptive names** - Make test names clear and specific

## 🔒 Security

- **Never commit** `.env` files with real API keys
- **Use test accounts** - Don't test with production data
- **Rotate keys** - Change API keys regularly
- **Limit permissions** - Use API keys with minimal required permissions

## 🆘 Troubleshooting

### Tests Timeout

Increase timeout in `jest.config.js`:
```javascript
testTimeout: 60000 // 60 seconds
```

### API Key Not Found

Make sure `.env` file exists and contains:
```
POSTY5_API_KEY=your-key-here
```

### Tests Fail with 401 Unauthorized

- Check your API key is valid
- Verify the key has necessary permissions
- Ensure the key hasn't expired

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Posty5 API Docs](https://docs.posty5.com)
- [TypeScript Testing](https://jestjs.io/docs/getting-started#using-typescript)

---

**Happy Testing! 🧪✨**
