/**
 * Times renderDesignSvg in a plain Node process, for render.test.ts.
 *
 * Jest runs each suite inside a vm context, where this renderer is about 3.5×
 * slower than in Node or a browser: the same bundle took 5.7 ms here and 20 ms
 * in a vm context on the same laptop. A budget checked inside the suite
 * therefore measures the sandbox. This script loads ../src through
 * TypeScript's transpiler (no type check, no sandbox), so it times the code
 * the suite tests, as the dashboard and the API run it.
 *
 * stdin:  {"fixture": "<fixtures.json name>", "text": "...", "warmUps": 10, "runs": 15}
 * stdout: {"version": <QR version>, "times": [<ms per timed run>]}
 */
const fs = require('fs');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
    const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
        fileName: filename,
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    });
    module._compile(outputText, filename);
};

const { FIXTURES } = require('./fixtures.helper.ts');
const { renderDesignSvg } = require('../src');

const probe = JSON.parse(fs.readFileSync(0, 'utf8'));
const fixture = FIXTURES.find((f) => f.name === probe.fixture);
if (!fixture) throw new Error(`No fixture named ${probe.fixture}`);

const version = renderDesignSvg(fixture.options, probe.text).symbol.version;
for (let i = 0; i < probe.warmUps; i += 1) renderDesignSvg(fixture.options, probe.text); // JIT warm-up
const times = Array.from({ length: probe.runs }, () => {
    const start = performance.now();
    renderDesignSvg(fixture.options, probe.text);
    return performance.now() - start;
});

process.stdout.write(JSON.stringify({ version, times }));
