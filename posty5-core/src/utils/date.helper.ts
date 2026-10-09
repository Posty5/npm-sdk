/**
 * An ISO calendar date (`YYYY-MM-DD`) for a query string. A `Date` becomes its
 * UTC calendar day; a string is sent as given (the API validates it). An
 * invalid `Date` throws a `RangeError`, as `Date.prototype.toISOString` does.
 */
export function toIsoDateString(value: string | Date): string {
    return value instanceof Date ? value.toISOString().slice(0, 10) : value;
}
