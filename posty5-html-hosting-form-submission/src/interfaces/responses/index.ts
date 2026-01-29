import { IPaginationResponse } from "@posty5/core";
import { IFormStatusType } from "../types/type";

/**
 * Status history entry
 */
export interface IStatusHistoryEntry {
  /** Status value */
  status: IFormStatusType;
  /** Rejection reason (if rejected) */
  rejectedReason?: string;
  /** Changed date */
  changedAt: string;
  /** Additional notes */
  notes?: string;
}

/**
 * Syncing status
 */
export interface ISyncingStatus {
  /** Is syncing done */
  isDone: boolean;
  /** Last error message */
  lastError?: string;
  /** Last attempt date */
  lastAttemptAt?: string;
}

/**
 * HTML hosting form submission response
 */
export interface IHtmlHostingFormSubmissionResponse {
  /** Submission ID */
  _id: string;
  /** HTML hosting ID (reference) */
  htmlHostingId: string;
  /** Form ID (reference) */
  formId: string;
  /** Visitor ID (reference) */
  visitorId: string;
  /** Submission numbering */
  numbering: string;
  /** Form data (key-value pairs) */
  data: Record<string, any>;
  /** Form fields list */
  fields?: string[];
  /** Current status */
  status: IFormStatusType;
  /** Status history */
  statusHistory: IStatusHistoryEntry[];
  /** Syncing status */
  syncing: ISyncingStatus;
  /** Created date */
  createdAt: string;
  /** Updated date */
  updatedAt?: string;
}

/**
 * Next and previous submission navigation
 */
export interface INextPreviousSubmission {
  /** Submission ID */
  _id: string;
  /** Submission numbering (padded) */
  numbering: string;
}

/**
 * Next and previous submissions response
 */
export interface INextPreviousSubmissionsResponse {
  /** Previous submission (if exists) */
  previous?: INextPreviousSubmission;
  /** Next submission (if exists) */
  next?: INextPreviousSubmission;
}

/**
 * Search form submissions response (paginated)
 */
export type ISearchFormSubmissionsResponse = IPaginationResponse<IHtmlHostingFormSubmissionResponse>;

/**
 * Get form submission response
 */
export type IGetFormSubmissionResponse = IHtmlHostingFormSubmissionResponse;

/**
 * Change status response
 */
export interface IChangeStatusResponse {
  /** Success message */
  message?: string;
  /** Updated status history (grouped) */
  statusHistory?: any[];
}

/**
 * Delete form submission response
 */
export interface IDeleteFormSubmissionResponse {
  /** Success message */
  message?: string;
}
