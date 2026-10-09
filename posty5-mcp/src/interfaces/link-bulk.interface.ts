import type { ILinkBulkJobResultUrl, LinkBulkJobStatus } from "@posty5/core";

/** What `qr_code_create_many` (zip) and `qr_code_get_bulk_job` answer about a bulk job. */
export interface IQrBulkJobAnswer {
  jobId: string;
  status: LinkBulkJobStatus;
  rowCount?: number;
  processed?: number;
  created?: number;
  failed?: number;
  /** Signed, expiring link to the ZIP of QR images. */
  zip?: ILinkBulkJobResultUrl;
  /** Signed, expiring link to the per-row result CSV. */
  result?: ILinkBulkJobResultUrl;
  /** Signed, expiring link to the refused rows' CSV. */
  errors?: ILinkBulkJobResultUrl;
  note?: string;
  next?: string;
}
