/**
 * Pagination parameters for list requests
 */
export interface IPaginationParams {
    /** Page number 
     * @default 1
     */
    page?: number;
    /** Number of items per page 
     * @default 10
     */
    pageSize?: number;
    /** Sort order 
     * @default desc
    */
    sortType?: 'asc' | 'desc';
    /** Sort field default 
     * @default createdAt
     *  */
    sortField?: string;
}

/**
 * Pagination metadata in responses
 */
export interface IPaginationMeta {
    page: number;
    pageSize: number;
}

/**
 * Paginated response wrapper
 */
export interface IPaginationResponse<T> extends IPaginationMeta {
    /** Array of items */
    items: T[];
    /** Pagination metadata */
    // pagination: IPaginationMeta;
}
