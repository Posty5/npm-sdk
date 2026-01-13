# Posty5 SDK Tests

This directory contains integration tests for all Posty5 SDK packages.

## 🚀 Quick Start

### 1. Setup Environment Variables

Copy the example environment file and add your API key:

```bash
# Option 1: Create .env.test (recommended)
cp .env.example .env.test

# Option 2: Create .env (also works)
cp .env.example .env
```

Then edit the file and add your Posty5 API key:

```bash
POSTY5_API_KEY=your-actual-api-key-here
POSTY5_BASE_URL=https://api.posty5.com  # Optional, defaults to production
```

### 2. Run Tests

```bash
# Run all tests
npm test

# Run specific SDK tests
npm test -- html-hosting.test.ts
npm test -- short-link.test.ts
npm test -- qr-code.test.ts
npm test -- social-publisher-task.test.ts
npm test -- social-publisher-workspace.test.ts

# Run in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage
```

## 📁 Test Files

- `setup.ts` - Global test configuration and setup
- `html-hosting.test.ts` - HTML Hosting SDK tests (100% coverage ✅)
- `short-link.test.ts` - Short Link SDK tests (100% coverage ✅)
- `qr-code.test.ts` - QR Code SDK tests (61% coverage ⚠️)
- `social-publisher-task.test.ts` - Social Publisher Task SDK tests (47% coverage ⚠️)
- `social-publisher-workspace.test.ts` - Social Publisher Workspace SDK tests (100% coverage ✅)

## 🔧 Configuration

### Environment Variables

The tests use the following environment variables:

- `POSTY5_API_KEY` **(required)** - Your Posty5 API key
- `POSTY5_BASE_URL` *(optional)* - API base URL (defaults to `https://api.posty5.com`)

### Test Timeout

Default timeout is set to 30 seconds to accommodate API calls. You can adjust this in `jest.config.js`.

## 📊 Test Coverage

See `TEST_COVERAGE_ANALYSIS.md` for detailed coverage information.

Current overall coverage: **~74%**

## ⚠️ Troubleshooting

### "TEST_CONFIG is undefined"

This happens when the environment variables aren't loaded. To fix:

1. Make sure you've created either `.env.test` or `.env` file
2. Verify the file contains `POSTY5_API_KEY=your-key`
3. Check that the file is in the `posty5-sdk` root directory (not in `__tests__`)

### "API Key is not set" warning

If you see this warning but have set the API key:

1. Check the file name is exactly `.env.test` or `.env` (not `.env.txt`)
2. Ensure there are no extra spaces around the `=` sign
3. Try running tests with: `POSTY5_API_KEY=your-key npm test`

### Tests are failing

1. Verify your API key is valid and active
2. Check your internet connection
3. Ensure the API endpoint is accessible
4. Some tests create resources - make sure you have sufficient quota

## 🧹 Cleanup

Tests create resources (short links, QR codes, HTML pages, etc.) during execution. Currently, automatic cleanup is disabled. To enable it:

1. Uncomment the `afterAll` block in `setup.ts`
2. Implement cleanup logic for each resource type

## 📝 Writing New Tests

When adding tests for new SDK packages:

1. **Only test public methods** - Skip private/internal methods
2. **Follow the existing pattern** - See `html-hosting.test.ts` as a reference
3. **Include error cases** - Test with invalid inputs
4. **Use descriptive names** - Make test names clear and specific
5. **Clean up resources** - Add created IDs to `createdResources`

Example test structure:

```typescript
describe('SDK Name', () => {
    let httpClient: HttpClient;
    let client: ClientClass;
    let createdId: string;

    beforeAll(() => {
        httpClient = new HttpClient({
            apiKey: TEST_CONFIG.apiKey,
            baseUrl: TEST_CONFIG.baseUrl,
        });
        client = new ClientClass(httpClient);
    });

    describe('METHOD_NAME', () => {
        it('should [success case]', async () => {
            const result = await client.method(params);
            expect(result).toBeDefined();
            createdId = result._id;
            createdResources.resourceType.push(createdId);
        });

        it('should fail with invalid input', async () => {
            await expect(
                client.method('invalid')
            ).rejects.toThrow();
        });
    });
});
```

## 📚 Documentation

- `TEST_COVERAGE_ANALYSIS.md` - Detailed coverage analysis and missing tests
- `SCAN_AND_FIX_SUMMARY.md` - Summary of recent test improvements
- `TESTING.md` - General testing guidelines (if exists)

## 🤝 Contributing

When contributing tests:

1. Ensure all new tests pass locally
2. Maintain or improve coverage
3. Follow existing code style
4. Update documentation if needed
5. Don't commit `.env.test` or `.env` files (they're gitignored)

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the test documentation files
3. Ensure your API key has the necessary permissions
4. Contact the Posty5 team for API-related issues
