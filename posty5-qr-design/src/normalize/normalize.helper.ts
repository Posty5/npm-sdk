import type { QrDotShape, QrEyeBallShape, QrEyeFrameShape } from '../enums';
import {
    QR_DESIGN_WIDTH_DEFAULT,
    QR_DESIGN_WIDTH_MAX,
    QR_DESIGN_WIDTH_MIN,
    QR_EC_LEVEL_BY_NUMBER,
    QR_EC_LEVEL_DEFAULT,
    QR_FILL_STOPS_MAX,
    QR_FRAME_TEXT_MAX_CHARS,
    QR_LOGO_DEFAULT_DIVISOR,
} from '../config/render-limits.config';
import { QrFrames } from '../data/frames.data';
import { QrDotShapes, QrEyeBallShapes, QrEyeFrameShapes } from '../data/shapes.data';
import type { IQrDesign, IQrDesignOptions, IQrFill, IQrFrameOptions } from '../interface';
import { isValidColor } from '../render/color.helper';

/** K1 fields whose presence makes a design v2. `logoSource` is metadata only (a re-hosted legacy logo stays v1). */
const V2_FIELDS: readonly (keyof IQrDesignOptions)[] = [
    'dotShape',
    'eyeFrameShape',
    'eyeBallShape',
    'fill',
    'backgroundTransparent',
    'frame',
    'logoExcavate',
];

const EASYQR_DEFAULT_DARK = '#000000';
const EASYQR_DEFAULT_LIGHT = '#ffffff';

const num = (value: unknown, fallback: number): number =>
    typeof value === 'number' && Number.isFinite(value) ? value : fallback;
const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const color = (value: unknown, fallback: string): string => (isValidColor(value) ? (value as string) : fallback);
const optionalColor = (value: unknown): string | undefined => (isValidColor(value) ? (value as string) : undefined);
const str = (value: unknown): string | undefined => (typeof value === 'string' && value.trim() !== '' ? value : undefined);
const oneOf = <T extends string>(value: unknown, list: readonly { id: T }[]): T =>
    list.some((s) => s.id === value) ? (value as T) : list[0].id;

/** True when the design uses the v2 engine: `designVersion === 2` or any K1 v2 field present. */
export const isV2Design = (options: IQrDesignOptions | null | undefined): boolean => {
    if (!options) return false;
    if (options.designVersion === 2) return true;
    if (options.designVersion === 1) return false;
    return V2_FIELDS.some((key) => options[key] !== undefined && options[key] !== null);
};

const normalizeFill = (fill: IQrFill | undefined, colorDark: string): IQrFill => {
    const stops = (fill?.stops ?? [])
        .filter((s) => s && isValidColor(s.color))
        .slice(0, QR_FILL_STOPS_MAX)
        .map((s) => ({ offset: clamp(num(s.offset, 0), 0, 1), color: s.color }))
        .sort((a, b) => a.offset - b.offset);
    if (!fill || stops.length < 2 || fill.type === 'solid') {
        return { type: 'solid', stops: [{ offset: 0, color: stops[0]?.color ?? colorDark }] };
    }
    const type = fill.type === 'radial' ? 'radial' : 'linear';
    return type === 'linear'
        ? { type, rotation: ((num(fill.rotation, 0) % 360) + 360) % 360, stops }
        : { type, stops };
};

const normalizeFrame = (frame: IQrFrameOptions | undefined): IQrFrameOptions | undefined => {
    if (!frame) return undefined;
    const def = QrFrames.find((f) => f.id === frame.id);
    if (!def) return undefined;
    const text = str(frame.text)?.slice(0, QR_FRAME_TEXT_MAX_CHARS);
    return {
        id: def.id,
        ...(text && def.hasText ? { text } : {}),
        color: color(frame.color, def.defaultColor),
        textColor: color(frame.textColor, def.defaultTextColor),
    };
};

/**
 * Reads stored options (legacy EasyQRCode names + K1 fields) into an `IQrDesign`:
 * resolves `logo || posty5Logo` (QD-D6), maps EC numbers (L=1 M=0 Q=3 H=2),
 * applies EasyQRCode defaults and clamps ranges. Never throws.
 */
export const normalizeDesign = (input: IQrDesignOptions | null | undefined): IQrDesign => {
    const o: IQrDesignOptions = input ?? {};
    const v2 = isV2Design(o);
    const width = clamp(num(o.width, QR_DESIGN_WIDTH_DEFAULT), QR_DESIGN_WIDTH_MIN, QR_DESIGN_WIDTH_MAX);
    const colorDark = color(o.colorDark, EASYQR_DEFAULT_DARK);
    const fill = normalizeFill(v2 ? o.fill : undefined, colorDark);
    const firstStop = fill.stops[0].color;
    const po = optionalColor(o.PO);
    const pi = optionalColor(o.PI);
    const eyeDefault = v2 ? firstStop : colorDark;
    const dotScale = clamp(num(o.dotScale, 1), 0, 1);
    const timingScale = num(o.dotScaleTiming, dotScale);
    const alignmentScale = num(o.dotScaleA, dotScale);
    const logo = str(o.logo) ?? str(o.posty5Logo);
    const defaultLogo = width / QR_LOGO_DEFAULT_DIVISOR;
    const frame = v2 ? normalizeFrame(o.frame) : undefined;

    return {
        designVersion: v2 ? 2 : 1,
        ecLevel: QR_EC_LEVEL_BY_NUMBER[num(o.correctLevel, -1)] ?? QR_EC_LEVEL_DEFAULT,
        width,
        quietZone: clamp(num(o.quietZone, 0), 0, width),
        quietZoneColor: optionalColor(o.quietZoneColor),
        colorDark,
        colorLight: color(o.colorLight, EASYQR_DEFAULT_LIGHT),
        backgroundTransparent: v2 && o.backgroundTransparent === true,
        fill,
        dotShape: v2 ? oneOf<QrDotShape>(o.dotShape, QrDotShapes) : 'square',
        eyeFrameShape: v2 ? oneOf<QrEyeFrameShape>(o.eyeFrameShape, QrEyeFrameShapes) : 'square',
        eyeBallShape: v2 ? oneOf<QrEyeBallShape>(o.eyeBallShape, QrEyeBallShapes) : 'square',
        dotScale,
        dotScaleTimingH: clamp(num(o.dotScaleTiming_H, timingScale), 0, 1),
        dotScaleTimingV: clamp(num(o.dotScaleTiming_V, timingScale), 0, 1),
        dotScaleAO: clamp(num(o.dotScaleAO, alignmentScale), 0, 1),
        dotScaleAI: clamp(num(o.dotScaleAI, alignmentScale), 0, 1),
        eyes: {
            outer: [o.PO_TL, o.PO_TR, o.PO_BL].map((c) => color(c, po ?? eyeDefault)) as [string, string, string],
            inner: [o.PI_TL, o.PI_TR, o.PI_BL].map((c) => color(c, pi ?? eyeDefault)) as [string, string, string],
        },
        alignmentOuter: optionalColor(o.AO),
        alignmentInner: optionalColor(o.AI),
        timingH: optionalColor(o.timing_H) ?? optionalColor(o.timing),
        timingV: optionalColor(o.timing_V) ?? optionalColor(o.timing),
        logo,
        logoWidth: clamp(num(o.logoWidth, defaultLogo), 0, width),
        logoHeight: clamp(num(o.logoHeight, defaultLogo), 0, width),
        logoBackgroundColor: optionalColor(o.logoBackgroundColor),
        logoBackgroundTransparent: o.logoBackgroundTransparent === true,
        logoExcavate: v2 ? o.logoExcavate !== false : false,
        frame,
        title: v2 ? undefined : str(o.title),
    };
};

/** True when the argument is already an `IQrDesign` (output of `normalizeDesign`). */
export const isNormalizedDesign = (value: IQrDesignOptions | IQrDesign): value is IQrDesign =>
    typeof (value as IQrDesign).eyes === 'object' && (value as IQrDesign).eyes !== null && 'ecLevel' in value;

/** Normalises unless already normalised. */
export const toDesign = (value: IQrDesignOptions | IQrDesign): IQrDesign =>
    isNormalizedDesign(value) ? value : normalizeDesign(value);
