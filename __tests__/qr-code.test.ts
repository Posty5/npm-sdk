import { Posty5Client } from '@posty5/core';
import { QRCodeClient } from '@posty5/qr-code';
import { TEST_CONFIG, createdResources } from '../setup';

describe('QR Code SDK', () => {
    let posty5: Posty5Client;
    let client: QRCodeClient;
    let createdId: string;

    beforeAll(() => {
        posty5 = new Posty5Client({
            apiKey: TEST_CONFIG.apiKey,
            baseURL: TEST_CONFIG.baseURL,
        });
        client = new QRCodeClient(posty5);
    });

    describe('CREATE - URL QR Code', () => {
        it('should create a URL QR code', async () => {
            const result = await client.createUrl({
                url: 'https://example.com/qr-test-' + Date.now(),
                title: 'Test QR Code',
            });

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data?._id).toBeDefined();
            expect(result.data?.qrCodeUrl).toBeDefined();
            expect(result.data?.targetType).toBe('url');

            createdId = result.data!._id;
            createdResources.qrCodes.push(createdId);
        });
    });

    describe('CREATE - Email QR Code', () => {
        it('should create an email QR code', async () => {
            const result = await client.createEmail({
                email: 'test@example.com',
                subject: 'Test Subject',
                body: 'Test Body',
            });

            expect(result.success).toBe(true);
            expect(result.data?.targetType).toBe('email');

            if (result.data?._id) {
                createdResources.qrCodes.push(result.data._id);
            }
        });
    });

    describe('CREATE - WiFi QR Code', () => {
        it('should create a WiFi QR code', async () => {
            const result = await client.createWifi({
                ssid: 'TestNetwork',
                password: 'password123',
                encryption: 'WPA',
            });

            expect(result.success).toBe(true);
            expect(result.data?.targetType).toBe('wifi');

            if (result.data?._id) {
                createdResources.qrCodes.push(result.data._id);
            }
        });
    });

    describe('GET BY ID', () => {
        it('should get QR code by ID', async () => {
            const result = await client.getById(createdId);

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data?._id).toBe(createdId);
            expect(result.data?.qrCodeUrl).toBeDefined();
        });

        it('should fail with invalid ID', async () => {
            await expect(
                client.getById('invalid-id-123')
            ).rejects.toThrow();
        });
    });

    describe('GET LIST', () => {
        it('should get list of QR codes', async () => {
            const result = await client.getAll({
                page: 1,
                take: 10,
            });

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data?.items).toBeInstanceOf(Array);
            expect(result.data?.totalCount).toBeGreaterThanOrEqual(0);
        });

        it('should filter by target type', async () => {
            const result = await client.getAll({
                page: 1,
                take: 10,
                targetType: 'url',
            });

            expect(result.success).toBe(true);

            if (result.data && result.data.items.length > 0) {
                result.data.items.forEach(item => {
                    expect(item.targetType).toBe('url');
                });
            }
        });
    });

    describe('UPDATE', () => {
        it('should update QR code', async () => {
            const updatedTitle = 'Updated QR Code - ' + Date.now();

            const result = await client.update(createdId, {
                title: updatedTitle,
            });

            expect(result.success).toBe(true);
            expect(result.data?.title).toBe(updatedTitle);
        });
    });

    describe('DELETE', () => {
        it('should delete QR code', async () => {
            const result = await client.delete(createdId);

            expect(result.success).toBe(true);

            // Verify deletion
            await expect(
                client.getById(createdId)
            ).rejects.toThrow();
        });
    });
});
