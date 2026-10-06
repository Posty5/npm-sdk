import type { IQrBox, IQrFill } from '../interface';
import { paintAttrs } from './color.helper';
import { fmt } from './svg-number.helper';

/**
 * `<linearGradient>` / `<radialGradient>` for the data modules, in user space over
 * `box` so the gradient spans the whole symbol (not each dot). Empty for solid.
 */
export const fillDef = (fill: IQrFill, id: string, box: IQrBox): string => {
    if (fill.type === 'solid') return '';
    const stops = fill.stops.map((s) => `<stop offset="${fmt(s.offset)}"${paintAttrs('stop-color', s.color)}/>`).join('');
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    if (fill.type === 'radial') {
        const r = (Math.SQRT2 * box.width) / 2;
        return `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${fmt(cx)}" cy="${fmt(cy)}" r="${fmt(r)}">${stops}</radialGradient>`;
    }
    const angle = ((fill.rotation ?? 0) * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const half = (box.width * (Math.abs(cos) + Math.abs(sin))) / 2;
    return (
        `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${fmt(cx - cos * half)}" y1="${fmt(cy - sin * half)}" ` +
        `x2="${fmt(cx + cos * half)}" y2="${fmt(cy + sin * half)}">${stops}</linearGradient>`
    );
};

/** Paint attributes for the data modules: a gradient reference or a solid colour. */
export const fillPaint = (fill: IQrFill, id: string): string =>
    fill.type === 'solid' ? paintAttrs('fill', fill.stops[0].color) : ` fill="url(#${id})"`;
