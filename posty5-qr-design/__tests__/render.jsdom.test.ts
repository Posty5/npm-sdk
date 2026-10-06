/**
 * @jest-environment jsdom
 */
import fs from 'fs';
import path from 'path';
import { FIXTURES, renderFixture, sha256 } from './fixtures.helper';

// Same fixtures as render.test.ts (Node): the browser-like runtime must produce
// the identical SVG string, compared through the shared golden hashes.
describe('renderDesignSvg in a browser-like runtime (jsdom)', () => {
    const golden: Record<string, string> = JSON.parse(fs.readFileSync(path.join(__dirname, 'golden.json'), 'utf8'));

    it('runs where `window` exists', () => {
        expect(typeof window).toBe('object');
    });

    it.each(FIXTURES.map((f) => [f.name, f] as const))('%s matches the Node golden hash', (_name, fixture) => {
        expect(sha256(renderFixture(fixture).svg)).toBe(golden[fixture.name]);
    });
});
