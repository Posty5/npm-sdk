/**
 * Request interface for creating an HTML hosting variable
 */
export interface ICreateHtmlHostingVariableRequest {
    /** Variable name (required) */
    name: string;
    /** Variable key (required, will be trimmed) */
    key: string;
    /** Variable value (required) */
    value: string;
}

export interface IListParams {
    /** Variable name (optional) */
    name?: string;
    /** Variable key (optional) */
    key?: string;
    /** Variable value (optional) */
    value?: string;
}
