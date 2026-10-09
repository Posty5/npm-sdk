import type { IRgba } from '../interface';

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGB = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(\d*\.?\d+)\s*)?\)$/i;
const NAMED: Record<string, string> = {
    black: '#000000',
    white: '#ffffff',
    red: '#ff0000',
    green: '#008000',
    blue: '#0000ff',
    transparent: '#00000000',
};

const clampByte = (v: number): number => Math.max(0, Math.min(255, Math.round(v)));

/** Parses `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb()`, `rgba()` and a few names. Null when invalid. */
export const parseColor = (input: string | undefined | null): IRgba | null => {
    if (!input || typeof input !== 'string') return null;
    const value = (NAMED[input.trim().toLowerCase()] ?? input).trim();
    const hex = HEX.exec(value);
    if (hex) {
        let h = hex[1];
        if (h.length <= 4) h = h.split('').map((c) => c + c).join('');
        return {
            r: parseInt(h.slice(0, 2), 16),
            g: parseInt(h.slice(2, 4), 16),
            b: parseInt(h.slice(4, 6), 16),
            a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1,
        };
    }
    const rgb = RGB.exec(value);
    if (rgb) {
        const a = rgb[4] === undefined ? 1 : Math.max(0, Math.min(1, Number(rgb[4])));
        return { r: clampByte(+rgb[1]), g: clampByte(+rgb[2]), b: clampByte(+rgb[3]), a };
    }
    return null;
};

/** True when `input` is a colour the renderer accepts. */
export const isValidColor = (input: unknown): boolean => typeof input === 'string' && parseColor(input) !== null;

const hex2 = (v: number): string => clampByte(v).toString(16).padStart(2, '0');

/** `#rrggbb` for SVG attributes (alpha goes to a separate opacity attribute). */
export const toHex = (c: IRgba): string => `#${hex2(c.r)}${hex2(c.g)}${hex2(c.b)}`;

/**
 * SVG paint attributes for a colour: ` fill="#rrggbb"` plus ` fill-opacity` when
 * translucent. Invalid colours fall back to `fallback`.
 */
export const paintAttrs = (attr: 'fill' | 'stop-color' | 'stroke', color: string, fallback = '#000000'): string => {
    const c = parseColor(color) ?? parseColor(fallback) ?? { r: 0, g: 0, b: 0, a: 1 };
    const opacityAttr = attr === 'stop-color' ? 'stop-opacity' : `${attr}-opacity`;
    const alpha = Math.round(c.a * 1000) / 1000;
    return alpha < 1 ? ` ${attr}="${toHex(c)}" ${opacityAttr}="${alpha}"` : ` ${attr}="${toHex(c)}"`;
};

/** `fg` composited over an opaque `bg`. */
export const compositeOver = (fg: IRgba, bg: IRgba): IRgba => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
});
