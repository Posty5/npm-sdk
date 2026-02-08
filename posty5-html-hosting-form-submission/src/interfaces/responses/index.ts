import { IPaginationResponse } from "@posty5/core";
import { IFormStatusType } from "../types/type";

// ============================================================================
// HELPER INTERFACES
// ============================================================================

/**
 * HTML hosting object (populated)
 */
export interface IHtmlHosting {
  _id: string;
  name: string;
  customLandingId?: string;
}

/**
 * Form object (populated)
 */
export interface IForm {
  _id: string;
  name: string;
  fields?: any[];
}

/**
 * Status history grouped by day
 */
export interface IStatusHistoryGroupedDay {
  date: string;
  statusHistory: any[];
}

// ============================================================================
// RESPONSE INTERFACES
// ============================================================================

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
  /** External reference ID */
  refId?: string;
  /** Custom tag */
  tag?: string;
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
 * HTML hosting form submission full details response (from GET by ID)
 */
export interface IHtmlHostingFormSubmissionFullDetailsResponse extends IHtmlHostingFormSubmissionResponse {
  /** HTML hosting object (populated) */
  htmlHosting?: IHtmlHosting;
  /** Form configuration object (populated) */
  form?: IForm;
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
 * Get form submission response (returns full details with populated fields)
 */
export type IGetFormSubmissionResponse = IHtmlHostingFormSubmissionFullDetailsResponse;

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
