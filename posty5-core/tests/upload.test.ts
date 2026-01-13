/**
 * Tests for R2 upload utility
 */

import { uploadToR2, uploadToR2WithResult, IUploadOptions } from '../src/utils/upload';

describe('R2 Upload Utility', () => {
    let mockXHR: any;
    let xhrInstances: any[] = [];

    beforeEach(() => {
        // Mock XMLHttpRequest
        xhrInstances = [];
        mockXHR = {
            open: jest.fn(),
            setRequestHeader: jest.fn(),
            send: jest.fn(),
            upload: {
                onprogress: null,
            },
            onload: null,
            onerror: null,
            status: 200,
            statusText: 'OK',
        };

        global.XMLHttpRequest = jest.fn(() => {
            xhrInstances.push(mockXHR);
            return mockXHR;
        }) as any;
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('uploadToR2', () => {
        it('should upload a file successfully', async () => {
            const presignedUrl = 'https://example.com/upload?signature=abc123';
            const file = new File(['test content'], 'test.txt', { type: 'text/plain' });

            const uploadPromise = uploadToR2(presignedUrl, file);

            // Simulate successful upload
            setTimeout(() => {
                mockXHR.status = 200;
                if (mockXHR.onload) mockXHR.onload();
            }, 10);

            const url = await uploadPromise;

            expect(url).toBe('https://example.com/upload');
            expect(mockXHR.open).toHaveBeenCalledWith('PUT', presignedUrl, true);
            expect(mockXHR.setRequestHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
            expect(mockXHR.send).toHaveBeenCalledWith(file);
        });

        it('should upload a blob with custom content type', async () => {
            const presignedUrl = 'https://example.com/upload?signature=abc123';
            const blob = new Blob(['test content'], { type: 'application/octet-stream' });

            const uploadPromise = uploadToR2(presignedUrl, blob, {
                contentType: 'image/png',
            });

            setTimeout(() => {
                mockXHR.status = 200;
                if (mockXHR.onload) mockXHR.onload();
            }, 10);

            await uploadPromise;

            expect(mockXHR.setRequestHeader).toHaveBeenCalledWith('Content-Type', 'image/png');
        });

        it('should track upload progress', async () => {
            const presignedUrl = 'https://example.com/upload?signature=abc123';
            const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
            const onProgress = jest.fn();

            const uploadPromise = uploadToR2(presignedUrl, file, { onProgress });

            // Simulate progress events
            setTimeout(() => {
                if (mockXHR.upload.onprogress) {
                    mockXHR.upload.onprogress({
                        lengthComputable: true,
                        loaded: 50,
                        total: 100,
                    });
                    mockXHR.upload.onprogress({
                        lengthComputable: true,
                        loaded: 100,
                        total: 100,
                    });
                }
                mockXHR.status = 200;
                if (mockXHR.onload) mockXHR.onload();
            }, 10);

            await uploadPromise;

            expect(onProgress).toHaveBeenCalledWith(0); // Initial call
            expect(onProgress).toHaveBeenCalledWith(50);
            expect(onProgress).toHaveBeenCalledWith(100);
        });

        it('should call lifecycle callbacks', async () => {
            const presignedUrl = 'https://example.com/upload?signature=abc123';
            const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
            const onStart = jest.fn();
            const onSuccess = jest.fn();
            const onComplete = jest.fn();

            const uploadPromise = uploadToR2(presignedUrl, file, {
                onStart,
                onSuccess,
                onComplete,
            });

            setTimeout(() => {
                mockXHR.status = 200;
                if (mockXHR.onload) mockXHR.onload();
            }, 10);

            const url = await uploadPromise;

            expect(onStart).toHaveBeenCalled();
            expect(onSuccess).toHaveBeenCalledWith(url);
            expect(onComplete).toHaveBeenCalled();
        });

        it('should handle upload errors', async () => {
            const presignedUrl = 'https://example.com/upload?signature=abc123';
            const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
            const onError = jest.fn();

            const uploadPromise = uploadToR2(presignedUrl, file, { onError });

            setTimeout(() => {
                mockXHR.status = 500;
                mockXHR.statusText = 'Internal Server Error';
                if (mockXHR.onload) mockXHR.onload();
            }, 10);

            await expect(uploadPromise).rejects.toThrow();
            expect(onError).toHaveBeenCalled();
        });

        it('should handle network errors', async () => {
            const presignedUrl = 'https://example.com/upload?signature=abc123';
            const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
            const onError = jest.fn();
            const onComplete = jest.fn();

            const uploadPromise = uploadToR2(presignedUrl, file, { onError, onComplete });

            setTimeout(() => {
                mockXHR.statusText = 'Network Error';
                if (mockXHR.onerror) mockXHR.onerror();
            }, 10);

            await expect(uploadPromise).rejects.toThrow();
            expect(onError).toHaveBeenCalled();
            expect(onComplete).toHaveBeenCalled();
        });

        it('should use default content type for blob without type', async () => {
            const presignedUrl = 'https://example.com/upload?signature=abc123';
            const blob = new Blob(['test content']);

            const uploadPromise = uploadToR2(presignedUrl, blob);

            setTimeout(() => {
                mockXHR.status = 200;
                if (mockXHR.onload) mockXHR.onload();
            }, 10);

            await uploadPromise;

            expect(mockXHR.setRequestHeader).toHaveBeenCalledWith('Content-Type', 'image/png');
        });
    });

    describe('uploadToR2WithResult', () => {
        it('should return success result on successful upload', async () => {
            const presignedUrl = 'https://example.com/upload?signature=abc123';
            const file = new File(['test content'], 'test.txt', { type: 'text/plain' });

            const uploadPromise = uploadToR2WithResult(presignedUrl, file);

            setTimeout(() => {
                mockXHR.status = 200;
                if (mockXHR.onload) mockXHR.onload();
            }, 10);

            const result = await uploadPromise;

            expect(result.success).toBe(true);
            expect(result.url).toBe('https://example.com/upload');
        });

        it('should return failure result on upload error', async () => {
            const presignedUrl = 'https://example.com/upload?signature=abc123';
            const file = new File(['test content'], 'test.txt', { type: 'text/plain' });

            const uploadPromise = uploadToR2WithResult(presignedUrl, file);

            setTimeout(() => {
                mockXHR.status = 500;
                mockXHR.statusText = 'Internal Server Error';
                if (mockXHR.onload) mockXHR.onload();
            }, 10);

            const result = await uploadPromise;

            expect(result.success).toBe(false);
            expect(result.url).toBe('');
        });
    });
});
