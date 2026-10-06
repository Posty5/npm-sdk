import type { IQrScannabilityThresholds } from '../interface';

/** K5 default thresholds. Exported as `QrScannabilityThresholds`. */
export const QR_SCANNABILITY_THRESHOLDS: IQrScannabilityThresholds = {
    contrast: { warning: 4.5, poor: 3 },
    logoCoverage: {
        L: { warning: 3, poor: 5 },
        M: { warning: 8, poor: 12 },
        Q: { warning: 12, poor: 18 },
        H: { warning: 15, poor: 22 },
    },
    quietZone: { warning: 4, poor: 2 },
    moduleSizeMm: { warning: 0.5, poor: 0.33 },
    moduleSizePx: { warning: 4, poor: 2 },
    dotScale: { warning: 0.7, poor: 0.5 },
};

/** Background assumed when the design's background is transparent. */
export const QR_ASSUMED_BACKGROUND = '#ffffff';
