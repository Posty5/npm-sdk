import type { IQrPrintPreset } from '../interface';

/** Print presets (K3, QD-D11): artwork width in mm, no bleed, sRGB. */
export const QrPrintPresets: readonly IQrPrintPreset[] = [
    { id: 'sticker-3cm', labelKey: 'qrExport.preset.sticker-3cm', mm: 30 },
    { id: 'business-card', labelKey: 'qrExport.preset.business-card', mm: 25 },
    { id: 'flyer-5cm', labelKey: 'qrExport.preset.flyer-5cm', mm: 50 },
    { id: 'table-tent-8cm', labelKey: 'qrExport.preset.table-tent-8cm', mm: 80 },
    { id: 'poster-15cm', labelKey: 'qrExport.preset.poster-15cm', mm: 150 },
    { id: 'custom', labelKey: 'qrExport.preset.custom', minMm: 20, maxMm: 500 },
];
