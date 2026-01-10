import { IPaginationParams } from "@posty5/core";
import { IFormStatusType } from "../types/type";


/**
 * Request interface for changing form submission status
 */
export interface IChangeStatusRequest {
    /** New status (required) */
    status: IFormStatusType;
    /** Rejection reason (optional) */
    rejectedReason?: string | null;
    /** Additional notes (optional) */
    notes?: string | null;
}




export interface IListParams {
    /** Filtered fields (optional), Pass form fields to allows search on it 
     * @example name,phone,email
     */
    filtredFields?: string;

    /** Html hosting id , pass the target page landing id 
     */
    htmlHostingId: string;
    /** 
     * Form ID (optional): Pass the HTML form ID. 
     * This allows the HTML Hosting system to track and retrieve all submitted forms on your page.
     */
    formId?: string;
    /** Numbering (optional) */
    numbering?: string;
    /** Status (optional) */
    status?: IFormStatusType;

}