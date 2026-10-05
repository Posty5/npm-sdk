import { IBulkCreateResult } from "../types/link-bulk.interface";
import { Posty5Error } from "./base-error";

/**
 * Thrown by `createMany` when a chunk fails as a whole (plan gate, credits,
 * invalid request, retries exhausted). `partialResult` holds the rows the
 * earlier chunks created; `cause` is the original error.
 */
export class Posty5BulkCreateError extends Posty5Error {
    public partialResult: IBulkCreateResult;
    public cause: unknown;

    constructor(cause: Posty5Error | Error, partialResult: IBulkCreateResult) {
        const source = cause as Posty5Error;
        super(source.message, source.code ?? "BULK_CREATE_ERROR", source.statusCode, source.details);
        this.name = "Posty5BulkCreateError";
        this.partialResult = partialResult;
        this.cause = cause;
    }
}
