import { checkScannability } from '../src';
import type { IQrDesignOptions, QrScannabilityCode } from '../src';

const TEXT = 'https://posty5.com/q/abc';
const GOOD: IQrDesignOptions = { width: 300, correctLevel: 2, colorDark: '#000000', colorLight: '#ffffff', quietZone: 60 };

const statusOf = (options: IQrDesignOptions, code: QrScannabilityCode, opts = {}) =>
    checkScannability(options, TEXT, opts).checks.find((c) => c.code === code);

describe('checkScannability', () => {
    it('reports good for a plain black-on-white design with a quiet zone', () => {
        const report = checkScannability(GOOD, TEXT);
        expect(report.verdict).toBe('good');
        expect(report.symbol.ecLevel).toBe('H');
        expect(report.checks.every((c) => c.messageKey === `qrScannability.${c.code}.${c.status}`)).toBe(true);
    });

    it.each([
        ['#000000', 'good'],
        ['#767676', 'good'], // 4.54:1
        ['#949494', 'warning'], // ≈3.03:1
        ['#bbbbbb', 'poor'], // ≈1.92:1
    ])('contrast of %s on white is %s', (colorDark, status) => {
        expect(statusOf({ ...GOOD, colorDark }, 'contrast')?.status).toBe(status);
    });

    it('measures the worst eye or gradient colour, not just colorDark', () => {
        expect(statusOf({ ...GOOD, PO_TL: '#dddddd' }, 'contrast')?.status).toBe('poor');
        expect(
            statusOf({ ...GOOD, fill: { type: 'linear', stops: [{ offset: 0, color: '#000000' }, { offset: 1, color: '#cccccc' }] } }, 'contrast')?.status,
        ).toBe('poor');
    });

    it('flags inverted codes as a warning only', () => {
        const check = statusOf({ ...GOOD, colorDark: '#ffffff', colorLight: '#000000' }, 'inverted');
        expect(check?.status).toBe('warning');
    });

    it('notes the assumed white background when transparent', () => {
        const check = statusOf({ ...GOOD, colorDark: '#cccccc', backgroundTransparent: true }, 'contrast');
        expect(check?.message).toContain('transparent');
    });

    it.each([
        [2, 60, 'good'], // H, 4 %
        [2, 120, 'warning'], // H, 16 %
        [1, 60, 'warning'], // L, 4 %
        [1, 120, 'poor'], // L, 16 %
    ])('logo coverage at correctLevel %i with a %ipx logo is %s', (correctLevel, edge, status) => {
        expect(statusOf({ ...GOOD, correctLevel, logo: 'x', logoWidth: edge, logoHeight: edge }, 'logoCoverage')?.status).toBe(status);
    });

    it('reads posty5Logo when logo is empty (QD-D6)', () => {
        expect(statusOf({ ...GOOD, posty5Logo: 'https://cdn/x.png', logoWidth: 60, logoHeight: 60 }, 'logoCoverage')).toBeDefined();
    });

    it('flags a 1-module quiet zone as poor and counts frame padding', () => {
        const v = checkScannability(GOOD, TEXT).symbol;
        const oneModule = 300 / v.size;
        expect(statusOf({ ...GOOD, quietZone: oneModule }, 'quietZone')?.status).toBe('poor');
        const framed = statusOf({ ...GOOD, quietZone: oneModule, frame: { id: 'banner-bottom' } }, 'quietZone');
        expect(framed!.value).toBeGreaterThan(1);
    });

    it('measures module size in mm at a preset and in px otherwise', () => {
        const long = { ...GOOD, quietZone: 0 };
        const mm = checkScannability(long, 'x'.repeat(600), { presetId: 'business-card' });
        expect(mm.symbol.moduleSizeMm).toBeDefined();
        expect(mm.checks.find((c) => c.code === 'moduleSize')?.status).toBe('poor');
        expect(checkScannability(GOOD, TEXT, { sizePx: 2000 }).checks.find((c) => c.code === 'moduleSize')?.status).toBe('good');
    });

    it.each([
        [1, 'good'],
        [0.6, 'warning'],
        [0.4, 'poor'],
    ])('dotScale %d is %s', (dotScale, status) => {
        expect(statusOf({ ...GOOD, dotScale }, 'dotScale')?.status).toBe(status);
    });

    it('works on seeded legacy template colours', () => {
        const legacy = { width: 256, correctLevel: 0, dotScale: 0.75, colorDark: '#011138', colorLight: '#fff0cb', PO_TL: '#e1622f', PI_TL: '#aa5b71' };
        const report = checkScannability(legacy, TEXT);
        expect(['good', 'warning', 'poor']).toContain(report.verdict);
        expect(report.checks.find((c) => c.code === 'quietZone')?.status).toBe('poor');
    });
});
