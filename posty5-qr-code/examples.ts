/**
 * @posty5/qr-code - Quick Start Examples
 * 
 * This file contains practical examples for using the QR Code SDK
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

// ============================================================================
// Example 1: Create a simple URL QR code
// ============================================================================
async function createUrlQRCode() {
    const qrCode = await qrCodeClient.create({
        name: 'My Website',
        options: {
            text: 'https://example.com',
            width: 300,
            height: 300,
            colorDark: '#000000',
            colorLight: '#ffffff'
        },
        qrCodeTarget: {
            type: 'url',
            url: {
                url: 'https://example.com'
            }
        }
    });

    console.log('QR Code created:', qrCode.qrCodeLandingPage);
    return qrCode;
}

// ============================================================================
// Example 2: Create a WiFi QR code
// ============================================================================
async function createWiFiQRCode() {
    const qrCode = await qrCodeClient.create({
        name: 'Office WiFi',
        options: {
            width: 300,
            height: 300
        },
        qrCodeTarget: {
            type: 'wifi',
            wifi: {
                name: 'OfficeNetwork',
                authenticationType: 'WPA',
                password: 'secret123'
            }
        }
    });

    console.log('WiFi QR Code:', qrCode.qrCodeLandingPage);
    return qrCode;
}

// ============================================================================
// Example 3: Create a styled QR code with logo
// ============================================================================
async function createStyledQRCode() {
    const qrCode = await qrCodeClient.create({
        name: 'Branded QR Code',
        options: {
            text: 'https://example.com',
            width: 400,
            height: 400,
            colorDark: '#FF6B6B',
            colorLight: '#F0F0F0',
            correctLevel: 3, // High error correction for logo
            logo: 'https://example.com/logo.png',
            logoWidth: 80,
            logoHeight: 80,
            title: 'Scan Me!',
            titleFont: 'bold 20px Arial',
            titleColor: '#333333',
            titleHeight: 50
        },
        qrCodeTarget: {
            type: 'url',
            url: { url: 'https://example.com' }
        }
    });

    return qrCode;
}

// ============================================================================
// Example 4: Create QR code with custom landing page
// ============================================================================
async function createQRCodeWithLandingPage() {
    const qrCode = await qrCodeClient.create({
        name: 'Marketing Campaign',
        customLandingId: 'summer-sale-2024',
        isEnableLandingPage: true,
        pageInfo: {
            title: 'Summer Sale 2024',
            description: 'Get 50% off on all products!',
            descriptionIsHtmlFile: false
        },
        tag: 'marketing',
        refId: 'CAMPAIGN-2024-001',
        options: {
            width: 300,
            height: 300
        },
        qrCodeTarget: {
            type: 'url',
            url: { url: 'https://example.com/sale' }
        }
    });

    console.log('Landing page URL:', qrCode.qrCodeLandingPage);
    // Access at: https://qr.posty5.com/summer-sale-2024
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
            isEnableLandingPage: true
        },
        {
            page: 1,
            pageSize: 20,
            sortField: 'createdAt',
            sortType: 'desc'
        }
    );

    console.log(`Total QR codes: ${result.pagination.pageSize}`);
    result.items.forEach(qr => {
        console.log(`- ${qr.name}: ${qr.numberOfVisitors} visitors`);
    });

    return result;
}

// ============================================================================
// Example 6: Update a QR code
// ============================================================================
async function updateQRCode(qrCodeId: string) {
    const updated = await qrCodeClient.update(qrCodeId, {
        name: 'Updated QR Code Name',
        options: {
            colorDark: '#0000FF',
            width: 400,
            height: 400
        },
        qrCodeTarget: {
            type: 'url',
            url: {
                url: 'https://newurl.com'
            }
        }
    });

    console.log('QR code updated:', updated.name);
    return updated;
}

// ============================================================================
// Example 7: Create email QR code
// ============================================================================
async function createEmailQRCode() {
    const qrCode = await qrCodeClient.create({
        name: 'Contact Us',
        options: {
            width: 300,
            height: 300
        },
        qrCodeTarget: {
            type: 'email',
            email: {
                email: 'contact@example.com',
                subject: 'Inquiry from QR Code',
                body: 'Hello, I would like to know more about...'
            }
        }
    });

    return qrCode;
}

// ============================================================================
// Example 8: Create SMS QR code
// ============================================================================
async function createSMSQRCode() {
    const qrCode = await qrCodeClient.create({
        name: 'Text Us',
        options: {
            width: 300,
            height: 300
        },
        qrCodeTarget: {
            type: 'sms',
            sms: {
                phoneNumber: '+1234567890',
                message: 'I scanned your QR code!'
            }
        }
    });

    return qrCode;
}

// ============================================================================
// Example 9: Create geolocation QR code
// ============================================================================
async function createLocationQRCode() {
    const qrCode = await qrCodeClient.create({
        name: 'Our Office Location',
        options: {
            width: 300,
            height: 300
        },
        qrCodeTarget: {
            type: 'geolocation',
            geolocation: {
                latitude: '40.7128',
                longitude: '-74.0060',
                mapURL: 'https://maps.google.com/?q=40.7128,-74.0060'
            }
        }
    });

    return qrCode;
}

// ============================================================================
// Example 10: Get QR code lookup for dropdown
// ============================================================================
async function getQRCodeLookup() {
    const qrCodes = await qrCodeClient.lookup('office');

    // Use in a dropdown
    qrCodes.forEach(qr => {
        console.log(`<option value="${qr._id}">${qr.name}</option>`);
    });

    return qrCodes;
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
        const qrCode = await qrCodeClient.create({
            name: 'Test QR',
            options: {
                width: 300,
                height: 300
            },
            qrCodeTarget: {
                type: 'url',
                url: { url: 'https://example.com' }
            }
        });

        console.log('Success:', qrCode.qrCodeLandingPage);
    } catch (error: any) {
        if (error.statusCode === 401) {
            console.error('Authentication failed - check your API key');
        } else if (error.statusCode === 400) {
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
        // await createStyledQRCode();
        // await createQRCodeWithLandingPage();
        // await listQRCodes();
        // await createEmailQRCode();
        // await createSMSQRCode();
        // await createLocationQRCode();
        // await getQRCodeLookup();

    } catch (error) {
        console.error('Error:', error);
    }
}

// Uncomment to run:
// main();
