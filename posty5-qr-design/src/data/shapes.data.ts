import type { QrDotShape, QrEyeBallShape, QrEyeFrameShape } from '../enums';
import type { IQrShapeDefinition } from '../interface';

/** Data-module shapes; the first is the default. */
export const QrDotShapes: readonly IQrShapeDefinition<QrDotShape>[] = [
    { id: 'square', labelKey: 'qrDesign.dotShape.square' },
    { id: 'rounded', labelKey: 'qrDesign.dotShape.rounded' },
    { id: 'dots', labelKey: 'qrDesign.dotShape.dots' },
    { id: 'classy', labelKey: 'qrDesign.dotShape.classy' },
    { id: 'extraRounded', labelKey: 'qrDesign.dotShape.extraRounded' },
];

/** Position-pattern outer rings; the first is the default. */
export const QrEyeFrameShapes: readonly IQrShapeDefinition<QrEyeFrameShape>[] = [
    { id: 'square', labelKey: 'qrDesign.eyeFrameShape.square' },
    { id: 'rounded', labelKey: 'qrDesign.eyeFrameShape.rounded' },
    { id: 'circle', labelKey: 'qrDesign.eyeFrameShape.circle' },
    { id: 'leaf', labelKey: 'qrDesign.eyeFrameShape.leaf' },
];

/** Position-pattern centres; the first is the default. */
export const QrEyeBallShapes: readonly IQrShapeDefinition<QrEyeBallShape>[] = [
    { id: 'square', labelKey: 'qrDesign.eyeBallShape.square' },
    { id: 'rounded', labelKey: 'qrDesign.eyeBallShape.rounded' },
    { id: 'circle', labelKey: 'qrDesign.eyeBallShape.circle' },
    { id: 'diamond', labelKey: 'qrDesign.eyeBallShape.diamond' },
];
