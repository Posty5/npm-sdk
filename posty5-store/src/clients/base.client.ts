import { HttpClient } from "@posty5/core";

/**
 * Shared plumbing for the store sub-clients.
 *
 * The only real work here is `toQuery`: the API reads comma-separated id lists
 * (`tagIds=a,b`) and string booleans, so an array or a boolean handed straight
 * to axios would be serialized as `tagIds[]=a&tagIds[]=b` and silently ignored.
 * Normalising once here keeps every filter object plain TypeScript.
 */
export abstract class BaseStoreClient {
  protected readonly http: HttpClient;

  constructor(http: HttpClient) {
    if (!http) throw new Error("An @posty5/core HttpClient is required.");
    this.http = http;
  }

  /** Drop empty values, join arrays, stringify booleans. */
  protected toQuery(filters: object = {}): Record<string, string | number> {
    const query: Record<string, string | number> = {};

    for (const [key, value] of Object.entries(filters as Record<string, unknown>)) {
      if (value === undefined || value === null || value === "") continue;

      if (Array.isArray(value)) {
        if (value.length) query[key] = value.join(",");
      } else if (typeof value === "boolean") {
        query[key] = String(value);
      } else {
        query[key] = value as string | number;
      }
    }

    return query;
  }
}
