import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import axiosRetry from 'axios-retry';
import { IHttpClientConfig, IPosty5Config, IRequestConfig } from '../types';
import { transformError } from '../errors';
import { IResponse } from '../interface';

/**
 * HTTP Client for making requests to the Posty5 API
 */
export class HttpClient {
    private axiosInstance: AxiosInstance;
    private config: IHttpClientConfig;

    constructor(config: IPosty5Config = {}) {
        // Merge user config with internal defaults
        this.config = {
            baseUrl: 'https://api.posty5.com',
            timeout: 30000,
            maxRetries: 3,
            retryDelay: 1000,
            ...config,
        };

        // Create axios instance
        this.axiosInstance = axios.create({
            baseURL: this.config.baseUrl,
            timeout: this.config.timeout,
            headers: {
                'Content-Type': 'application/json',
                ...this.config.headers,
            },
        });

        // Configure retry logic
        axiosRetry(this.axiosInstance, {
            retries: this.config.maxRetries || 3,
            retryDelay: (retryCount) => {
                return retryCount * (this.config.retryDelay || 1000);
            },
            retryCondition: (error) => {
                // Retry on network errors and 5xx server errors
                return (
                    axiosRetry.isNetworkOrIdempotentRequestError(error) ||
                    (error.response?.status !== undefined && error.response.status >= 500)
                );
            },
        });

        // Add request interceptor for authentication
        this.axiosInstance.interceptors.request.use(
            (config) => {
                // Add API key if provided
                if (this.config.apiKey) {
                    config.headers['X-API-Key'] = this.config.apiKey;
                }

                if (this.config.debug) {
                    console.log('[Posty5 SDK] Request:', {
                        method: config.method,
                        url: config.url,
                        params: config.params,
                    });
                }

                return config;
            },
            (error) => {
                      if (this.config.debug) {
                    console.log('[Posty5 SDK] Request Error:',error);
                }
                return Promise.reject(transformError(error));
            }
        );

        // Add response interceptor for error handling
        this.axiosInstance.interceptors.response.use(
            (response) => {
                if (this.config.debug) {
                    console.log('[Posty5 SDK] Response:', {
                        status: response.status,
                        data: response.data,
                    });
                }
                return response;
            },
            (error) => {
                if (this.config.debug) {
                    console.error('[Posty5 SDK] Error:', JSON.stringify(error.response?.data || error.message));
                }
                return Promise.reject(transformError(error));
            }
        );
    }

    /**
     * Set or update the API key
     */
    public setApiKey(apiKey: string): void {
        this.config.apiKey = apiKey;
    }

    /**
     * Clear authentication credentials
     */
    public clearAuth(): void {
        this.config.apiKey = undefined;
    }

    /**
     * Make a GET request
     */
    public async get<T = any>(url: string, config?: IRequestConfig): Promise<IResponse<T>> {
        try {
            const response: AxiosResponse<IResponse<T>> = await this.axiosInstance.get(url, this.buildConfig(config));
            return response.data;
        } catch (error) {
            throw transformError(error);
        }
    }

    /**
     * Make a POST request
     */
    public async post<T = any>(url: string, data?: any, config?: IRequestConfig): Promise<IResponse<T>> {
        try {
            const response: AxiosResponse<IResponse<T>> = await this.axiosInstance.post(
                url,
                data,
                this.buildConfig(config)
            );
            return response.data;
        } catch (error) {
            throw transformError(error);
        }
    }

    /**
     * Make a PUT request
     */
    public async put<T = any>(url: string, data?: any, config?: IRequestConfig): Promise<IResponse<T>> {
        try {
            const response: AxiosResponse<IResponse<T>> = await this.axiosInstance.put(
                url,
                data,
                this.buildConfig(config)
            );
            return response.data;
        } catch (error) {
            throw transformError(error);
        }
    }

    /**
     * Make a PATCH request
     */
    public async patch<T = any>(url: string, data?: any, config?: IRequestConfig): Promise<IResponse<T>> {
        try {
            const response: AxiosResponse<IResponse<T>> = await this.axiosInstance.patch(
                url,
                data,
                this.buildConfig(config)
            );
            return response.data;
        } catch (error) {
               if (this.config.debug) {
                    console.log('[Posty5 SDK] PATCH Request Error:',error);
                }
            throw transformError(error);
        }
    }

    /**
     * Make a DELETE request
     */
    public async delete<T = any>(url: string, config?: IRequestConfig): Promise<IResponse<T>> {
        try {
            const response: AxiosResponse<IResponse<T>> = await this.axiosInstance.delete(
                url,
                this.buildConfig(config)
            );
            return response.data;
        } catch (error) {
              if (this.config.debug) {
                    console.log('[Posty5 SDK] DELETE Request Error:',error);
                }
            throw transformError(error);
        }
    }

    /**
     * Build axios config from request config
     */
    private buildConfig(config?: IRequestConfig): AxiosRequestConfig {
        if (!config) {
            return {};
        }

        const axiosConfig: AxiosRequestConfig = {};

        if (config.headers) {
            axiosConfig.headers = config.headers;
        }

        if (config.params) {
            axiosConfig.params = config.params;
        }

        if (config.timeout) {
            axiosConfig.timeout = config.timeout;
        }

        if (config.skipRetry) {
            axiosConfig['axios-retry'] = { retries: 0 };
        }

        return axiosConfig;
    }
}
