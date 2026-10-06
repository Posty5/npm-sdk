// @posty5/qr-design — public exports only (K2).

export { normalizeDesign, isV2Design } from './normalize/normalize.helper';
export { encodeMatrix } from './matrix/encoder.helper';
export { renderDesignSvg } from './render/svg-composer';
export { checkScannability } from './scannability/scannability.helper';
export { isValidColor } from './render/color.helper';
export { presetWidthMm } from './render/output-size.helper';
export { QrCapacityError } from './errors/qr-capacity.error';

export { QrFrames } from './data/frames.data';
export { QrCtaPresets } from './data/cta-presets.data';
export { QrPrintPresets } from './data/print-presets.data';
export { QrDotShapes, QrEyeFrameShapes, QrEyeBallShapes } from './data/shapes.data';
export { QR_SCANNABILITY_THRESHOLDS as QrScannabilityThresholds } from './config/scannability-thresholds.config';
export {
    QR_DESIGN_WIDTH_MIN,
    QR_DESIGN_WIDTH_MAX,
    QR_MAX_RASTER_EDGE_PX,
    QR_PRINT_DPI_VALUES,
    QR_PRINT_DPI_DEFAULT,
    QR_FRAME_TEXT_MAX_CHARS,
    QR_FILL_STOPS_MIN,
    QR_FILL_STOPS_MAX,
} from './config/render-limits.config';

export type * from './enums';
export type {
    IQrFill,
    IQrFillStop,
    IQrFrameOptions,
    IQrDesignOptions,
    IQrDesign,
    IQrEyeColors,
    IQrMatrix,
    IQrRenderOptions,
    IQrRenderResult,
    IQrRenderSymbol,
    IQrFrameDefinition,
    IQrCtaPreset,
    IQrPrintPreset,
    IQrShapeDefinition,
    IQrScannabilityThreshold,
    IQrScannabilityThresholds,
    IQrScannabilityCheck,
    IQrScannabilitySymbol,
    IQrScannabilityReport,
    IQrScannabilityOptions,
} from './interface';
