import { HttpClient } from '@posty5/core';
import { SocialPublisherWorkspaceClient } from '@posty5/social-publisher-workspace';
import { TEST_CONFIG, createdResources } from './setup';

describe('Social Publisher Workspace SDK', () => {
    let httpClient: HttpClient;
    let client!: SocialPublisherWorkspaceClient;
    let createdId: string;

    beforeAll(() => {
        httpClient = new HttpClient({
            apiKey: TEST_CONFIG.apiKey,
            baseUrl: TEST_CONFIG.baseUrl,
        });
        client = new SocialPublisherWorkspaceClient(httpClient);
    });

    describe('CREATE', () => {
        it('should create a workspace', async () => {
            const result = await client.create({
                name: 'Test Workspace - ' + Date.now(),
            });

            expect(result._id).toBeDefined();

            createdId = result._id;
            createdResources.workspaces.push(createdId);
        });

        it('should create workspace with tag and refId', async () => {
            const result = await client.create({
                name: 'Tagged Workspace',
                tag: 'test-tag',
                refId: 'WS-' + Date.now(),
            });

            expect(result._id).toBeDefined();
            createdResources.workspaces.push(result._id);
        });
    });

    describe('GET BY ID', () => {
        it('should get workspace by ID', async () => {
            const result = await client.get(createdId);

            expect(result._id).toBe(createdId);
            expect(result.name).toBeDefined();
        });

        it('should fail with invalid ID', async () => {
            await expect(
                client.get('invalid-id-123')
            ).rejects.toThrow();
        });
    });

    describe('GET LIST', () => {
        it('should get list of workspaces', async () => {
            const result = await client.list({}, {
                page: 1,
                limit: 10,
            });

            expect(result.items).toBeInstanceOf(Array);
            expect(result.totalCount).toBeGreaterThanOrEqual(0);
        });

        it('should support search', async () => {
            const result = await client.list({
                search: 'test',
            }, {
                page: 1,
                limit: 10,
            });

            expect(result.items).toBeInstanceOf(Array);
        });

        it('should filter by tag', async () => {
            const result = await client.list({
                tag: 'test-tag',
            }, {
                page: 1,
                limit: 10,
            });

            expect(result.items).toBeInstanceOf(Array);
        });
    });

    describe('UPDATE', () => {
        it('should update workspace', async () => {
            const newName = 'Updated Workspace - ' + Date.now();
            const result = await client.update(createdId, {
                name: newName,
            });

            expect(result._id).toBe(createdId);
        });
    });

    describe('DELETE', () => {
        it('should delete workspace', async () => {
            await client.delete(createdId);

            // Verify deletion
            await expect(
                client.get(createdId)
            ).rejects.toThrow();
        });
    });
});
