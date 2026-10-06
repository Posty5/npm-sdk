import type { QrEcLevel } from '../enums';

/** The text does not fit in a version-40 symbol at this EC level. Callers map it to 400. */
export class QrCapacityError extends Error {
    readonly code = 'QR_CAPACITY_EXCEEDED';

    constructor(
        readonly textLength: number,
        readonly ecLevel: QrEcLevel,
    ) {
        super(`QR content is too long (${textLength} chars) for error-correction level ${ecLevel}.`);
        this.name = 'QrCapacityError';
        Object.setPrototypeOf(this, QrCapacityError.prototype);
    }
}
