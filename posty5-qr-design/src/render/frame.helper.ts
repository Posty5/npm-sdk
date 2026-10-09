import { QR_FRAME_GEOMETRY as G } from '../config/frame-geometry.config';
import type { QrFrameId } from '../enums';
import type { IQrFrameBuildInput, IQrLayout } from '../interface';
import { paintAttrs } from './color.helper';
import { circlePath, rectPath, roundedRectPath } from './shapes.helper';
import { fmt } from './svg-number.helper';

/** A filled path element; `background === 'none'` draws nothing. */
const filled = (d: string, color: string, evenOdd = false): string =>
    color === 'none' ? '' : `<path d="${d}"${paintAttrs('fill', color)}${evenOdd ? ' fill-rule="evenodd"' : ''}/>`;

const radii = (r: number): [number, number, number, number] => [r, r, r, r];

/** Box frame with a coloured banner below or above (`banner-bottom`, `banner-top`, `ticket`). */
const bannerFrame = (input: IQrFrameBuildInput, position: 'top' | 'bottom', notched: boolean): IQrLayout => {
    const I = input.inner;
    const p = I * G.padding;
    const t = I * G.border;
    const band = input.hasText ? I * G.textArea : t;
    const W = I + 2 * (p + t);
    const H = W - t + band;
    const innerY = position === 'top' ? band : t;
    const r = I * G.radius;
    const divider = position === 'top' ? band : t + I + 2 * p;
    let outer: string;
    if (notched) {
        const n = I * G.notch;
        outer =
            `M0 0H${fmt(W)}V${fmt(divider - n)}A${fmt(n)} ${fmt(n)} 0 0 0 ${fmt(W)} ${fmt(divider + n)}` +
            `V${fmt(H)}H0V${fmt(divider + n)}A${fmt(n)} ${fmt(n)} 0 0 0 0 ${fmt(divider - n)}Z`;
    } else {
        outer = roundedRectPath(0, 0, W, H, radii(r));
    }
    const innerSize = I + 2 * p;
    return {
        canvasWidth: W,
        canvasHeight: H,
        symbolBox: { x: t + p, y: innerY + p, width: I, height: I },
        framePadding: p,
        textBox: input.hasText
            ? { x: t + I * G.textInset, y: position === 'top' ? 0 : t + innerSize, width: W - 2 * (t + I * G.textInset), height: band - (position === 'top' ? 0 : t) }
            : undefined,
        textColor: input.textColor,
        frameBack: filled(outer, input.color) + filled(roundedRectPath(t, innerY, innerSize, innerSize, radii(r * 0.6)), input.background),
    };
};

/** Bordered rounded box; CTA below it, either plain text or in a speech bubble. */
const boxFrame = (input: IQrFrameBuildInput, bubble: boolean): IQrLayout => {
    const I = input.inner;
    const p = I * G.padding;
    const t = I * G.border;
    const W = I + 2 * (p + t);
    const r = I * G.radius;
    const ring = roundedRectPath(0, 0, W, W, radii(r)) + roundedRectPath(t, t, W - 2 * t, W - 2 * t, radii(r * 0.6));
    let back = filled(roundedRectPath(t, t, W - 2 * t, W - 2 * t, radii(r * 0.6)), input.background) + filled(ring, input.color, true);
    let H = W;
    let textBox;
    if (input.hasText) {
        const band = I * G.textArea;
        if (bubble) {
            const gap = I * G.bubbleGap;
            const ph = I * G.pointer;
            const top = W + gap + ph;
            const cx = W / 2;
            back += filled(`M${fmt(cx - ph)} ${fmt(top + 0.5)}L${fmt(cx)} ${fmt(W + gap)}L${fmt(cx + ph)} ${fmt(top + 0.5)}Z`, input.color);
            back += filled(roundedRectPath(0, top, W, band, radii(r)), input.color);
            textBox = { x: I * G.textInset, y: top, width: W - 2 * I * G.textInset, height: band };
            H = top + band;
        } else {
            back = filled(rectPath(0, W, W, band), input.background) + back;
            textBox = { x: I * G.textInset, y: W, width: W - 2 * I * G.textInset, height: band };
            H = W + band;
        }
    }
    return {
        canvasWidth: W,
        canvasHeight: H,
        symbolBox: { x: t + p, y: t + p, width: I, height: I },
        framePadding: p,
        textBox,
        textColor: input.textColor,
        frameBack: back,
    };
};

/** Circle around the symbol; CTA in a pill on the ring's bottom. */
const ringFrame = (input: IQrFrameBuildInput): IQrLayout => {
    const I = input.inner;
    const p = I * G.padding;
    const ring = I * G.ring;
    const rIn = (Math.SQRT2 * I) / 2 + p / 2;
    const R = rIn + ring;
    const c = R;
    let back = filled(circlePath(c, c, rIn), input.background) + filled(circlePath(c, c, R) + circlePath(c, c, rIn), input.color, true);
    let textBox;
    if (input.hasText) {
        const pw = I * G.pillWidth;
        const ph = I * G.pillHeight;
        const py = c + rIn + ring / 2 - ph / 2;
        back += filled(roundedRectPath(c - pw / 2, py, pw, ph, radii(ph / 2)), input.color);
        textBox = { x: c - pw / 2 + ph / 2, y: py, width: pw - ph, height: ph };
    }
    return {
        canvasWidth: 2 * R,
        canvasHeight: 2 * R,
        symbolBox: { x: c - I / 2, y: c - I / 2, width: I, height: I },
        framePadding: p / 2,
        textBox,
        textColor: input.textColor,
        frameBack: back,
    };
};

/** Legacy title strip above the symbol, as a v2 frame. */
const titleStripFrame = (input: IQrFrameBuildInput): IQrLayout => {
    const I = input.inner;
    const strip = I * G.titleStrip;
    return {
        canvasWidth: I,
        canvasHeight: I + strip,
        symbolBox: { x: 0, y: strip, width: I, height: I },
        framePadding: 0,
        textBox: input.hasText ? { x: I * G.textInset, y: 0, width: I * (1 - 2 * G.textInset), height: strip } : undefined,
        textColor: input.textColor,
        frameBack: filled(rectPath(0, 0, I, strip), input.color),
    };
};

/** Layout without a frame: the canvas is the symbol box. */
export const noFrameLayout = (inner: number): IQrLayout => ({
    canvasWidth: inner,
    canvasHeight: inner,
    symbolBox: { x: 0, y: 0, width: inner, height: inner },
    framePadding: 0,
    frameBack: '',
});

/** Canvas, symbol placement, text box and back elements for a catalogue frame. */
export const buildFrameLayout = (id: QrFrameId, input: IQrFrameBuildInput): IQrLayout => {
    switch (id) {
        case 'title-strip':
            return titleStripFrame(input);
        case 'banner-top':
            return bannerFrame(input, 'top', false);
        case 'ticket':
            return bannerFrame(input, 'bottom', true);
        case 'rounded-box':
            return boxFrame(input, false);
        case 'speech-bubble':
            return boxFrame(input, true);
        case 'circle-ring':
            return ringFrame(input);
        default:
            return bannerFrame(input, 'bottom', false);
    }
};
