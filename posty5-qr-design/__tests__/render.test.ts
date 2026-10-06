import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import {
    BinaryBitmap,
    DecodeHintType,
    HybridBinarizer,
    QRCodeReader,
    RGBLuminanceSource,
} from '@zxing/library';
import { renderDesignSvg, QrCapacityError } from '../src';
import { FIXTURE_TEXT, FIXTURES, renderFixture, sha256 } from './fixtures.helper';

const GOLDEN_FILE = path.join(__dirname, 'golden.json');

/**
 * Decodes a raster with ZXing. jsQR (the plan's first choice) misreads shrunk
 * dots and non-square eyes that ZXing and phone scanners read, so ZXing is the gate.
 */
const decode = async (svg: string): Promise<string | null> => {
    const { data, info } = await sharp(Buffer.from(svg)).flatten({ background: '#ffffff' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const lum = new Uint8ClampedArray(info.width * info.height);
    for (let i = 0; i < lum.length; i += 1) lum[i] = (data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114) | 0;
    try {
        const bitmap = new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(lum, info.width, info.height)));
        return new QRCodeReader().decode(bitmap, new Map([[DecodeHintType.TRY_HARDER, true]])).getText();
    } catch {
        return null;
    }
};

describe('renderDesignSvg', () => {
    const golden: Record<string, string> = fs.existsSync(GOLDEN_FILE) ? JSON.parse(fs.readFileSync(GOLDEN_FILE, 'utf8')) : {};
    const computed: Record<string, string> = {};

    afterAll(() => {
        // UPDATE_GOLDEN=1 rewrites the shared golden hashes (also checked by the jsdom suite).
        if (process.env.UPDATE_GOLDEN) fs.writeFileSync(GOLDEN_FILE, `${JSON.stringify(computed, null, 4)}\n`);
    });

    it.each(FIXTURES.map((f) => [f.name, f] as const))('%s is deterministic, matches golden and decodes', async (_name, fixture) => {
        const first = renderFixture(fixture);
        const second = renderFixture(fixture);
        expect(first.svg).toBe(second.svg);
        computed[fixture.name] = sha256(first.svg);
        if (!process.env.UPDATE_GOLDEN) expect(computed[fixture.name]).toBe(golden[fixture.name]);
        expect(await decode(first.svg)).toBe(FIXTURE_TEXT);
    });

    it('scales only width/height when the output size changes', () => {
        const a = renderFixture(FIXTURES[0], 400);
        const b = renderFixture(FIXTURES[0], 1200);
        expect(a.svg.replace(/width="\d+" height="\d+"/, '')).toBe(b.svg.replace(/width="\d+" height="\d+"/, ''));
        expect(b.widthPx).toBe(1200);
    });

    it('resolves a print preset to mm and DPI pixels', () => {
        const r = renderDesignSvg(FIXTURES[0].options, FIXTURE_TEXT, { presetId: 'flyer-5cm', dpi: 300 });
        expect(r.widthMm).toBe(50);
        expect(r.widthPx).toBe(Math.round((50 / 25.4) * 300));
    });

    it('caps the raster edge at 6000 px', () => {
        const r = renderDesignSvg(FIXTURES[0].options, FIXTURE_TEXT, { presetId: 'custom', customMm: 500, dpi: 600 });
        expect(Math.max(r.widthPx, r.heightPx)).toBeLessThanOrEqual(6000);
    });

    it('never emits ids or numbers that vary between runs', () => {
        const svg = renderFixture(FIXTURES.find((f) => f.name === 'linear-gradient')!).svg;
        expect(svg).toMatch(/id="p5q[0-9a-f]{8}f"/);
        expect(svg).not.toMatch(/\d\.\d{4,}/);
    });

    it('escapes nothing unsafe into the SVG and drops invalid logo hrefs', () => {
        const svg = renderDesignSvg({ ...FIXTURES[0].options, logo: 'x' }, FIXTURE_TEXT, { logoDataUri: 'javascript:alert(1)' }).svg;
        expect(svg).not.toContain('<image');
        expect(svg).not.toContain('javascript');
    });

    it('throws QrCapacityError when the text does not fit', () => {
        expect(() => renderDesignSvg({ correctLevel: 2 }, 'x'.repeat(4000))).toThrow(QrCapacityError);
    });

    it('renders a version-10 symbol with rounded dots and a frame in under 20 ms (median of warm runs)', () => {
        const fixture = FIXTURES.find((f) => f.name === 'frame-ticket')!;
        const text = 'x'.repeat(110); // 110 bytes at EC H → version 10
        expect(renderDesignSvg(fixture.options, text).symbol.version).toBe(10);
        for (let i = 0; i < 10; i += 1) renderDesignSvg(fixture.options, text); // JIT warm-up
        const times = Array.from({ length: 15 }, () => {
            const start = performance.now();
            renderDesignSvg(fixture.options, text);
            return performance.now() - start;
        }).sort((x, y) => x - y);
        expect(times[7]).toBeLessThan(20);
    });
});
