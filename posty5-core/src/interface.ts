export interface IResponse<T> {

    message: string;
    isSuccess?: boolean;
    noMoreOfResult?: boolean;
    result?: T;
    exeption?: any;
    /** The document's new version after a versioned write (D-10). */
    version?: number;
    /** New versions per id after a bulk versioned write. */
    versions?: Record<string, number>;
    /** Stable error/status code, e.g. `VERSION_CONFLICT`. */
    code?: string;
}

/** An item a bulk versioned write did not apply. */
export interface IBulkSkippedItem {
    _id: string;
    code: string;
    currentVersion?: number;
}

/** What a bulk versioned write reports, beside the route's own result. */
export interface IBulkVersionedResult {
    applied: string[];
    skipped: IBulkSkippedItem[];
    versions: Record<string, number>;
}
