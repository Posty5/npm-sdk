import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    minify: false,
    treeshake: true,
    target: 'es2020',
    // Bundle @posty5/core into this package so consumers that install via
    // `file:` get HttpClient + uploadToR2 inline (re-exported from src/index.ts).
    noExternal: ['@posty5/core'],
});
