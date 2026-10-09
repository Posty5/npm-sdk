import { QrFrames } from '../data/frames.data';
import type { IQrDesign, IQrLayout } from '../interface';
import { buildFrameLayout, noFrameLayout } from './frame.helper';

/** Edge of the symbol box (symbol + quiet zone) in design units. */
export const symbolBoxEdge = (design: IQrDesign): number => design.width + 2 * design.quietZone;

/** Frame layout for a normalised design (no frame ⇒ canvas = symbol box). */
export const layoutDesign = (design: IQrDesign): IQrLayout => {
    const inner = symbolBoxEdge(design);
    if (!design.frame) return noFrameLayout(inner);
    const def = QrFrames.find((f) => f.id === design.frame?.id);
    return buildFrameLayout(design.frame.id, {
        inner,
        color: design.frame.color ?? def?.defaultColor ?? '#000000',
        textColor: design.frame.textColor ?? def?.defaultTextColor ?? '#ffffff',
        background: design.backgroundTransparent ? 'none' : design.colorLight,
        hasText: !!design.frame.text,
    });
};
