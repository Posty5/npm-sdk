/**
 * Jest Setup File
 *
 * This file runs before all tests.
 * Create a .env.test file with your API credentials.
 */

// Load environment variables from .env.test
// import * as dotenv from 'dotenv';
// import { resolve } from 'path';
// import { existsSync } from 'fs';

// Try to load .env.test file, fallback to .env if it doesn't exist
// const envTestPath = resolve(__dirname, '../.env.test');
// const envPath = resolve(__dirname, '../.env');

// if (existsSync(envTestPath)) {
//     console.log('📄 Loading environment from .env.test');
//     dotenv.config({ path: envTestPath });
// } else if (existsSync(envPath)) {
//     console.log('📄 Loading environment from .env');
//     dotenv.config({ path: envPath });
// } else {
//     console.warn('⚠️  No .env.test or .env file found. Using environment variables or defaults.');
// }

// Global test configuration
export const TEST_CONFIG = {
  apiKey: process.env.POSTY5_API_KEY || "",
  baseUrl: process.env.POSTY5_BASE_URL || "https://api.posty5.com",
};

// Validate configuration (warning only, don't exit)
if (!TEST_CONFIG.apiKey) {
  console.warn("\n⚠️  WARNING: POSTY5_API_KEY is not set!");
  console.warn("Tests will fail without a valid API key.");
  console.warn("To fix this:");
  console.warn("  1. Copy .env.example to .env.test");
  console.warn("  2. Add your API key: POSTY5_API_KEY=your-key-here");
  console.warn("  3. Optionally set POSTY5_BASE_URL if using a different endpoint\n");
} else {
  console.log("✅ API Key loaded successfully");
  console.log(`🌐 Base URL: ${TEST_CONFIG.baseUrl}\n`);
}

/**
 * Store dropshipping fixtures (`store-suppliers.test.ts`). Every live store test
 * skips when `storeId` is empty, so a missing fixture is visible, not a failure.
 * The integration must be a `test`-mode connection so no money can move.
 */
export const STORE_TEST_CONFIG = {
  storeId: process.env.POSTY5_TEST_STORE_ID || "",
  supplierIntegrationId: process.env.POSTY5_TEST_SUPPLIER_INTEGRATION_ID || "",
  supplierProductId: process.env.POSTY5_TEST_SUPPLIER_PRODUCT_ID || "",
  productId: process.env.POSTY5_TEST_PRODUCT_ID || "",
};

// Global test timeout
jest.setTimeout(30000);

// Store created resource IDs for cleanup
export const createdResources: {
  shortLinks: string[];
  qrCodes: string[];
  htmlHostings: string[];
  workspaces: string[];
  posts: string[];
} = {
  shortLinks: [],
  qrCodes: [],
  htmlHostings: [],
  workspaces: [],
  posts: [],
};

// Cleanup function (optional - uncomment if you want auto-cleanup)
// afterAll(async () => {
//   console.log('Cleaning up test resources...');
//   // Add cleanup logic here
// });
