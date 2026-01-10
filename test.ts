import { Posty5Client } from '@posty5/core';
import { ShortLinkClient } from '@posty5/short-link';
import { QRCodeClient } from '@posty5/qr-code';
import { HtmlHostingClient } from '@posty5/html-hosting';
import { HtmlHostingVariablesClient } from '@posty5/html-hosting-variables';
import { HtmlHostingFormSubmissionClient } from '@posty5/html-hosting-form-submission';
import { SocialPublisherWorkspaceClient } from '@posty5/social-publisher-workspace';
import { SocialPublisherTaskClient } from '@posty5/social-publisher-task';

/**
 * Posty5 SDK Test Suite
 * 
 * This file provides quick tests for all Posty5 SDK packages.
 * Replace 'YOUR_API_KEY' with your actual API key before running.
 */

// Configuration
const API_KEY = 'YOUR_API_KEY'; // Replace with your actual API key
const BASE_URL = 'https://api.posty5.com'; // Or your API URL

// Initialize clients
const posty5 = new Posty5Client({
    apiKey: API_KEY,
    baseURL: BASE_URL,
});

const shortLinkClient = new ShortLinkClient(posty5);
const qrCodeClient = new QRCodeClient(posty5);
const htmlHostingClient = new HtmlHostingClient(posty5);
const htmlHostingVariablesClient = new HtmlHostingVariablesClient(posty5);
const formSubmissionClient = new HtmlHostingFormSubmissionClient(posty5);
const workspaceClient = new SocialPublisherWorkspaceClient(posty5);
const taskClient = new SocialPublisherTaskClient(posty5);

/**
 * Test Short Link Client
 */
async function testShortLink() {
    console.log('\n🔗 Testing Short Link Client...');

    try {
        // Create a short link
        const shortLink = await shortLinkClient.create({
            targetUrl: 'https://example.com',
            title: 'Test Link',
        });
        console.log('✅ Created short link:', shortLink.data?.shortUrl);

        // Get all short links
        const links = await shortLinkClient.getAll({ page: 1, take: 10 });
        console.log(`✅ Retrieved ${links.data?.items?.length || 0} short links`);

        return true;
    } catch (error: any) {
        console.error('❌ Short Link test failed:', error.message);
        return false;
    }
}

/**
 * Test QR Code Client
 */
async function testQRCode() {
    console.log('\n📱 Testing QR Code Client...');

    try {
        // Create a QR code for a URL
        const qrCode = await qrCodeClient.createUrl({
            url: 'https://example.com',
            title: 'Test QR Code',
        });
        console.log('✅ Created QR code:', qrCode.data?.qrCodeUrl);

        // Get all QR codes
        const codes = await qrCodeClient.getAll({ page: 1, take: 10 });
        console.log(`✅ Retrieved ${codes.data?.items?.length || 0} QR codes`);

        return true;
    } catch (error: any) {
        console.error('❌ QR Code test failed:', error.message);
        return false;
    }
}

/**
 * Test HTML Hosting Client
 */
async function testHtmlHosting() {
    console.log('\n🌐 Testing HTML Hosting Client...');

    try {
        // Get all hosted pages
        const pages = await htmlHostingClient.getAll({ page: 1, take: 10 });
        console.log(`✅ Retrieved ${pages.data?.items?.length || 0} hosted pages`);

        return true;
    } catch (error: any) {
        console.error('❌ HTML Hosting test failed:', error.message);
        return false;
    }
}

/**
 * Test HTML Hosting Variables Client
 */
async function testHtmlHostingVariables() {
    console.log('\n🔧 Testing HTML Hosting Variables Client...');

    try {
        // Get all variables
        const variables = await htmlHostingVariablesClient.getAll({ page: 1, take: 10 });
        console.log(`✅ Retrieved ${variables.data?.items?.length || 0} variables`);

        return true;
    } catch (error: any) {
        console.error('❌ HTML Hosting Variables test failed:', error.message);
        return false;
    }
}

/**
 * Test Form Submission Client
 */
async function testFormSubmission() {
    console.log('\n📝 Testing Form Submission Client...');

    try {
        // Get all form submissions
        const submissions = await formSubmissionClient.getAll({ page: 1, take: 10 });
        console.log(`✅ Retrieved ${submissions.data?.items?.length || 0} form submissions`);

        return true;
    } catch (error: any) {
        console.error('❌ Form Submission test failed:', error.message);
        return false;
    }
}

/**
 * Test Social Publisher Workspace Client
 */
async function testWorkspace() {
    console.log('\n🏢 Testing Social Publisher Workspace Client...');

    try {
        // Get all workspaces
        const workspaces = await workspaceClient.getAll({ page: 1, take: 10 });
        console.log(`✅ Retrieved ${workspaces.data?.items?.length || 0} workspaces`);

        return true;
    } catch (error: any) {
        console.error('❌ Workspace test failed:', error.message);
        return false;
    }
}

/**
 * Test Social Publisher Task Client
 */
async function testTask() {
    console.log('\n📋 Testing Social Publisher Task Client...');

    try {
        // Get all tasks
        const tasks = await taskClient.getAll({ page: 1, take: 10 });
        console.log(`✅ Retrieved ${tasks.data?.items?.length || 0} tasks`);

        return true;
    } catch (error: any) {
        console.error('❌ Task test failed:', error.message);
        return false;
    }
}

/**
 * Run all tests
 */
async function runAllTests() {
    console.log('╔════════════════════════════════════════╗');
    console.log('║   Posty5 SDK Test Suite                ║');
    console.log('╚════════════════════════════════════════╝');

    if (API_KEY === 'YOUR_API_KEY') {
        console.error('\n❌ ERROR: Please set your API key in the test file!');
        console.log('   Replace "YOUR_API_KEY" with your actual API key.\n');
        process.exit(1);
    }

    const results = {
        shortLink: await testShortLink(),
        qrCode: await testQRCode(),
        htmlHosting: await testHtmlHosting(),
        htmlHostingVariables: await testHtmlHostingVariables(),
        formSubmission: await testFormSubmission(),
        workspace: await testWorkspace(),
        task: await testTask(),
    };

    // Summary
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   Test Results Summary                 ║');
    console.log('╚════════════════════════════════════════╝\n');

    const passed = Object.values(results).filter(r => r).length;
    const total = Object.keys(results).length;

    Object.entries(results).forEach(([name, success]) => {
        const icon = success ? '✅' : '❌';
        console.log(`${icon} ${name.padEnd(25)} ${success ? 'PASSED' : 'FAILED'}`);
    });

    console.log(`\n📊 Total: ${passed}/${total} tests passed`);

    if (passed === total) {
        console.log('🎉 All tests passed!\n');
        process.exit(0);
    } else {
        console.log('⚠️  Some tests failed. Check the errors above.\n');
        process.exit(1);
    }
}

// Run tests
runAllTests().catch((error) => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
});
