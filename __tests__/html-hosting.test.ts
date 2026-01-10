import { Posty5Client } from '@posty5/core';
import { HtmlHostingClient } from '@posty5/html-hosting';
import { TEST_CONFIG, createdResources } from '../setup';

describe('HTML Hosting SDK', () => {
    let posty5: Posty5Client;
    let client: HtmlHostingClient;
    let createdId: string;

    beforeAll(() => {
        posty5 = new Posty5Client({
            apiKey: TEST_CONFIG.apiKey,
            baseURL: TEST_CONFIG.baseURL,
        });
        client = new HtmlHostingClient(posty5);
    });

    describe('CREATE', () => {
        it('should create an HTML hosting page', async () => {
            const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head><title>Test Page ${Date.now()}</title></head>
          <body><h1>Hello from Jest Test!</h1></body>
        </html>
      `;

            const result = await client.create({
                title: 'Test HTML Page',
                htmlContent: htmlContent,
                description: 'Created by Jest test',
            });

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data?._id).toBeDefined();
            expect(result.data?.hostedUrl).toBeDefined();
            expect(result.data?.title).toBe('Test HTML Page');

            createdId = result.data!._id;
            createdResources.htmlHostings.push(createdId);
        });

        it('should fail without HTML content', async () => {
            await expect(
                client.create({ title: 'Test', htmlContent: '' } as any)
            ).rejects.toThrow();
        });
    });

    describe('GET BY ID', () => {
        it('should get HTML hosting page by ID', async () => {
            const result = await client.getById(createdId);

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data?._id).toBe(createdId);
            expect(result.data?.hostedUrl).toBeDefined();
        });

        it('should fail with invalid ID', async () => {
            await expect(
                client.getById('invalid-id-123')
            ).rejects.toThrow();
        });
    });

    describe('GET LIST', () => {
        it('should get list of hosted pages', async () => {
            const result = await client.getAll({
                page: 1,
                take: 10,
            });

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data?.items).toBeInstanceOf(Array);
            expect(result.data?.totalCount).toBeGreaterThanOrEqual(0);
        });

        it('should support search', async () => {
            const result = await client.getAll({
                page: 1,
                take: 10,
                search: 'test',
            });

            expect(result.success).toBe(true);
            expect(result.data?.items).toBeInstanceOf(Array);
        });
    });

    describe('UPDATE', () => {
        it('should update HTML hosting page', async () => {
            const updatedTitle = 'Updated HTML Page - ' + Date.now();

            const result = await client.update(createdId, {
                title: updatedTitle,
            });

            expect(result.success).toBe(true);
            expect(result.data?.title).toBe(updatedTitle);
        });

        it('should update HTML content', async () => {
            const newContent = '<html><body><h1>Updated Content</h1></body></html>';

            const result = await client.update(createdId, {
                htmlContent: newContent,
            });

            expect(result.success).toBe(true);
        });
    });

    describe('DELETE', () => {
        it('should delete HTML hosting page', async () => {
            const result = await client.delete(createdId);

            expect(result.success).toBe(true);

            // Verify deletion
            await expect(
                client.getById(createdId)
            ).rejects.toThrow();
        });
    });
});
