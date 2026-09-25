import { IQueuedSupplierImport, ISupplierImportResult } from "../interfaces";

/**
 * Whether an import was too large to run inline and was queued instead.
 *
 * `importProducts` answers one of two shapes: the rows (small imports) or a
 * job id to poll with `getImportStatus` (large ones). This is the one place
 * that tells them apart.
 */
export function isQueuedImport(result: ISupplierImportResult): result is IQueuedSupplierImport {
  return typeof result.jobId === "string" && result.jobId.length > 0;
}
