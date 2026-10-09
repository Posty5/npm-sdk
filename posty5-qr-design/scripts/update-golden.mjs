/**
 * Rewrites __tests__/golden.json from the built package (run `npm run build` first).
 * Same hashes as `UPDATE_GOLDEN=1` on render.test.ts, without running the suite.
 */
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { renderDesignSvg } = require('../dist/index.js');
const file = JSON.parse(fs.readFileSync(new URL('../__tests__/fixtures.json', import.meta.url), 'utf8'));
const helper = fs.readFileSync(new URL('../__tests__/fixtures.helper.ts', import.meta.url), 'utf8');
const logo = /'(data:image\/png;base64,[^']+)'/.exec(helper)[1];

const golden = {};
for (const f of file.fixtures) {
    const svg = renderDesignSvg({ ...file.base, ...f.options }, file.text, { sizePx: 800, logoDataUri: f.logo ? logo : undefined }).svg;
    golden[f.name] = createHash('sha256').update(svg).digest('hex');
}
fs.writeFileSync(new URL('../__tests__/golden.json', import.meta.url), `${JSON.stringify(golden, null, 4)}\n`);
console.log(`golden: ${Object.keys(golden).length} fixtures`);
