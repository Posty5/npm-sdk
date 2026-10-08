import { AxiosError } from 'axios';
import {
    Posty5Error,
    AuthenticationError,
    AuthorizationError,
    ValidationError,
    NotFoundError,
    RateLimitError,
    NetworkError,
    ServerError,
    ConflictError,
    VersionRequiredError,
} from './base-error';
import { IApiErrorResponse, IInvalidField } from '../types';

/**
 * Transform axios errors into Posty5 SDK errors
 */
export function transformError(error: any): Posty5Error {
    // If it's already a Posty5Error, return it
    if (error instanceof Posty5Error) {
        return error;
    }

    // Handle axios errors
    if (error.isAxiosError) {
        const axiosError = error as AxiosError<IApiErrorResponse>;

        // Network errors (no response)
        if (!axiosError.response) {
            if (axiosError.code === 'ECONNABORTED' || axiosError.message.includes('timeout')) {
                return new NetworkError('Request timeout', { originalError: error });
            }
            return new NetworkError('Network error: Unable to connect to server', { originalError: error });
        }

        const { status, data } = axiosError.response;
        const message = data?.message || axiosError.message || 'An error occurred';
        const details = data?.details || data;

        // Map HTTP status codes to specific errors
        switch (status) {
            case 400:
                return new ValidationError(message, data?.exception as IInvalidField[], details);
            case 401:
                return new AuthenticationError(message, details);
            case 403:
                return new AuthorizationError(message, details);
            case 404:
                return new NotFoundError(message, details);
            case 409: {
                // Only a version conflict is typed; any other 409 (the tus
                // upload's offset re-sync, for one) stays a generic error.
                const body: any = data;
                if (body?.code === 'VERSION_CONFLICT') {
                    const result = body?.result ?? {};
                    const current = Number(result.currentVersion ?? body?.currentVersion);
                    return new ConflictError(
                        message,
                        Number.isFinite(current) ? current : -1,
                        String(result._id ?? body?._id ?? ''),
                        details
                    );
                }
                return new Posty5Error(message, body?.code, status, details);
            }
            case 428:
                return new VersionRequiredError(message, details);
            case 429:
                const retryAfter = axiosError.response.headers['retry-after'];
                return new RateLimitError(
                    message,
                    retryAfter ? parseInt(retryAfter, 10) : undefined,
                    details
                );
            case 500:
            case 502:
            case 503:
            case 504:
                return new ServerError(message, status, details);
            default:
                return new Posty5Error(message, data?.code, status, details);
        }
    }

    // Handle generic errors
    if (error instanceof Error) {
        return new Posty5Error(error.message, undefined, undefined, { originalError: error });
    }

    // Handle unknown errors
    return new Posty5Error('An unknown error occurred', undefined, undefined, { originalError: error });
}
