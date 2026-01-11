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
    /**
     * Tag (optional)
     * Use this field to filter variables by tag.
     * You can pass any custom value from your system.
     */
    tag?: string;
    /**
     * Reference ID (optional)
     * Use this field to filter variables by reference ID.
     * You can pass any custom identifier from your system.
     */
    refId?: string;
}

export interface IListParams {
    /** Variable name (optional) */
    name?: string;
    /** Variable key (optional) */
    key?: string;
    /** Variable value (optional) */
    value?: string;
    /**
     * API Key ID (optional)
     * You can use this field to filter variables by API key
     */
    apiKeyId?: string;
    /**
     * Tag (optional)
     * You can use this field to filter variables by tag
     */
    tag?: string;
    /**
     * Reference ID (optional)
     * You can use this field to filter variables by reference ID
     */
    refId?: string;
}

