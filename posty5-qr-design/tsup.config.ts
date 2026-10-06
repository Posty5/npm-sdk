import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    target: 'es2020',
    // The encoder is bundled so consumers (Angular, SSR, Node) import pure ESM/CJS
    // with no runtime dependency and no CommonJS-interop warning.
    noExternal: ['qrcode-generator'],
});
