import { QR_SVG_PRECISION } from '../config/render-limits.config';

const FACTOR = 10 ** QR_SVG_PRECISION;

/**
 * Formats a number for SVG: fixed precision, no trailing zeros, never `-0`.
 * Every coordinate goes through here so Node and browsers emit the same string.
 */
export const fmt = (value: number): string => {
    const rounded = Math.round(value * FACTOR) / FACTOR;
    if (rounded === 0 || Object.is(rounded, -0)) return '0';
    return String(rounded);
};

/** Escapes text for an XML attribute or text node. */
export const escapeXml = (value: string): string =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

/** FNV-1a 32-bit hash as 8 hex chars; stable ids for SVG defs. */
export const hashString = (value: string): string => {
    let hash = 0x811c9dc5;
    for (let i = 0; i < value.length; i += 1) {
        hash ^= value.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash.toString(16).padStart(8, '0');
};
