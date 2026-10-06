/**
 * @posty5/qr-code - Quick Start Examples
 *
 * This file contains practical examples for using the QR Code SDK.
 *
 * - `templateId` is required on every create and update (API-key calls).
 *   Pick one of your templates at https://studio.posty5.com/qr-code-templates;
 *   the template decides the code's colours, logo and size.
 * - The API builds the text the image encodes from the code's content, so the
 *   SDK sends the content only.
 * - `numberOfVisitors` counts visits to the code's Posty5 landing page. The
 *   downloaded image encodes the content directly, so scans are not counted.
 */

import { HttpClient } from '@posty5/core';
import { QRCodeClient } from '@posty5/qr-code';

// Initialize the HTTP client
const http = new HttpClient({
    baseUrl: 'https://api.posty5.com',
    apiKey: 'your-api-key-here'
});

// Create QR Code client
const qrCodeClient = new QRCodeClient(http);

// One of your QR code templates (required)
const TEMPLATE_ID = 'your-template-id';

// ============================================================================
// Example 1: Create a simple URL QR code
// ============================================================================
async function createUrlQRCode() {
    const qrCode = await qrCodeClient.createURL({
        name: 'My Website',
        templateId: TEMPLATE_ID,
        url: {
            url: 'https://example.com'
        }
    });

    console.log('QR Code page:', qrCode.qrCodeLandingPageURL);
    console.log('QR Code image:', qrCode.qrCodeDownloadURL);
    return qrCode;
}

// ============================================================================
// Example 2: Create a WiFi QR code
// ============================================================================
async function createWiFiQRCode() {
    const qrCode = await qrCodeClient.createWifi({
        name: 'Office WiFi',
        templateId: TEMPLATE_ID,
        wifi: {
            name: 'OfficeNetwork',
            authenticationType: 'WPA',
            password: 'secret123'
        }
    });

    console.log('WiFi QR Code:', qrCode.qrCodeLandingPageURL);
    return qrCode;
}

// ============================================================================
// Example 3: Create a free text QR code
// ============================================================================
async function createFreeTextQRCode() {
    const qrCode = await qrCodeClient.createFreeText({
        name: 'Product Serial',
        templateId: TEMPLATE_ID,
        text: 'SN:12345-ABCDE-67890'
    });

    return qrCode;
}

// ============================================================================
// Example 4: Create QR code with custom landing page
// ============================================================================
async function createQRCodeWithLandingPage() {
    const qrCode = await qrCodeClient.createURL({
        name: 'Marketing Campaign',
        templateId: TEMPLATE_ID,
        customLandingId: 'summer-sale-2026',
        isEnableLandingPage: true,
        pageInfo: {
            title: 'Summer Sale 2026',
            description: 'Get 50% off on all products!'
        },
        tag: 'marketing',
        refId: 'CAMPAIGN-2026-001',
        url: { url: 'https://example.com/sale' }
    });

    console.log('Landing page URL:', qrCode.qrCodeLandingPageURL);
    return qrCode;
}

// ============================================================================
// Example 5: List QR codes with filters
// ============================================================================
async function listQRCodes() {
    const result = await qrCodeClient.list(
        {
            status: 'approved',
            tag: 'marketing',
            refId: 'CAMPAIGN-2026-001',
            isEnableLandingPage: true
        },
        {
            page: 1,
            pageSize: 20
        }
    );

    console.log(`Total QR codes: ${result.pagination.totalCount}`);
    result.items.forEach(qr => {
        console.log(`- ${qr.name}: ${qr.numberOfVisitors} landing-page visits`);
    });

    return result;
}

// ============================================================================
// Example 6: Update a QR code
// ============================================================================
async function updateQRCode(qrCodeId: string) {
    // A static code's image encodes its content, so a printed copy keeps
    // opening the old URL; re-download the image after changing the content.
    const updated = await qrCodeClient.updateURL(qrCodeId, {
        name: 'Updated QR Code Name',
        templateId: TEMPLATE_ID,
        url: {
            url: 'https://newurl.com'
        }
    });

    console.log('QR code updated:', updated.name, updated.qrCodeDownloadURL);
    return updated;
}

// ============================================================================
// Example 7: Create email QR code
// ============================================================================
async function createEmailQRCode() {
    const qrCode = await qrCodeClient.createEmail({
        name: 'Contact Us',
        templateId: TEMPLATE_ID,
        email: {
            email: 'contact@example.com',
            subject: 'Inquiry from QR Code',
            body: 'Hello, I would like to know more about...'
        }
    });

    return qrCode;
}

// ============================================================================
// Example 8: Create SMS QR code
// ============================================================================
async function createSMSQRCode() {
    const qrCode = await qrCodeClient.createSMS({
        name: 'Text Us',
        templateId: TEMPLATE_ID,
        sms: {
            phoneNumber: '+1234567890',
            message: 'I scanned your QR code!'
        }
    });

    return qrCode;
}

// ============================================================================
// Example 9: Create geolocation QR code
// ============================================================================
async function createLocationQRCode() {
    const qrCode = await qrCodeClient.createGeolocation({
        name: 'Our Office Location',
        templateId: TEMPLATE_ID,
        geolocation: {
            latitude: '40.7128',
            longitude: '-74.0060'
        }
    });

    return qrCode;
}

// ============================================================================
// Example 10: Create phone call QR code
// ============================================================================
async function createCallQRCode() {
    const qrCode = await qrCodeClient.createCall({
        name: 'Call Support',
        templateId: TEMPLATE_ID,
        call: {
            phoneNumber: '+1234567890'
        }
    });

    return qrCode;
}

// ============================================================================
// Example 10b: Content types (4.7.0) — vCard, event, WhatsApp, review, social
// ============================================================================
async function createContentTypeQRCodes() {
    const vcard = await qrCodeClient.createVCard({
        name: 'Sales contact',
        templateId: TEMPLATE_ID,
        vcard: {
            firstName: 'Sara',
            lastName: 'Ali',
            organization: 'Acme',
            phones: [{ kind: 'mobile', number: '+201001234567' }],
            emails: ['sara@acme.com'],
        },
    });
    const event = await qrCodeClient.createEvent({
        name: 'Launch',
        templateId: TEMPLATE_ID,
        event: { title: 'Product launch', startsAt: new Date('2026-11-01T18:00:00Z'), endsAt: '2026-11-01T20:00:00Z' },
    });
    const whatsapp = await qrCodeClient.createWhatsApp({
        name: 'Chat with us',
        templateId: TEMPLATE_ID,
        whatsapp: { phoneNumber: '+201001234567', message: 'Hi' },
    });
    const review = await qrCodeClient.createReview({
        name: 'Review us',
        templateId: TEMPLATE_ID,
        review: { platform: 'google', placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4' },
    });
    const social = await qrCodeClient.createSocial({
        name: 'Follow us',
        templateId: TEMPLATE_ID,
        social: { profiles: [{ platform: 'instagram', handle: 'posty5' }] },
    });
    return { vcard, event, whatsapp, review, social };
}

// ============================================================================
// Example 10c: Dynamic-only types (4.7.0) — app store, file; social with many profiles
// ============================================================================
async function createDynamicContentTypeQRCodes(pdf: Blob) {
    const appStore = await qrCodeClient.createAppStore({
        name: 'Get the app',
        templateId: TEMPLATE_ID,
        appStore: {
            androidUrl: 'https://play.google.com/store/apps/details?id=com.example',
            iosUrl: 'https://apps.apple.com/app/id123456789',
            fallbackUrl: 'https://example.com/app',
        },
    });
    // Uploads the PDF (signed URL, 60 s) and creates the code in one call.
    const file = await qrCodeClient.createFile({ name: 'Menu', templateId: TEMPLATE_ID, file: { fileName: 'menu.pdf' } }, pdf);
    const social = await qrCodeClient.createSocial({
        name: 'All our profiles',
        templateId: TEMPLATE_ID,
        mode: 'dynamic',
        social: {
            title: 'Follow us',
            profiles: [
                { platform: 'instagram', handle: 'posty5' },
                { platform: 'x', handle: 'posty5' },
                { platform: 'youtube', url: 'https://youtube.com/@posty5' },
            ],
        },
    });
    return { appStore, file, social };
}

// ============================================================================
// Example 11: Delete a QR code
// ============================================================================
async function deleteQRCode(qrCodeId: string) {
    await qrCodeClient.delete(qrCodeId);
    console.log('QR code deleted successfully');
}

// ============================================================================
// Example 12: Error handling
// ============================================================================
async function createQRCodeWithErrorHandling() {
    try {
        const qrCode = await qrCodeClient.createURL({
            name: 'Test QR',
            templateId: TEMPLATE_ID,
            url: { url: 'https://example.com' }
        });

        console.log('Success:', qrCode.qrCodeLandingPageURL);
    } catch (error: any) {
        if (error.statusCode === 401) {
            console.error('Authentication failed - check your API key');
        } else if (error.statusCode === 400) {
            // e.g. a missing templateId, or a URL that does not start with http(s)://
            console.error('Validation error:', error.message);
        } else {
            console.error('Unexpected error:', error);
        }
    }
}

// ============================================================================
// Run examples
// ============================================================================
async function main() {
    try {
        // Uncomment the examples you want to run:

        // await createUrlQRCode();
        // await createWiFiQRCode();
        // await createFreeTextQRCode();
        // await createQRCodeWithLandingPage();
        // await listQRCodes();
        // await updateQRCode('qr-code-id');
        // await createEmailQRCode();
        // await createSMSQRCode();
        // await createLocationQRCode();
        // await createCallQRCode();
        // await deleteQRCode('qr-code-id');
        // await createQRCodeWithErrorHandling();

    } catch (error) {
        console.error('Error:', error);
    }
}

// Uncomment to run:
// main();
