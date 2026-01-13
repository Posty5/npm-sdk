/**
 * Example: Integrating @posty5/core uploadToR2 utility into Angular service
 * 
 * This example shows how to replace the existing s3.service.ts uploadFile method
 * with the new @posty5/core uploadToR2 utility.
 */

import { Injectable } from '@angular/core';
import { uploadToR2 } from '@posty5/core';
import { AlertService } from './alert.service';
import { SpinnerService } from './spinner.service';

@Injectable({ providedIn: 'root' })
export class S3UploadService {
    constructor(
        private spinnerService: SpinnerService,
        private alertService: AlertService,
    ) { }

    /**
     * Upload a file to R2 using the @posty5/core utility
     * 
     * @param presignedUrl - The presigned URL from the API
     * @param fileOrBlob - The file or blob to upload
     * @param type - Optional content type (default: 'image/png')
     * @returns Promise resolving to the uploaded file URL
     */
    async uploadFile(
        presignedUrl: string,
        fileOrBlob: File | Blob,
        type: string = 'image/png'
    ): Promise<string> {
        try {
            const url = await uploadToR2(presignedUrl, fileOrBlob, {
                contentType: type,
                onStart: () => {
                    this.spinnerService.show();
                    this.spinnerService.progressPercent.next(0);
                },
                onProgress: (progress) => {
                    this.spinnerService.progressPercent.next(progress);
                },
                onSuccess: (url) => {
                    this.spinnerService.progressPercent.next(100);
                },
                onError: (error) => {
                    this.alertService.errorSweet(error.message || 'Error while uploading file');
                },
                onComplete: () => {
                    this.spinnerService.hide();
                }
            });

            return url;
        } catch (error) {
            // Error already handled in onError callback
            // Reset state
            this.spinnerService.hide();
            this.spinnerService.progressPercent.next(0);
            throw error;
        }
    }

    /**
     * Alternative: Upload without throwing errors
     * Returns a result object with success status
     */
    async uploadFileWithResult(
        presignedUrl: string,
        fileOrBlob: File | Blob,
        type: string = 'image/png'
    ): Promise<{ success: boolean; url: string }> {
        try {
            const url = await this.uploadFile(presignedUrl, fileOrBlob, type);
            return { success: true, url };
        } catch (error) {
            return { success: false, url: '' };
        }
    }
}

/**
 * Usage in components:
 * 
 * // Example 1: Basic usage
 * const url = await this.s3Service.uploadFile(presignedUrl, file);
 * 
 * // Example 2: With custom content type
 * const url = await this.s3Service.uploadFile(presignedUrl, file, 'video/mp4');
 * 
 * // Example 3: With result object (no error throwing)
 * const result = await this.s3Service.uploadFileWithResult(presignedUrl, file);
 * if (result.success) {
 *   console.log('Uploaded to:', result.url);
 * }
 */
