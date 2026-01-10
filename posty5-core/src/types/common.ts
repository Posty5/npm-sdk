/**
 * Standard API response wrapper
 */
export interface IApiResponse<T = any> {
    /** Response data */
    data: T;
    /** Success status */
    success: boolean;
    /** Response message */
    message?: string;
    /** Error details if any */
    error?: any;
}

/**
 * API error response structure
 */
export interface IApiErrorResponse {
    /** Error message */
    message: string;
    /** Error code */
    code?: string;
    /** HTTP status code */
    statusCode: number;
    /** Validation errors */
    errors?: Array<{
        field: string;
        message: string;
    }>;
    /** Additional error details */
    details?: any;
}
