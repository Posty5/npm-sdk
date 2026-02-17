// @ts-nocheck
/**
 * Tests for R2 upload utility
 */

import { uploadToR2, uploadToR2WithResult, IUploadOptions } from '../src/utils/upload';

// Mock global Request, Response, fetch if not available (for Node environment)
// Note: In Node 18+, fetch is global. In older versions or JSDOM, it might need polyfill.
// We'll mock it on the global object.

describe('R2 Upload Utility', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        // Mock fetch
        global.fetch = jest.fn();

        // Mock File and Blob if likely missing in test env (JSDOM might have Blob but not File fully implemented)
        if (!global.File) {
            global.File = class MockFile {
                name: string;
                type: string;
                size: number;
                constructor(parts: any[], name: string, options: any) {
                    this.name = name;
                    this.type = options?.type || '';
                    this.size = 0; // Simplified
                }
            } as any;
        }
        if (!global.Blob) {
            global.Blob = class MockBlob {
                type: string;
                size: number;
                constructor(parts: any[], options: any) {
                    this.type = options?.type || '';
                    this.size = 0;
                }
            } as any;
        }
    });

    afterEach(() => {
        jest.restoreAllMocks();
        global.fetch = originalFetch;
    });

    describe('uploadToR2', () => {
        it('should upload a file successfully', async () => {
            const presignedUrl = 'https://example.com/upload?signature=abc123';
            const file = new File(['test content'], 'test.txt', { type: 'text/plain' });

            // Mock successful fetch
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                status: 200,
                statusText: 'OK',
            });

            const onStart = jest.fn();
            const onSuccess = jest.fn();
            const onComplete = jest.fn();

            const url = await uploadToR2(presignedUrl, file, { onStart, onSuccess, onComplete });

            expect(url).toBe('https://example.com/upload');
            expect(global.fetch).toHaveBeenCalledWith(presignedUrl, expect.objectContaining({
                method: 'PUT',
                headers: {
                    'Content-Type': 'text/plain',
                },
                body: file,
            }));

            expect(onStart).toHaveBeenCalled();
            expect(onSuccess).toHaveBeenCalledWith('https://example.com/upload');
            expect(onComplete).toHaveBeenCalled();
        });

        it('should report basic progress (0% and 100%)', async () => {
            const presignedUrl = 'https://example.com/upload?signature=abc123';
            const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
            const onProgress = jest.fn();

            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
            });

            await uploadToR2(presignedUrl, file, { onProgress });

            expect(onProgress).toHaveBeenCalledWith(0);
            expect(onProgress).toHaveBeenCalledWith(100);
            // Fetch doesn't support intermediate progress in this impl
        });

        it('should handle upload errors', async () => {
            const presignedUrl = 'https://example.com/upload?signature=abc123';
            const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
            const onError = jest.fn();

            // Mock failed fetch
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
            });

            await expect(uploadToR2(presignedUrl, file, { onError }))
                .rejects.toThrow('Upload failed with status 500: Internal Server Error');

            expect(onError).toHaveBeenCalled();
        });

        it('should handle network errors', async () => {
            const presignedUrl = 'https://example.com/upload?signature=abc123';
            const file = new File(['test content'], 'test.txt', { type: 'text/plain' });

            (global.fetch as jest.Mock).mockRejectedValue(new Error('Network Error'));

            await expect(uploadToR2(presignedUrl, file)).rejects.toThrow('Network Error');
        });

        it('should use content type from options if provided', async () => {
            const presignedUrl = 'https://example.com/upload?signature=abc123';
            const file = new File(['test content'], 'test.txt', { type: 'text/plain' });

            (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

            await uploadToR2(presignedUrl, file, { contentType: 'application/pdf' });

            expect(global.fetch).toHaveBeenCalledWith(presignedUrl, expect.objectContaining({
                headers: {
                    'Content-Type': 'application/pdf',
                },
            }));
        });
    });

    describe('uploadToR2WithResult', () => {
        it('should return success result', async () => {
            const presignedUrl = 'https://example.com/upload?signature=abc123';
            const file = new File(['...'], 'test.txt');

            (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

            const result = await uploadToR2WithResult(presignedUrl, file);

            expect(result.success).toBe(true);
            expect(result.url).toBe('https://example.com/upload');
        });

        it('should return failure result', async () => {
            const presignedUrl = 'https://example.com/upload?signature=abc123';
            const file = new File(['...'], 'test.txt');

            (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500 });

            const result = await uploadToR2WithResult(presignedUrl, file);

            expect(result.success).toBe(false);
            expect(result.url).toBe('');
        });
    });
});
