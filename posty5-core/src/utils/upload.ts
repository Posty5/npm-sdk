/**
 * Upload utility for Cloudflare R2 storage
 */

/**
 * Options for file upload
 */
export interface IUploadOptions {
    /**
     * Content type of the file (e.g., 'image/png', 'video/mp4')
     * @default 'image/png'
     */
    contentType?: string;

    /**
     * Callback function to track upload progress
     * Note: Currently shows 0% at start and 100% on completion.
     * Intermediate progress tracking requires XMLHttpRequest which is not available in Node.js.
     * @param progress - Upload progress percentage (0 or 100)
     */
    onProgress?: (progress: number) => void;

    /**
     * Callback function called when upload starts
     */
    onStart?: () => void;

    /**
     * Callback function called when upload completes successfully
     * @param url - The final URL of the uploaded file
     */
    onSuccess?: (url: string) => void;

    /**
     * Callback function called when upload fails
     * @param error - The error that occurred
     */
    onError?: (error: Error) => void;

    /**
     * Callback function called when upload finishes (success or failure)
     */
    onComplete?: () => void;
}

/**
 * Result of a file upload operation
 */
export interface IUploadResult {
    /**
     * The final URL of the uploaded file (without query parameters)
     */
    url: string;

    /**
     * Whether the upload was successful
     */
    success: boolean;
}

/**
 * Upload a file or blob to Cloudflare R2 using a presigned URL
 * 
 * @param presignedUrl - The presigned URL obtained from the API
 * @param fileOrBlob - The file or blob to upload
 * @param options - Optional upload configuration
 * @returns Promise resolving to the uploaded file URL
 * 
 * @example
 * ```typescript
 * import { uploadToR2 } from '@posty5/core';
 * 
 * // Basic upload
 * const url = await uploadToR2(presignedUrl, file);
 * console.log('File uploaded to:', url);
 * 
 * // Upload with progress tracking
 * const url = await uploadToR2(presignedUrl, file, {
 *   contentType: 'image/jpeg',
 *   onProgress: (progress) => {
 *     console.log(`Upload progress: ${progress}%`);
 *   },
 *   onSuccess: (url) => {
 *     console.log('Upload successful:', url);
 *   },
 *   onError: (error) => {
 *     console.error('Upload failed:', error);
 *   }
 * });
 * ```
 */
export async function uploadToR2(
    presignedUrl: string,
    fileOrBlob: File | Blob,
    options: IUploadOptions = {}
): Promise<string> {
    const {
        contentType,
        onProgress,
        onStart,
        onSuccess,
        onError,
        onComplete
    } = options;

    // Trigger start callback
    if (onStart) {
        onStart();
    }

    // Initialize progress
    if (onProgress) {
        onProgress(0);
    }

    try {
        // Determine content type
        const isFile = fileOrBlob instanceof File;
        const finalContentType = contentType ||
            (isFile ? fileOrBlob.type : (fileOrBlob.type || 'image/png')) ||
            'image/png';

        // Upload using fetch API (works in both browser and Node.js 18+)
        const response = await fetch(presignedUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': finalContentType,
            },
            body: fileOrBlob,
        });

        if (!response.ok) {
            throw new Error(`Upload failed with status ${response.status}: ${response.statusText}`);
        }

        // Update progress to 100%
        if (onProgress) {
            onProgress(100);
        }

        // Extract URL without query parameters
        const uploadedUrl = presignedUrl.split('?')[0];

        // Trigger success callback
        if (onSuccess) {
            onSuccess(uploadedUrl);
        }

        return uploadedUrl;
    } catch (error) {
        // Reset progress on error
        if (onProgress) {
            onProgress(0);
        }

        // Trigger error callback
        if (onError) {
            onError(error as Error);
        }

        throw error;
    } finally {
        // Trigger complete callback
        if (onComplete) {
            onComplete();
        }
    }
}

/**
 * Upload a file or blob to Cloudflare R2 using a presigned URL with detailed result
 * 
 * @param presignedUrl - The presigned URL obtained from the API
 * @param fileOrBlob - The file or blob to upload
 * @param options - Optional upload configuration
 * @returns Promise resolving to upload result with URL and success status
 * 
 * @example
 * ```typescript
 * import { uploadToR2WithResult } from '@posty5/core';
 * 
 * const result = await uploadToR2WithResult(presignedUrl, file, {
 *   onProgress: (progress) => console.log(`${progress}%`)
 * });
 * 
 * if (result.success) {
 *   console.log('File uploaded to:', result.url);
 * }
 * ```
 */
export async function uploadToR2WithResult(
    presignedUrl: string,
    fileOrBlob: File | Blob,
    options: IUploadOptions = {}
): Promise<IUploadResult> {
    try {
        const url = await uploadToR2(presignedUrl, fileOrBlob, options);
        return {
            url,
            success: true
        };
    } catch (error) {
        return {
            url: '',
            success: false
        };
    }
}
