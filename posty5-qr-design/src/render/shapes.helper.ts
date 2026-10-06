import type { QrDotShape, QrEyeBallShape, QrEyeFrameShape } from '../enums';
import { fmt } from './svg-number.helper';

/** Corner radii as a share of the dot edge, per shape. */
const ROUNDED_RADIUS = 0.3;
const EXTRA_ROUNDED_RADIUS = 0.5;
const CLASSY_RADIUS = 0.5;

/** Which orthogonal neighbours of a module are drawn dark in the same group. */
export interface INeighbours {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
}

/** Rectangle with per-corner radii [tl, tr, br, bl], as an absolute path. */
export const roundedRectPath = (x: number, y: number, w: number, h: number, radii: [number, number, number, number]): string => {
    const max = Math.min(w, h) / 2;
    const [tl, tr, br, bl] = radii.map((r) => Math.max(0, Math.min(r, max)));
    const arc = (r: number, ex: number, ey: number): string => (r > 0 ? `A${fmt(r)} ${fmt(r)} 0 0 1 ${fmt(ex)} ${fmt(ey)}` : `L${fmt(ex)} ${fmt(ey)}`);
    return (
        `M${fmt(x + tl)} ${fmt(y)}` +
        `H${fmt(x + w - tr)}${arc(tr, x + w, y + tr)}` +
        `V${fmt(y + h - br)}${arc(br, x + w - br, y + h)}` +
        `H${fmt(x + bl)}${arc(bl, x, y + h - bl)}` +
        `V${fmt(y + tl)}${arc(tl, x + tl, y)}Z`
    );
};

/**
 * Full circle as four quarter arcs. Two half arcs degenerate in some renderers
 * (librsvg) once endpoints are rounded, drawing a bar instead of a dot.
 */
export const circlePath = (cx: number, cy: number, r: number): string => {
    const a = `A${fmt(r)} ${fmt(r)} 0 0 1 `;
    return (
        `M${fmt(cx - r)} ${fmt(cy)}${a}${fmt(cx)} ${fmt(cy - r)}${a}${fmt(cx + r)} ${fmt(cy)}` +
        `${a}${fmt(cx)} ${fmt(cy + r)}${a}${fmt(cx - r)} ${fmt(cy)}Z`
    );
};

/** Plain rectangle as a path. */
export const rectPath = (x: number, y: number, w: number, h: number): string =>
    `M${fmt(x)} ${fmt(y)}H${fmt(x + w)}V${fmt(y + h)}H${fmt(x)}Z`;

/**
 * One data module. Corners are rounded only where no neighbour touches them
 * (neighbour-aware) when the dot fills its cell; shrunk dots are isolated.
 */
export const modulePath = (shape: QrDotShape, x: number, y: number, cell: number, scale: number, n: INeighbours): string => {
    const d = cell * scale;
    const o = (cell - d) / 2;
    const px = x + o;
    const py = y + o;
    const touching = scale >= 1;
    const tlFree = !touching || (!n.top && !n.left);
    const trFree = !touching || (!n.top && !n.right);
    const brFree = !touching || (!n.bottom && !n.right);
    const blFree = !touching || (!n.bottom && !n.left);
    switch (shape) {
        case 'dots':
            return circlePath(px + d / 2, py + d / 2, d / 2);
        case 'rounded':
        case 'extraRounded': {
            const r = d * (shape === 'rounded' ? ROUNDED_RADIUS : EXTRA_ROUNDED_RADIUS);
            return roundedRectPath(px, py, d, d, [tlFree ? r : 0, trFree ? r : 0, brFree ? r : 0, blFree ? r : 0]);
        }
        case 'classy': {
            const r = d * CLASSY_RADIUS;
            return roundedRectPath(px, py, d, d, [tlFree ? r : 0, 0, brFree ? r : 0, 0]);
        }
        default:
            return rectPath(px, py, d, d);
    }
};

/** Eye index → leaf corner pattern [tl, tr, br, bl] (1 = rounded). The sharp corners face the symbol's centre axis. */
const LEAF_PATTERN: readonly (readonly [number, number, number, number])[] = [
    [1, 0, 1, 0],
    [0, 1, 0, 1],
    [0, 1, 0, 1],
];

/** Outer 7×7 ring of a position pattern at (x, y), module edge `m`; drawn with fill-rule evenodd. */
export const eyeFramePath = (shape: QrEyeFrameShape, x: number, y: number, m: number, eyeIndex: number): string => {
    const outer = 7 * m;
    const inner = 5 * m;
    switch (shape) {
        case 'circle':
            return circlePath(x + outer / 2, y + outer / 2, outer / 2) + circlePath(x + outer / 2, y + outer / 2, inner / 2);
        case 'rounded':
            return roundedRectPath(x, y, outer, outer, [1.75 * m, 1.75 * m, 1.75 * m, 1.75 * m]) +
                roundedRectPath(x + m, y + m, inner, inner, [m, m, m, m]);
        case 'leaf': {
            const p = LEAF_PATTERN[eyeIndex];
            const ro = 2.5 * m;
            const ri = 1.5 * m;
            return roundedRectPath(x, y, outer, outer, p.map((c) => c * ro) as [number, number, number, number]) +
                roundedRectPath(x + m, y + m, inner, inner, p.map((c) => c * ri) as [number, number, number, number]);
        }
        default:
            return rectPath(x, y, outer, outer) + rectPath(x + m, y + m, inner, inner);
    }
};

/** Centre 3×3 of a position pattern whose ring starts at (x, y). */
export const eyeBallPath = (shape: QrEyeBallShape, x: number, y: number, m: number): string => {
    const bx = x + 2 * m;
    const by = y + 2 * m;
    const s = 3 * m;
    switch (shape) {
        case 'circle':
            return circlePath(bx + s / 2, by + s / 2, s / 2);
        case 'rounded':
            return roundedRectPath(bx, by, s, s, [0.75 * m, 0.75 * m, 0.75 * m, 0.75 * m]);
        case 'diamond': {
            const cx = bx + s / 2;
            const cy = by + s / 2;
            return `M${fmt(cx)} ${fmt(by)}L${fmt(bx + s)} ${fmt(cy)}L${fmt(cx)} ${fmt(by + s)}L${fmt(bx)} ${fmt(cy)}Z`;
        }
        default:
            return rectPath(bx, by, s, s);
    }
};
