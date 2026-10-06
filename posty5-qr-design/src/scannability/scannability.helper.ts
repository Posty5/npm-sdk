import { QR_ASSUMED_BACKGROUND, QR_SCANNABILITY_THRESHOLDS as T } from '../config/scannability-thresholds.config';
import { QR_SCANNABILITY_MESSAGES, QR_SCANNABILITY_TRANSPARENT_NOTE } from '../data/scannability-messages.data';
import type { QrScannabilityCode, QrScannabilityStatus } from '../enums';
import type {
    IQrDesign,
    IQrDesignOptions,
    IQrScannabilityCheck,
    IQrScannabilityOptions,
    IQrScannabilityReport,
    IQrScannabilityThreshold,
    IRgba,
} from '../interface';
import { encodeMatrix } from '../matrix/encoder.helper';
import { toDesign } from '../normalize/normalize.helper';
import { compositeOver, parseColor } from '../render/color.helper';
import { layoutDesign } from '../render/layout.helper';
import { resolveOutputSize } from '../render/output-size.helper';
import { contrastRatio, relativeLuminance } from './contrast.helper';

const RANK: Record<QrScannabilityStatus, number> = { good: 0, warning: 1, poor: 2 };
const WHITE: IRgba = { r: 255, g: 255, b: 255, a: 1 };

const round = (value: number, digits = 2): number => Math.round(value * 10 ** digits) / 10 ** digits;

/** Status when lower values are worse (contrast, quiet zone, module size, dot scale). */
const lowerIsWorse = (value: number, t: IQrScannabilityThreshold): QrScannabilityStatus =>
    t.poor !== null && value < t.poor ? 'poor' : t.warning !== null && value < t.warning ? 'warning' : 'good';

/** Status when higher values are worse (logo coverage). */
const higherIsWorse = (value: number, t: IQrScannabilityThreshold): QrScannabilityStatus =>
    t.poor !== null && value > t.poor ? 'poor' : t.warning !== null && value > t.warning ? 'warning' : 'good';

const check = (
    code: QrScannabilityCode,
    status: QrScannabilityStatus,
    value: number,
    thresholds: IQrScannabilityThreshold,
    note = '',
): IQrScannabilityCheck => ({
    code,
    status,
    value: round(value),
    thresholds,
    messageKey: `qrScannability.${code}.${status}`,
    message: QR_SCANNABILITY_MESSAGES[code][status] + (status === 'good' ? '' : note),
});

/** Every colour a dark module may be painted with. */
const foregroundColors = (d: IQrDesign): string[] =>
    [
        ...d.fill.stops.map((s) => s.color),
        ...d.eyes.outer,
        ...d.eyes.inner,
        d.alignmentOuter,
        d.alignmentInner,
        d.timingH,
        d.timingV,
    ].filter((c): c is string => !!c);

/**
 * K5 scannability report for any design (legacy or v2). Never blocks anything:
 * callers show it as advice (QD-D7). Throws `QrCapacityError` when the text does not fit.
 */
export const checkScannability = (
    input: IQrDesignOptions | IQrDesign,
    text: string,
    opts: IQrScannabilityOptions = {},
): IQrScannabilityReport => {
    const design = toDesign(input);
    const matrix = encodeMatrix(text, design.ecLevel);
    const layout = layoutDesign(design);
    const moduleUnits = design.width / matrix.size;
    const checks: IQrScannabilityCheck[] = [];

    // Contrast and inversion, against the background (white when transparent).
    const transparent = design.backgroundTransparent;
    const note = transparent ? QR_SCANNABILITY_TRANSPARENT_NOTE : '';
    const bg = compositeOver(parseColor(transparent ? QR_ASSUMED_BACKGROUND : design.colorLight) ?? WHITE, WHITE);
    const fgs = foregroundColors(design).map((c) => compositeOver(parseColor(c) ?? { r: 0, g: 0, b: 0, a: 1 }, bg));
    const worstContrast = Math.min(...fgs.map((fg) => contrastRatio(fg, bg)));
    checks.push(check('contrast', lowerIsWorse(worstContrast, T.contrast), worstContrast, T.contrast, note));
    const bgLum = relativeLuminance(bg);
    const inverted = fgs.some((fg) => relativeLuminance(fg) > bgLum);
    const invertedThreshold: IQrScannabilityThreshold = { warning: 1, poor: null };
    checks.push(check('inverted', inverted ? 'warning' : 'good', inverted ? 1 : 0, invertedThreshold, note));

    // Logo coverage, by EC level.
    if (design.logo && design.logoWidth > 0 && design.logoHeight > 0) {
        const coverage = ((design.logoWidth * design.logoHeight) / (design.width * design.width)) * 100;
        const t = T.logoCoverage[design.ecLevel];
        checks.push(check('logoCoverage', higherIsWorse(coverage, t), coverage, t));
    }

    // Quiet zone in modules; light frame padding counts.
    const quietZoneModules = (design.quietZone + layout.framePadding) / moduleUnits;
    checks.push(check('quietZone', lowerIsWorse(quietZoneModules, T.quietZone), quietZoneModules, T.quietZone));

    // Module size at the preset (mm) or at the PNG size (px).
    const out = resolveOutputSize(layout.canvasWidth, layout.canvasHeight, opts);
    let moduleSizeMm: number | undefined;
    if (out.mmPerUnit !== undefined) {
        moduleSizeMm = moduleUnits * out.mmPerUnit;
        checks.push(check('moduleSize', lowerIsWorse(moduleSizeMm, T.moduleSizeMm), moduleSizeMm, T.moduleSizeMm));
    } else {
        const px = moduleUnits * out.pxPerUnit;
        checks.push(check('moduleSize', lowerIsWorse(px, T.moduleSizePx), px, T.moduleSizePx));
    }

    // Smallest dot scale.
    const minScale = Math.min(design.dotScale, design.dotScaleTimingH, design.dotScaleTimingV, design.dotScaleAO, design.dotScaleAI);
    checks.push(check('dotScale', lowerIsWorse(minScale, T.dotScale), minScale, T.dotScale));

    const verdict = checks.reduce<QrScannabilityStatus>((worst, c) => (RANK[c.status] > RANK[worst] ? c.status : worst), 'good');
    return {
        verdict,
        checks,
        symbol: {
            version: matrix.version,
            size: matrix.size,
            ecLevel: design.ecLevel,
            quietZoneModules: round(quietZoneModules),
            ...(moduleSizeMm !== undefined ? { moduleSizeMm: round(moduleSizeMm, 3) } : {}),
        },
    };
};
