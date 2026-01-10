import { Posty5Client } from '@posty5/core';
import { SocialPublisherWorkspaceClient } from '@posty5/social-publisher-workspace';
import { TEST_CONFIG, createdResources } from '../setup';

describe('Social Publisher Workspace SDK', () => {
    let posty5: Posty5Client;
    let client: SocialPublisherWorkspaceClient;
    let createdId: string;

    beforeAll(() => {
        posty5 = new Posty5Client({
            apiKey: TEST_CONFIG.apiKey,
            baseURL: TEST_CONFIG.baseURL,
        });
        client = new SocialPublisherWorkspaceClient(posty5);
    });

    describe('CREATE', () => {
        it('should create a workspace', async () => {
            const result = await client.create({
                name: 'Test Workspace ' + Date.now(),
                description: 'Created by Jest test for social media management',
            });

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data?._id).toBeDefined();
            expect(result.data?.name).toContain('Test Workspace');

            createdId = result.data!._id;
            createdResources.workspaces.push(createdId);
        });

        it('should fail without required name', async () => {
            await expect(
                client.create({ name: '' } as any)
            ).rejects.toThrow();
        });
    });

    describe('GET BY ID', () => {
        it('should get workspace by ID', async () => {
            const result = await client.getById(createdId);

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data?._id).toBe(createdId);
            expect(result.data?.name).toBeDefined();
        });

        it('should fail with invalid ID', async () => {
            await expect(
                client.getById('invalid-id-123')
            ).rejects.toThrow();
        });
    });

    describe('GET LIST', () => {
        it('should get list of workspaces', async () => {
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
        it('should update workspace', async () => {
            const updatedName = 'Updated Workspace - ' + Date.now();
            const updatedDescription = 'Updated description for testing';

            const result = await client.update(createdId, {
                name: updatedName,
                description: updatedDescription,
            });

            expect(result.success).toBe(true);
            expect(result.data?.name).toBe(updatedName);
            expect(result.data?.description).toBe(updatedDescription);
        });

        it('should fail to update with invalid ID', async () => {
            await expect(
                client.update('invalid-id', { name: 'Test' })
            ).rejects.toThrow();
        });
    });

    describe('DELETE', () => {
        it('should delete workspace', async () => {
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
    });
});
