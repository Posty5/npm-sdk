import { HttpClient } from '@posty5/core';
import { ShortLinkClient } from '@posty5/short-link';
import { TEST_CONFIG, createdResources } from './setup';
const templateId="68d190bc4b42b89ef76e1398";

describe('Short Link SDK', () => {
    let httpClient: HttpClient;
    let client!: ShortLinkClient;
    let createdId: string;

    beforeAll(() => {
        httpClient = new HttpClient({
            apiKey: TEST_CONFIG.apiKey,
            baseUrl: TEST_CONFIG.baseUrl,
            debug:true,

        });
        client = new ShortLinkClient(httpClient);
    });

    describe('CREATE', () => {
        it('should create a short link', async () => {
            const result = await client.create({
                name: 'Test Short Link - ' + Date.now(),
                baseUrl: 'https://posty5.com',
                templateId
            });

            expect(result._id).toBeDefined();
            expect(result.shorterLink).toBeDefined();
            expect(result.baseUrl).toBe('https://posty5.com');

            createdId = result._id;
            createdResources.shortLinks.push(createdId);
        });

        it('should create short link with custom slug', async () => {
            const customSlug = 'test-' + Date.now();
            const result = await client.create({
                name: 'Custom Slug Link',
                baseUrl: 'https://example.com',
                customLandingId: customSlug,
                templateId
            });

            expect(result._id).toBeDefined();
            expect(result.shorterLink).toContain(customSlug);
            createdResources.shortLinks.push(result._id);
        });

        it('should create short link with tag and refId', async () => {
            const result = await client.create({
                name: 'Tagged Link',
                baseUrl: 'https://example.com',
                tag: 'test-tag',
                refId: 'REF-' + Date.now(),
                templateId
            });

            expect(result._id).toBeDefined();
            createdResources.shortLinks.push(result._id);
        });
    });

    describe('GET BY ID', () => {
        it('should get short link by ID', async () => {
            const result = await client.get(createdId);

            expect(result._id).toBe(createdId);
            expect(result.shorterLink).toBeDefined();
            expect(result.baseUrl).toBeDefined();
        });

        it('should fail with invalid ID', async () => {
            await expect(
                client.get('invalid-id-123')
            ).rejects.toThrow();
        });
    });

    describe('GET LIST', () => {
        it('should get list of short links', async () => {
            const result = await client.search({}, {
                page: 1,
                pageSize: 10,
            });

            expect(result.items).toBeInstanceOf(Array);
            expect(result.totalCount).toBeGreaterThanOrEqual(0);
        });

        it('should support search', async () => {
            const result = await client.search({
                name: 'test',
            }, {
                page: 1,
                pageSize: 10,
            });

            expect(result.items).toBeInstanceOf(Array);
        });

        it('should filter by tag', async () => {
            const result = await client.search({
                tag: 'test-tag',
            }, {
                page: 1,
                pageSize: 10,
            });

            expect(result.items).toBeInstanceOf(Array);
        });
    });

    describe('UPDATE', () => {
        it('should update short link', async () => {
            const newName = 'Updated Short Link - ' + Date.now();
            const result = await client.update(createdId, {
                name: newName,
                baseUrl: 'https://guide.posty5.com',
                templateId
            });

            expect(result._id).toBe(createdId);
        });

        it('should update target URL', async () => {
            const result = await client.update(createdId, {
                baseUrl: 'https://updated.posty5.com',
                templateId
            });

            expect(result._id).toBe(createdId);
        });
    });

    describe('DELETE', () => {
        it('should delete short link', async () => {
            await client.delete(createdId);

            // Verify deletion
            await expect(
                client.get(createdId)
            ).rejects.toThrow();
        });
    });
});
