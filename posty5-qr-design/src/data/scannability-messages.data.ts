import type { QrScannabilityCode, QrScannabilityStatus } from '../enums';

/**
 * English text of every K5 message, for SDK/MCP callers. UIs translate
 * `qrScannability.<code>.<status>` instead (newKeys.ts must hold the same copy).
 */
export const QR_SCANNABILITY_MESSAGES: Record<QrScannabilityCode, Record<QrScannabilityStatus, string>> = {
    contrast: {
        good: 'Colours have enough contrast.',
        warning: 'Contrast is low. Darken the code colour or lighten the background.',
        poor: 'Contrast is too low for most cameras. Use a much darker code colour or a lighter background.',
    },
    inverted: {
        good: 'The code is darker than its background.',
        warning: 'The code is lighter than its background. Some scanner apps cannot read inverted codes.',
        poor: 'The code is lighter than its background. Some scanner apps cannot read inverted codes.',
    },
    logoCoverage: {
        good: 'The logo size is safe for this error-correction level.',
        warning: 'The logo covers a lot of the code. Make it smaller or raise error correction.',
        poor: 'The logo covers too much of the code to scan reliably. Make it smaller or raise error correction to H.',
    },
    quietZone: {
        good: 'The margin around the code is wide enough.',
        warning: 'The margin around the code is narrow. Add a quiet zone of at least 4 modules.',
        poor: 'The code has almost no margin. Add a quiet zone, or print it on a plain background.',
    },
    moduleSize: {
        good: 'The code is large enough for its content.',
        warning: 'The dots are small at this size. Print larger or shorten the content.',
        poor: 'The dots are too small to scan at this size. Print larger or shorten the content.',
    },
    dotScale: {
        good: 'Dot size is fine.',
        warning: 'Dots are shrunk. Raise the dot scale for more reliable scanning.',
        poor: 'Dots are shrunk too much to scan reliably. Raise the dot scale.',
    },
};

/** Appended to contrast/inverted messages when a transparent background was assumed white. */
export const QR_SCANNABILITY_TRANSPARENT_NOTE = ' (Background is transparent; measured against white.)';
