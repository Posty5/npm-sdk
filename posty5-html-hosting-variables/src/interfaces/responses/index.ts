import { IPaginationResponse } from "@posty5/core";

// ============================================================================
// HELPER INTERFACES
// ============================================================================

// ============================================================================
// RESPONSE INTERFACES
// ============================================================================

/**
 * HTML hosting variable response
 */
export interface IHtmlHostingVariableResponse {
  /** Variable ID */
  _id: string;
  /** Document version: pass it to versioned writes (`update`, `delete`, ...). */
  __v: number;
  /** Variable name */
  name: string;
  /** Variable key */
  key: string;
  /** Variable value */
  value: string;
  /** Created date */
  createdAt: string;
  /** Updated date */
  updatedAt?: string;
  tag?: string;
  refId?: string;
}

/**
 * Search HTML hosting variables response (paginated)
 */
export type ISearchHtmlHostingVariablesResponse = IPaginationResponse<IHtmlHostingVariableResponse>;

/**
 * Get HTML hosting variable response
 */
export type IGetHtmlHostingVariableResponse = IHtmlHostingVariableResponse;

/**
 * Create HTML hosting variable response
 */
export interface ICreateHtmlHostingVariableResponse {
  /** Success message */
  message?: string;
}

/**
 * Update HTML hosting variable response
 */
export interface IUpdateHtmlHostingVariableResponse {
  /** Variable ID */
  _id: string;
  /** The variable's new version */
  __v: number;
}

/**
 * Delete HTML hosting variable response
 */
export interface IDeleteHtmlHostingVariableResponse {
  /** Success message */
  message?: string;
}
