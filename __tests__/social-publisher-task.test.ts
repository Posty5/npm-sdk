import { Posty5Client } from '@posty5/core';
import { SocialPublisherTaskClient } from '@posty5/social-publisher-task';
import { TEST_CONFIG, createdResources } from '../setup';

describe('Social Publisher Task SDK', () => {
    let posty5: Posty5Client;
    let client: SocialPublisherTaskClient;
    let createdId: string;

    beforeAll(() => {
        posty5 = new Posty5Client({
            apiKey: TEST_CONFIG.apiKey,
            baseURL: TEST_CONFIG.baseURL,
        });
        client = new SocialPublisherTaskClient(posty5);
    });

    describe('CREATE', () => {
        it('should create a task', async () => {
            // Note: You'll need a valid workspaceId for this test
            // You might want to create a workspace first or use an existing one
            const result = await client.create({
                workspaceId: 'test-workspace-id', // Replace with actual workspace ID
                title: 'Test Social Media Post ' + Date.now(),
                description: 'Created by Jest test',
                scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
            });

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data?._id).toBeDefined();
            expect(result.data?.title).toContain('Test Social Media Post');

            createdId = result.data!._id;
            createdResources.tasks.push(createdId);
        });

        it('should fail without required workspaceId', async () => {
            await expect(
                client.create({ title: 'Test' } as any)
            ).rejects.toThrow();
        });
    });

    describe('GET BY ID', () => {
        it('should get task by ID', async () => {
            const result = await client.getById(createdId);

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data?._id).toBe(createdId);
            expect(result.data?.title).toBeDefined();
        });

        it('should fail with invalid ID', async () => {
            await expect(
                client.getById('invalid-id-123')
            ).rejects.toThrow();
        });
    });

    describe('GET LIST', () => {
        it('should get list of tasks', async () => {
            const result = await client.getAll({
                page: 1,
                take: 10,
            });

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data?.items).toBeInstanceOf(Array);
            expect(result.data?.totalCount).toBeGreaterThanOrEqual(0);
        });

        it('should filter by workspace', async () => {
            const result = await client.getAll({
                page: 1,
                take: 10,
                workspaceId: 'test-workspace-id',
            });

            expect(result.success).toBe(true);
            expect(result.data?.items).toBeInstanceOf(Array);
        });

        it('should filter by status', async () => {
            const result = await client.getAll({
                page: 1,
                take: 10,
                status: 'pending',
            });

            expect(result.success).toBe(true);

            if (result.data && result.data.items.length > 0) {
                result.data.items.forEach(item => {
                    expect(item.status).toBe('pending');
                });
            }
        });
    });

    describe('UPDATE', () => {
        it('should update task', async () => {
            const updatedTitle = 'Updated Task - ' + Date.now();

            const result = await client.update(createdId, {
                title: updatedTitle,
            });

            expect(result.success).toBe(true);
            expect(result.data?.title).toBe(updatedTitle);
        });

        it('should update scheduled time', async () => {
            const newScheduledAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 2 days from now

            const result = await client.update(createdId, {
                scheduledAt: newScheduledAt,
            });

            expect(result.success).toBe(true);
        });
    });

    describe('DELETE', () => {
        it('should delete task', async () => {
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
