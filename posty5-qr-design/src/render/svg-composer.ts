import type { QrModuleRole } from '../enums';
import type { IQrBox, IQrDesign, IQrDesignOptions, IQrRenderOptions, IQrRenderResult } from '../interface';
import { encodeMatrix } from '../matrix/encoder.helper';
import { buildModuleRoles, FINDER_SIZE } from '../matrix/module-role.helper';
import { toDesign } from '../normalize/normalize.helper';
import { paintAttrs } from './color.helper';
import { fillDef, fillPaint } from './fill.helper';
import { layoutDesign } from './layout.helper';
import { resolveOutputSize } from './output-size.helper';
import { eyeBallPath, eyeFramePath, modulePath, rectPath } from './shapes.helper';
import { escapeXml, fmt, hashString } from './svg-number.helper';
import { textToOutline } from './text-outline.helper';

const LOGO_HREF = /^(data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,[A-Za-z0-9+/=]+|https:\/\/[^\s"'<>]+)$/;
/** EasyQRCode's default logo background. */
const LOGO_BACKGROUND_DEFAULT = '#ffffff';

/** Paint and scale of a non-finder module by role. */
const roleStyle = (design: IQrDesign, role: QrModuleRole, dataPaint: string): { paint: string; scale: number } => {
    switch (role) {
        case 'alignmentOuter':
            return { paint: design.alignmentOuter ? paintAttrs('fill', design.alignmentOuter) : dataPaint, scale: design.dotScaleAO };
        case 'alignmentInner':
            return { paint: design.alignmentInner ? paintAttrs('fill', design.alignmentInner) : dataPaint, scale: design.dotScaleAI };
        case 'timingH':
            return { paint: design.timingH ? paintAttrs('fill', design.timingH) : dataPaint, scale: design.dotScaleTimingH };
        case 'timingV':
            return { paint: design.timingV ? paintAttrs('fill', design.timingV) : dataPaint, scale: design.dotScaleTimingV };
        default:
            return { paint: dataPaint, scale: design.dotScale };
    }
};

/**
 * Renders a design to an SVG string. Pure and deterministic: the same design,
 * text and options give the same string in Node and in browsers (fixed precision,
 * hashed ids, outlined text, no fetch). The v2 engine draws any design it is given;
 * callers keep legacy (v1) designs on EasyQRCode (QD-D1).
 */
export const renderDesignSvg = (input: IQrDesignOptions | IQrDesign, text: string, opts: IQrRenderOptions = {}): IQrRenderResult => {
    const design = toDesign(input);
    const matrix = encodeMatrix(text, design.ecLevel);
    const { size } = matrix;
    const layout = layoutDesign(design);
    const out = resolveOutputSize(layout.canvasWidth, layout.canvasHeight, opts);
    const id = `p5q${hashString(`${JSON.stringify(design)}|${text}`)}`;
    const m = design.width / size;
    const box = layout.symbolBox;
    const symbol: IQrBox = { x: box.x + design.quietZone, y: box.y + design.quietZone, width: design.width, height: design.width };

    // Logo box and excavation (modules whose centre falls in the box + 1 module).
    const logoHref = opts.logoDataUri && LOGO_HREF.test(opts.logoDataUri) ? opts.logoDataUri : undefined;
    const lw = design.logoWidth;
    const lh = design.logoHeight;
    const logoBox: IQrBox = { x: symbol.x + (design.width - lw) / 2, y: symbol.y + (design.width - lh) / 2, width: lw, height: lh };
    const excavate = !!logoHref && design.logoExcavate && lw > 0 && lh > 0;
    const isExcavated = (row: number, col: number): boolean => {
        if (!excavate) return false;
        const cx = symbol.x + (col + 0.5) * m;
        const cy = symbol.y + (row + 0.5) * m;
        return cx > logoBox.x - m && cx < logoBox.x + lw + m && cy > logoBox.y - m && cy < logoBox.y + lh + m;
    };

    const roles = buildModuleRoles(matrix.version, size);
    const drawn = matrix.modules.map((line, row) =>
        line.map((dark, col) => dark && roles[row][col] !== 'finder' && !isExcavated(row, col)),
    );
    const isOn = (row: number, col: number): boolean => row >= 0 && col >= 0 && row < size && col < size && drawn[row][col];

    // Modules grouped by (paint, scale), in row-major first-appearance order.
    const dataPaint = fillPaint(design.fill, `${id}f`);
    const groups = new Map<string, { paint: string; d: string[] }>();
    const append = (key: string, paint: string, d: string): void => {
        const group = groups.get(key);
        if (group) group.d.push(d);
        else groups.set(key, { paint, d: [d] });
    };
    const styles = roles.map((line) => line.map((role) => roleStyle(design, role, dataPaint)));
    const styleKey = (row: number, col: number): string => `${styles[row][col].paint}|${styles[row][col].scale}`;
    for (let row = 0; row < size; row += 1) {
        for (let col = 0; col < size; col += 1) {
            if (!drawn[row][col]) continue;
            const { paint, scale } = styles[row][col];
            const key = styleKey(row, col);
            const x = symbol.x + col * m;
            const y = symbol.y + row * m;
            if (design.dotShape === 'square' && scale >= 1) {
                // Merge a horizontal run of same-style squares into one rect (no seams between them).
                let end = col;
                while (end + 1 < size && drawn[row][end + 1] && styleKey(row, end + 1) === key) end += 1;
                append(key, paint, rectPath(x, y, (end - col + 1) * m, m));
                col = end;
                continue;
            }
            append(key, paint, modulePath(design.dotShape, x, y, m, scale, {
                top: isOn(row - 1, col),
                right: isOn(row, col + 1),
                bottom: isOn(row + 1, col),
                left: isOn(row, col - 1),
            }));
        }
    }

    const parts: string[] = [];
    parts.push(layout.frameBack);
    if (!design.backgroundTransparent) {
        parts.push(`<path d="${rectPath(box.x, box.y, box.width, box.height)}"${paintAttrs('fill', design.quietZoneColor ?? design.colorLight)}/>`);
        if (design.quietZoneColor && design.quietZone > 0) {
            parts.push(`<path d="${rectPath(symbol.x, symbol.y, symbol.width, symbol.height)}"${paintAttrs('fill', design.colorLight)}/>`);
        }
    }
    for (const group of groups.values()) parts.push(`<path d="${group.d.join('')}"${group.paint}/>`);

    const eyeOrigins: [number, number][] = [[0, 0], [size - FINDER_SIZE, 0], [0, size - FINDER_SIZE]];
    eyeOrigins.forEach(([col, row], i) => {
        const x = symbol.x + col * m;
        const y = symbol.y + row * m;
        parts.push(`<path d="${eyeFramePath(design.eyeFrameShape, x, y, m, i)}" fill-rule="evenodd"${paintAttrs('fill', design.eyes.outer[i])}/>`);
        parts.push(`<path d="${eyeBallPath(design.eyeBallShape, x, y, m)}"${paintAttrs('fill', design.eyes.inner[i])}/>`);
    });

    if (logoHref && lw > 0 && lh > 0) {
        if (!design.logoBackgroundTransparent) {
            parts.push(`<path d="${rectPath(logoBox.x, logoBox.y, lw, lh)}"${paintAttrs('fill', design.logoBackgroundColor ?? LOGO_BACKGROUND_DEFAULT)}/>`);
        }
        parts.push(
            `<image href="${escapeXml(logoHref)}" x="${fmt(logoBox.x)}" y="${fmt(logoBox.y)}" width="${fmt(lw)}" height="${fmt(lh)}" preserveAspectRatio="xMidYMid meet"/>`,
        );
    }

    if (design.frame?.text && layout.textBox) {
        const outline = textToOutline(design.frame.text, layout.textBox);
        if (outline) parts.push(`<path d="${outline.path}"${paintAttrs('fill', layout.textColor ?? '#ffffff')}/>`);
    }

    const defs = fillDef(design.fill, `${id}f`, symbol);
    const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" width="${out.widthPx}" height="${out.heightPx}" ` +
        `viewBox="0 0 ${fmt(layout.canvasWidth)} ${fmt(layout.canvasHeight)}">` +
        (defs ? `<defs>${defs}</defs>` : '') +
        parts.join('') +
        '</svg>';

    return {
        svg,
        widthPx: out.widthPx,
        heightPx: out.heightPx,
        ...(out.widthMm !== undefined ? { widthMm: out.widthMm, heightMm: out.heightMm } : {}),
        symbol: {
            version: matrix.version,
            size,
            moduleSizePx: Math.round(m * out.pxPerUnit * 1000) / 1000,
            quietZoneModules: Math.round(((design.quietZone + layout.framePadding) / m) * 100) / 100,
        },
    };
};
