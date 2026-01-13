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
    exception?: IInvalidField[]|{message: string} | string| null;
    /** Additional error details */
    details?: any;
}

export interface IInvalidField {
context:{
label: string;
key: string;
}
message: string;
path: string[];
type: string;
}
