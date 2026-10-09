import type {
    QrCtaPresetId,
    QrDotShape,
    QrEcLevel,
    QrEyeBallShape,
    QrEyeFrameShape,
    QrFillType,
    QrFrameId,
    QrModuleRole,
    QrPrintPresetId,
    QrScannabilityCode,
    QrScannabilityStatus,
} from './enums';

// ---------------------------------------------------------------- stored options (K1)

/** One gradient stop. `offset` is 0–1. */
export interface IQrFillStop {
    offset: number;
    color: string;
}

/** Fill of the data modules. One stop ⇒ solid. */
export interface IQrFill {
    type: QrFillType;
    /** Degrees, 0–360, linear only. */
    rotation?: number;
    stops: IQrFillStop[];
}

/** A catalogue frame with an optional call to action. */
export interface IQrFrameOptions {
    id: QrFrameId;
    /** The resolved string (never an i18n key), ≤ 32 chars. */
    text?: string;
    /** Frame colour. */
    color?: string;
    /** CTA text colour. */
    textColor?: string;
}

/**
 * The stored `options` object of a QR code or template: EasyQRCode's legacy names
 * plus the K1 v2 fields. Every field is optional; unknown keys are ignored.
 */
export interface IQrDesignOptions {
    text?: string;
    width?: number;
    height?: number;
    correctLevel?: number;
    dotScale?: number;
    dotScaleTiming?: number;
    dotScaleTiming_H?: number;
    dotScaleTiming_V?: number;
    dotScaleA?: number;
    dotScaleAO?: number;
    dotScaleAI?: number;
    quietZone?: number;
    quietZoneColor?: string;
    colorDark?: string;
    colorLight?: string;
    PO?: string;
    PI?: string;
    PO_TL?: string;
    PO_TR?: string;
    PO_BL?: string;
    PI_TL?: string;
    PI_TR?: string;
    PI_BL?: string;
    AO?: string;
    AI?: string;
    timing?: string;
    timing_H?: string;
    timing_V?: string;
    title?: string;
    titleFont?: string;
    titleColor?: string;
    titleBackgroundColor?: string;
    titleHeight?: number;
    titleTop?: number;
    logo?: string;
    posty5Logo?: string;
    logoWidth?: number;
    logoHeight?: number;
    logoBackgroundColor?: string;
    logoBackgroundTransparent?: boolean;
    // v2 (K1)
    designVersion?: 1 | 2;
    dotShape?: QrDotShape;
    eyeFrameShape?: QrEyeFrameShape;
    eyeBallShape?: QrEyeBallShape;
    fill?: IQrFill;
    backgroundTransparent?: boolean;
    frame?: IQrFrameOptions;
    logoSource?: 'library' | 'upload' | 'url';
    logoExcavate?: boolean;
    [key: string]: unknown;
}

// ---------------------------------------------------------------- normalised design

/** Colours of the three position patterns (TL, TR, BL), resolved. */
export interface IQrEyeColors {
    outer: [string, string, string];
    inner: [string, string, string];
}

/** The normalised design every helper works on (legacy or v2). */
export interface IQrDesign {
    designVersion: 1 | 2;
    ecLevel: QrEcLevel;
    /** Symbol edge in design units (stored `width`, clamped). */
    width: number;
    /** Quiet zone in design units. */
    quietZone: number;
    quietZoneColor?: string;
    colorDark: string;
    colorLight: string;
    backgroundTransparent: boolean;
    fill: IQrFill;
    dotShape: QrDotShape;
    eyeFrameShape: QrEyeFrameShape;
    eyeBallShape: QrEyeBallShape;
    dotScale: number;
    dotScaleTimingH: number;
    dotScaleTimingV: number;
    dotScaleAO: number;
    dotScaleAI: number;
    eyes: IQrEyeColors;
    alignmentOuter?: string;
    alignmentInner?: string;
    timingH?: string;
    timingV?: string;
    logo?: string;
    logoWidth: number;
    logoHeight: number;
    logoBackgroundColor?: string;
    logoBackgroundTransparent: boolean;
    logoExcavate: boolean;
    frame?: IQrFrameOptions;
    /** Legacy title strip (v1 only; v2 expresses it as frame `title-strip`). */
    title?: string;
}

// ---------------------------------------------------------------- matrix

/** The encoded symbol. `modules[row][col]` is true for dark. */
export interface IQrMatrix {
    version: number;
    size: number;
    ecLevel: QrEcLevel;
    modules: boolean[][];
}

// ---------------------------------------------------------------- render

/** Options of `renderDesignSvg`. Pass `sizePx` or `presetId`, not both. */
export interface IQrRenderOptions {
    /** Output width of the whole artwork in px. */
    sizePx?: number;
    presetId?: QrPrintPresetId;
    /** Artwork width in mm for preset `custom` (20–500). */
    customMm?: number;
    /** Raster DPI for a preset (150 / 300 / 600). Default 300. */
    dpi?: number;
    /** The logo as a `data:image/*` URI (or an `https:` URL in a browser preview). The package never fetches. */
    logoDataUri?: string;
}

/** The symbol inside a rendered artwork. */
export interface IQrRenderSymbol {
    version: number;
    size: number;
    moduleSizePx: number;
    quietZoneModules: number;
}

/** Result of `renderDesignSvg`. */
export interface IQrRenderResult {
    svg: string;
    widthPx: number;
    heightPx: number;
    /** Physical size when a print preset was used. */
    widthMm?: number;
    heightMm?: number;
    symbol: IQrRenderSymbol;
}

/** Output size resolved from `sizePx` / preset / DPI. */
export interface IQrOutputSize {
    widthPx: number;
    heightPx: number;
    widthMm?: number;
    heightMm?: number;
    /** Output px per design unit. */
    pxPerUnit: number;
    /** mm per design unit, when a preset is used. */
    mmPerUnit?: number;
}

/** Box in design units. */
export interface IQrBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

/** Where the frame puts the symbol and the CTA text, in design units. */
export interface IQrLayout {
    canvasWidth: number;
    canvasHeight: number;
    /** Symbol area including its quiet zone. */
    symbolBox: IQrBox;
    /** Light padding the frame adds around `symbolBox` (counts as quiet zone). */
    framePadding: number;
    /** Where CTA text goes, when the frame has text. */
    textBox?: IQrBox;
    /** Colour of the CTA text. */
    textColor?: string;
    /** SVG elements of the frame, drawn below the symbol. */
    frameBack: string;
}

/** Geometry of one frame for a symbol box of edge `inner`. */
export interface IQrFrameBuildInput {
    inner: number;
    color: string;
    textColor: string;
    background: string;
    hasText: boolean;
}

// ---------------------------------------------------------------- catalogues

export interface IQrFrameDefinition {
    id: QrFrameId;
    labelKey: string;
    /** Whether the frame has a CTA text area. */
    hasText: boolean;
    defaultColor: string;
    defaultTextColor: string;
}

export interface IQrCtaPreset {
    id: QrCtaPresetId;
    labelKey: string;
    text: { en: string; ar: string };
}

export interface IQrPrintPreset {
    id: QrPrintPresetId;
    labelKey: string;
    /** Artwork width in mm; `custom` gives the allowed range instead. */
    mm?: number;
    minMm?: number;
    maxMm?: number;
}

export interface IQrShapeDefinition<T extends string> {
    id: T;
    labelKey: string;
}

// ---------------------------------------------------------------- scannability (K5)

export interface IQrScannabilityThreshold {
    warning: number | null;
    poor: number | null;
}

export interface IQrScannabilityCheck {
    code: QrScannabilityCode;
    status: QrScannabilityStatus;
    value: number;
    thresholds: IQrScannabilityThreshold;
    messageKey: string;
    message: string;
}

export interface IQrScannabilitySymbol {
    version: number;
    size: number;
    ecLevel: QrEcLevel;
    quietZoneModules: number;
    moduleSizeMm?: number;
}

export interface IQrScannabilityReport {
    verdict: QrScannabilityStatus;
    checks: IQrScannabilityCheck[];
    symbol: IQrScannabilitySymbol;
}

export interface IQrScannabilityOptions {
    presetId?: QrPrintPresetId;
    customMm?: number;
    sizePx?: number;
}

export interface IQrScannabilityThresholds {
    /** WCAG ratio; lower is worse. */
    contrast: IQrScannabilityThreshold;
    /** Per EC level, percent of the symbol area; higher is worse. */
    logoCoverage: Record<QrEcLevel, IQrScannabilityThreshold>;
    /** Modules; lower is worse. */
    quietZone: IQrScannabilityThreshold;
    moduleSizeMm: IQrScannabilityThreshold;
    moduleSizePx: IQrScannabilityThreshold;
    dotScale: IQrScannabilityThreshold;
}

// ---------------------------------------------------------------- colours / text

export interface IRgba {
    r: number;
    g: number;
    b: number;
    a: number;
}

/** Font metrics in font units. */
export interface IGlyphFontMetrics {
    unitsPerEm: number;
    ascender: number;
    descender: number;
}

/** `[fontKey, advanceWidth, pathData]` per code point. */
export type IGlyphEntry = [string, number, string];

export interface IGlyphTable {
    fonts: Record<string, IGlyphFontMetrics>;
    glyphs: Record<string, IGlyphEntry>;
}

/** Text laid out as one outline path. */
export interface IQrTextOutline {
    path: string;
    width: number;
    fontSize: number;
}
