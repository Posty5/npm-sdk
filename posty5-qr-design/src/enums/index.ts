/** Data-module shape (K1 `dotShape`). */
export type QrDotShape = 'square' | 'rounded' | 'dots' | 'classy' | 'extraRounded';

/** Outer ring of a position pattern (K1 `eyeFrameShape`). */
export type QrEyeFrameShape = 'square' | 'rounded' | 'circle' | 'leaf';

/** Centre of a position pattern (K1 `eyeBallShape`). */
export type QrEyeBallShape = 'square' | 'rounded' | 'circle' | 'diamond';

/** Fill of the data modules (K1 `fill.type`). */
export type QrFillType = 'solid' | 'linear' | 'radial';

/** Error-correction level. Stored designs use EasyQRCode numbers: L=1, M=0, Q=3, H=2. */
export type QrEcLevel = 'L' | 'M' | 'Q' | 'H';

/** Frame catalogue ids (K3). */
export type QrFrameId =
    | 'title-strip'
    | 'banner-bottom'
    | 'banner-top'
    | 'rounded-box'
    | 'speech-bubble'
    | 'ticket'
    | 'circle-ring';

/** CTA preset ids (K3). */
export type QrCtaPresetId = 'scanMe' | 'scanForMenu' | 'scanToVisit' | 'scanForWifi' | 'scanToContact' | 'scanToReview';

/** Print preset ids (K3). */
export type QrPrintPresetId = 'sticker-3cm' | 'business-card' | 'flyer-5cm' | 'table-tent-8cm' | 'poster-15cm' | 'custom';

/** Scannability check codes (K5). */
export type QrScannabilityCode = 'contrast' | 'inverted' | 'logoCoverage' | 'quietZone' | 'moduleSize' | 'dotScale';

/** Scannability status / verdict (K5). */
export type QrScannabilityStatus = 'good' | 'warning' | 'poor';

/** Role of a module in the symbol; decides its colour, scale and shape. */
export type QrModuleRole = 'data' | 'finder' | 'alignmentOuter' | 'alignmentInner' | 'timingH' | 'timingV';
