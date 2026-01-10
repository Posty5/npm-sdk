/**
 * Jest Setup File
 * 
 * This file runs before all tests.
 * Configure your API key and base URL here.
 */

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config();

// Global test configuration
export const TEST_CONFIG = {
    apiKey: process.env.POSTY5_API_KEY || 'YOUR_API_KEY',
    baseURL: process.env.POSTY5_BASE_URL || 'https://api.posty5.com',
};

// Validate configuration
if (TEST_CONFIG.apiKey === 'YOUR_API_KEY') {
    console.warn('\n⚠️  WARNING: Using default API key. Set POSTY5_API_KEY environment variable for real tests.\n');
}

// Global test timeout
jest.setTimeout(30000);

// Store created resource IDs for cleanup
export const createdResources: {
    shortLinks: string[];
    qrCodes: string[];
    htmlHostings: string[];
    workspaces: string[];
    tasks: string[];
} = {
    shortLinks: [],
    qrCodes: [],
    htmlHostings: [],
    workspaces: [],
    tasks: [],
};

// Cleanup function (optional - uncomment if you want auto-cleanup)
// afterAll(async () => {
//   console.log('Cleaning up test resources...');
//   // Add cleanup logic here
// });
