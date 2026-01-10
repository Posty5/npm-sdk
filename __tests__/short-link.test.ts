import { Posty5Client } from '@posty5/core';
import { ShortLinkClient } from '@posty5/short-link';
import { TEST_CONFIG, createdResources } from '../setup';

describe('Short Link SDK', () => {
    let posty5: Posty5Client;
    let client: ShortLinkClient;
    let createdId: string;

    beforeAll(() => {
        posty5 = new Posty5Client({
            apiKey: TEST_CONFIG.apiKey,
            baseURL: TEST_CONFIG.baseURL,
        });
        client = new ShortLinkClient(posty5);
    });

    describe('CREATE', () => {
        it('should create a short link', async () => {
            const result = await client.create({
                targetUrl: 'https://example.com/test-' + Date.now(),
                title: 'Test Short Link',
                description: 'Created by Jest test',
            });

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data?._id).toBeDefined();
            expect(result.data?.shortUrl).toBeDefined();
            expect(result.data?.targetUrl).toContain('example.com');

            createdId = result.data!._id;
            createdResources.shortLinks.push(createdId);
        });

        it('should fail to create without required fields', async () => {
            await expect(
                client.create({ targetUrl: '' } as any)
            ).rejects.toThrow();
        });
    });

    describe('GET BY ID', () => {
        it('should get short link by ID', async () => {
            const result = await client.getById(createdId);

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data?._id).toBe(createdId);
            expect(result.data?.targetUrl).toBeDefined();
        });

        it('should fail with invalid ID', async () => {
            await expect(
                client.getById('invalid-id-123')
            ).rejects.toThrow();
        });
    });

    describe('GET LIST', () => {
        it('should get list of short links', async () => {
            const result = await client.getAll({
                page: 1,
                take: 10,
            });

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data?.items).toBeInstanceOf(Array);
            expect(result.data?.totalCount).toBeGreaterThanOrEqual(0);
        });

        it('should support pagination', async () => {
            const page1 = await client.getAll({ page: 1, take: 5 });
            const page2 = await client.getAll({ page: 2, take: 5 });

            expect(page1.data?.items).toBeDefined();
            expect(page2.data?.items).toBeDefined();

            if (page1.data!.items.length > 0 && page2.data!.items.length > 0) {
                expect(page1.data!.items[0]._id).not.toBe(page2.data!.items[0]._id);
            }
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
        it('should update short link', async () => {
            const updatedTitle = 'Updated Title - ' + Date.now();

            const result = await client.update(createdId, {
                title: updatedTitle,
            });

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data?.title).toBe(updatedTitle);
        });

        it('should fail to update with invalid ID', async () => {
            await expect(
                client.update('invalid-id', { title: 'Test' })
            ).rejects.toThrow();
        });
    });

    describe('DELETE', () => {
        it('should delete short link', async () => {
            const result = await client.delete(createdId);

            expect(result.success).toBe(true);

            // Verify deletion
            await expect(
                client.getById(createdId)
            ).rejects.toThrow();
        });

        it('should fail to delete with invalid ID', async () => {
            await expect(
                client.delete('invalid-id')
            ).rejects.toThrow();
        });

        it('should fail to delete already deleted resource', async () => {
            await expect(
                client.delete(createdId)
            ).rejects.toThrow();
        });
    });
});
