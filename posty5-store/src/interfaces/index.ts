export * from "./common";
export * from "./products";
export * from "./orders";
export * from "./tags";
export * from "./customers";
export * from "./shipping";

import { IBulkImportReport } from "./common";

/**
 * @deprecated Renamed to `IBulkImportReport` — the same report is returned by
 * every bulk create and Excel import, not just products. Kept as an alias so
 * existing code keeps compiling.
 */
export type IBulkProductsReport = IBulkImportReport;
