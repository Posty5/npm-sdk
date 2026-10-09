import {
    MM_PER_INCH,
    QR_MAX_RASTER_EDGE_PX,
    QR_MIN_RENDER_PX,
    QR_PRINT_DPI_DEFAULT,
    QR_PRINT_DPI_VALUES,
} from '../config/render-limits.config';
import { QrPrintPresets } from '../data/print-presets.data';
import type { QrPrintPresetId } from '../enums';
import type { IQrOutputSize } from '../interface';

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

/** Artwork width in mm for a preset; `custom` uses `customMm` within its range. Undefined when unknown. */
export const presetWidthMm = (presetId: QrPrintPresetId | undefined, customMm?: number): number | undefined => {
    const preset = QrPrintPresets.find((p) => p.id === presetId);
    if (!preset) return undefined;
    if (preset.mm) return preset.mm;
    const value = typeof customMm === 'number' && Number.isFinite(customMm) ? customMm : (preset.minMm as number);
    return clamp(value, preset.minMm as number, preset.maxMm as number);
};

/**
 * Resolves the output size of an artwork `canvasWidth × canvasHeight` design units
 * from `presetId` (+ `dpi`), else `sizePx`, else 1 px per unit. The longest edge is
 * capped at `QR_MAX_RASTER_EDGE_PX`.
 */
export const resolveOutputSize = (
    canvasWidth: number,
    canvasHeight: number,
    opts: { sizePx?: number; presetId?: QrPrintPresetId; customMm?: number; dpi?: number },
): IQrOutputSize => {
    const mm = presetWidthMm(opts.presetId, opts.customMm);
    let widthPx: number;
    let widthMm: number | undefined;
    if (mm !== undefined) {
        const dpi = (QR_PRINT_DPI_VALUES as readonly number[]).includes(opts.dpi as number) ? (opts.dpi as number) : QR_PRINT_DPI_DEFAULT;
        widthMm = mm;
        widthPx = (mm / MM_PER_INCH) * dpi;
    } else if (typeof opts.sizePx === 'number' && Number.isFinite(opts.sizePx)) {
        widthPx = opts.sizePx;
    } else {
        widthPx = canvasWidth;
    }
    const aspect = canvasHeight / canvasWidth;
    const longest = Math.max(1, aspect);
    widthPx = clamp(widthPx, QR_MIN_RENDER_PX, QR_MAX_RASTER_EDGE_PX / longest);
    const roundedWidth = Math.round(widthPx);
    const pxPerUnit = roundedWidth / canvasWidth;
    return {
        widthPx: roundedWidth,
        heightPx: Math.round(canvasHeight * pxPerUnit),
        pxPerUnit,
        ...(widthMm !== undefined
            ? { widthMm, heightMm: Math.round(widthMm * aspect * 100) / 100, mmPerUnit: widthMm / canvasWidth }
            : {}),
    };
};
