/** ─── Pagination ───────────────────────────────────────────────────────────
 *
 * Every list endpoint pages by opaque cursor rather than by page number, so a
 * list stays stable while rows are being written underneath it. Pass the
 * previous page's `pagination.nextCursor` back as `cursor` to advance.
 */

export interface IPaginationParams {
  /** Opaque cursor from the previous page's `pagination.nextCursor`. */
  cursor?: string;
  /** Rows per page (default 10). */
  pageSize?: number;
  /** Field to sort by. */
  sortField?: string;
  /** Sort direction. */
  sortType?: "asc" | "desc";
}

export interface IPaginationMeta {
  nextCursor?: string | null;
  previousCursor?: string | null;
  hasMore?: boolean;
  totalCount?: number;
  pageSize?: number;
}

export interface IPaginated<T> {
  items: T[];
  pagination: IPaginationMeta;
}

/** A created-at range. Both ends are needed — one alone is ignored. */
export interface IDateRangeParams {
  fromDate?: string;
  toDate?: string;
}

/** ─── Excel ──────────────────────────────────────────────────────────────── */

/**
 * An .xlsx upload. The file travels base64-encoded in the JSON body: this API
 * has no multipart middleware, and an import-sized sheet is tens of KB.
 */
export interface IExcelUploadInput {
  fileBase64: string;
  fileName?: string;
}

/** One row's outcome in a bulk/import operation. */
export interface IBulkRowResult {
  row: number;
  name?: string;
  status: "imported" | "failed";
  errors: string[];
}

/** Report returned by every bulk create and Excel import. */
export interface IBulkImportReport {
  totalRows: number;
  imported: number;
  failed: number;
  creditsCharged: number;
  rows: IBulkRowResult[];
}
