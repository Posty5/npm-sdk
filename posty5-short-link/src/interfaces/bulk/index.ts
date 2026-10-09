import type { IListParams } from "../requests";
import type { ILinkExportParams } from "@posty5/core";

/** One row of `ShortLinkClient.createMany` (and of a short-link bulk job file). */
export interface IShortLinkBulkRow {
    /** Destination URL (CSV header alias `baseUrl`). */
    url: string;
    name?: string;
    customId?: string;
    tag?: string;
    refId?: string;
    /** Overrides `defaults.templateId`; API-key callers need one of the two. */
    templateId?: string;
}

/** Query of `ShortLinkClient.export`: the list filters plus `format`. */
export type IShortLinkExportParams = IListParams & ILinkExportParams;

// Shared bulk shapes: declared once in @posty5/core, re-exported for callers of this package
export type {
    IBulkDefaults,
    IBulkRowError,
    IBulkRowResult,
    IBulkCreateResult,
    IBulkCreateOptions,
    IBulkDryRunReport,
    ICreateLinkBulkJobInput,
    ILinkBulkJob,
    ILinkBulkJobResultUrl,
    IWaitForBulkJobOptions,
    LinkBulkJobStatus,
    LinkBulkFileFormat,
} from "@posty5/core";
