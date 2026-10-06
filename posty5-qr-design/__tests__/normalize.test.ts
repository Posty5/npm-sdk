import { encodeMatrix, isV2Design, normalizeDesign } from '../src';
import { shapeArabic, toVisualOrder } from '../src/text/arabic-shaping.helper';

describe('normalizeDesign', () => {
    it.each([
        [1, 'L'],
        [0, 'M'],
        [3, 'Q'],
        [2, 'H'],
        [undefined, 'H'],
    ])('maps correctLevel %s to %s', (correctLevel, ec) => {
        expect(normalizeDesign({ correctLevel }).ecLevel).toBe(ec);
    });

    it('falls back to posty5Logo when logo is empty (QD-D6)', () => {
        expect(normalizeDesign({ logo: '', posty5Logo: 'https://cdn.posty5.com/assets/logos/a.png' }).logo).toBe(
            'https://cdn.posty5.com/assets/logos/a.png',
        );
        expect(normalizeDesign({ logo: 'own.png', posty5Logo: 'lib.png' }).logo).toBe('own.png');
    });

    it('clamps width to 10–600 and defaults the logo to width / 3.5', () => {
        expect(normalizeDesign({ width: 5000 }).width).toBe(600);
        expect(normalizeDesign({ width: 1 }).width).toBe(10);
        expect(normalizeDesign({ width: 350 }).logoWidth).toBe(100);
    });

    it('ignores v2 fields on a legacy design and keeps the title', () => {
        const d = normalizeDesign({ designVersion: 1, dotShape: 'dots', title: 'Hi' });
        expect(d.designVersion).toBe(1);
        expect(d.dotShape).toBe('square');
        expect(d.title).toBe('Hi');
    });

    it('treats a one-stop gradient as solid and keeps at most three stops', () => {
        expect(normalizeDesign({ fill: { type: 'linear', stops: [{ offset: 0, color: '#123456' }] } }).fill.type).toBe('solid');
        const stops = Array.from({ length: 5 }, (_, i) => ({ offset: i / 4, color: '#000000' }));
        expect(normalizeDesign({ fill: { type: 'radial', stops } }).fill.stops).toHaveLength(3);
    });

    it('drops unknown frames and truncates frame text to 32 chars', () => {
        expect(normalizeDesign({ frame: { id: 'nope' as never } }).frame).toBeUndefined();
        expect(normalizeDesign({ frame: { id: 'ticket', text: 'x'.repeat(50) } }).frame?.text).toHaveLength(32);
    });

    it('eye colours fall back to PO/PI, then the fill’s first stop (v2) or colorDark (v1)', () => {
        expect(normalizeDesign({ colorDark: '#111111', PO: '#222222' }).eyes.outer).toEqual(['#222222', '#222222', '#222222']);
        const v2 = normalizeDesign({ colorDark: '#111111', fill: { type: 'linear', stops: [{ offset: 0, color: '#abcdef' }, { offset: 1, color: '#000000' }] } });
        expect(v2.eyes.inner[0]).toBe('#abcdef');
    });
});

describe('isV2Design', () => {
    it('is false for legacy options and logoSource alone (a re-hosted legacy logo stays v1)', () => {
        expect(isV2Design({ colorDark: '#000', logoSource: 'url' })).toBe(false);
        expect(isV2Design(null)).toBe(false);
    });

    it('is true for designVersion 2 or any v2 field, unless designVersion is 1', () => {
        expect(isV2Design({ designVersion: 2 })).toBe(true);
        expect(isV2Design({ dotShape: 'dots' })).toBe(true);
        expect(isV2Design({ designVersion: 1, frame: { id: 'ticket' } })).toBe(false);
    });
});

describe('encodeMatrix', () => {
    it('encodes empty text as a newline like the dashboard preview', () => {
        expect(encodeMatrix('', 'M').size).toBe(21);
    });

    it('returns version, size and a square module grid', () => {
        const m = encodeMatrix('https://posty5.com', 'H');
        expect(m.size).toBe(17 + 4 * m.version);
        expect(m.modules).toHaveLength(m.size);
        expect(m.modules[0][0]).toBe(true);
    });
});

describe('Arabic shaping', () => {
    it('picks contextual forms and the lam-alef ligature', () => {
        // سلام → seen initial, lam-alef final ligature, meem isolated
        expect(Array.from(shapeArabic('سلام'), (c) => c.codePointAt(0)!.toString(16))).toEqual(['feb3', 'fefc', 'fee1']);
    });

    it('reverses Arabic runs and keeps Latin/digit runs in order', () => {
        const visual = toVisualOrder(shapeArabic('امسح QR 24'));
        expect(visual.startsWith('QR 24')).toBe(true);
    });
});
