import { QR_GLYPH_TABLE } from '../fonts/glyphs.data';
import type { IQrBox, IQrTextOutline } from '../interface';
import { hasArabic, shapeArabic, toVisualOrder } from '../text/arabic-shaping.helper';
import { fmt } from './svg-number.helper';

/** Font size as a share of the text box height, and the smallest it may shrink to. */
const FONT_SIZE_RATIO = 0.55;
const MIN_FONT_SIZE_RATIO = 0.32;
/** Baseline offset below the box centre, as a share of the font size (Latin cap height ≈ 0.714 em). */
const BASELINE_RATIO = 0.36;
const ELLIPSIS = '…';

const COMMAND = /([MLQCZ])([^MLQCZ]*)/g;

/** Glyph outline moved to (x, baseline) and scaled from font units. */
const placeGlyph = (data: string, x: number, baseline: number, scale: number): string => {
    let out = '';
    COMMAND.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = COMMAND.exec(data))) {
        const nums = match[2].trim() === '' ? [] : match[2].trim().split(/\s+/).map(Number);
        const pts = nums.map((v, i) => fmt(i % 2 === 0 ? x + v * scale : baseline + v * scale));
        out += match[1] + pts.join(' ');
    }
    return out;
};

/** Shaped, visually ordered code points of `text`. */
const visualCodePoints = (text: string): number[] => {
    const shaped = hasArabic(text) ? toVisualOrder(shapeArabic(text)) : text;
    return Array.from(shaped, (c) => c.codePointAt(0) as number);
};

/** Advance of a line in px at `fontSize`. Missing glyphs advance nothing. */
const measure = (cps: number[], fontSize: number): number =>
    cps.reduce((sum, cp) => {
        const g = QR_GLYPH_TABLE.glyphs[cp];
        return g ? sum + (g[1] * fontSize) / QR_GLYPH_TABLE.fonts[g[0]].unitsPerEm : sum;
    }, 0);

/**
 * Lays `text` out as outlines centred in `box`: shrinks to a minimum size, then
 * truncates with an ellipsis; never overflows. Glyphs come from the bundled table
 * (QD-D8), so output is the same in every runtime.
 */
export const textToOutline = (text: string, box: IQrBox): IQrTextOutline | null => {
    const clean = text.replace(/\s+/g, ' ').trim();
    if (!clean) return null;
    const maxSize = box.height * FONT_SIZE_RATIO;
    const minSize = box.height * MIN_FONT_SIZE_RATIO;
    let logical = clean;
    let cps = visualCodePoints(logical);
    let fontSize = Math.min(maxSize, (maxSize * box.width) / Math.max(measure(cps, maxSize), 1e-6));
    if (fontSize < minSize) {
        fontSize = minSize;
        const chars = Array.from(clean);
        while (chars.length > 1 && measure(cps, fontSize) > box.width) {
            chars.pop();
            logical = chars.join('').trimEnd() + ELLIPSIS;
            cps = visualCodePoints(logical);
        }
    }
    const width = measure(cps, fontSize);
    let x = box.x + (box.width - width) / 2;
    const baseline = box.y + box.height / 2 + fontSize * BASELINE_RATIO;
    let path = '';
    for (const cp of cps) {
        const g = QR_GLYPH_TABLE.glyphs[cp];
        if (!g) continue;
        const scale = fontSize / QR_GLYPH_TABLE.fonts[g[0]].unitsPerEm;
        if (g[2]) path += placeGlyph(g[2], x, baseline, scale);
        x += g[1] * scale;
    }
    return path ? { path, width, fontSize } : null;
};
