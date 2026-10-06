# @posty5/qr-design

The Posty5 QR design engine. It turns a QR design and a text into a **deterministic SVG string**, reports **scannability**, and ships the frame, call-to-action, print-preset and shape catalogues.

The same package runs in the Posty5 API, the dashboard and the web tool, so the preview you see is the image the server renders.

- Framework-free TypeScript, dual ESM/CJS, `sideEffects: false`.
- No DOM, no canvas, no network, no runtime dependencies (the QR encoder is bundled).
- Node ≥ 20, modern browsers, Angular 18 and SSR builds.

```bash
npm i @posty5/qr-design
```

## Usage

```ts
import { renderDesignSvg, checkScannability, isV2Design } from '@posty5/qr-design';

const options = {
    width: 300,
    correctLevel: 2, // EasyQRCode numbers: L=1, M=0, Q=3, H=2
    quietZone: 20,
    dotShape: 'rounded',
    eyeFrameShape: 'leaf',
    eyeBallShape: 'circle',
    fill: { type: 'linear', rotation: 45, stops: [{ offset: 0, color: '#3a0ca3' }, { offset: 1, color: '#7209b7' }] },
    frame: { id: 'banner-bottom', text: 'Scan for menu', color: '#7209b7' },
};

const { svg, widthPx, heightPx, symbol } = renderDesignSvg(options, 'https://posty5.com', { sizePx: 800 });
const print = renderDesignSvg(options, 'https://posty5.com', { presetId: 'flyer-5cm', dpi: 300 }); // widthMm: 50

const report = checkScannability(options, 'https://posty5.com', { presetId: 'business-card' });
// { verdict: 'good' | 'warning' | 'poor', checks: [...], symbol: {...} }
```

## Exports

| Export | What it does |
| --- | --- |
| `normalizeDesign(options)` | Stored options (legacy EasyQRCode names + v2 fields) → `IQrDesign`. Resolves `logo \|\| posty5Logo`, maps EC numbers, applies defaults, clamps `width` to 10–600. Never throws. |
| `isV2Design(options)` | `designVersion === 2`, or any of `dotShape`, `eyeFrameShape`, `eyeBallShape`, `fill`, `backgroundTransparent`, `frame`, `logoExcavate` present. `designVersion: 1` forces legacy. `logoSource` alone does **not** make a design v2. |
| `encodeMatrix(text, ecLevel)` | `{ version, size, ecLevel, modules }`. UTF-8, byte mode, smallest version. Empty text encodes `"\n"`. Throws `QrCapacityError` when the text does not fit. |
| `renderDesignSvg(design, text, opts)` | `{ svg, widthPx, heightPx, widthMm?, heightMm?, symbol }`. `opts`: `sizePx` **or** `presetId` (+ `customMm` for `custom`, `dpi` 150/300/600), and `logoDataUri`. |
| `checkScannability(design, text, opts)` | The K5 report, for legacy and v2 designs. Advice only; it never blocks anything. |
| `QrFrames`, `QrCtaPresets`, `QrPrintPresets`, `QrDotShapes`, `QrEyeFrameShapes`, `QrEyeBallShapes`, `QrScannabilityThresholds` | Static catalogues. |
| `QrCapacityError` | Thrown when the content is too long for the EC level (`code: 'QR_CAPACITY_EXCEEDED'`). Map it to HTTP 400. |

Legacy designs (v1) are read by this package (normalisation and scannability), but Posty5 keeps **rendering** them with EasyQRCode, so existing images never change. Call `renderDesignSvg` for v2 designs.

## The determinism promise

For the same design, text and options, `renderDesignSvg` returns the **same string** in Node and in every browser:

- every number is rounded to 3 decimals (`-0` is written `0`);
- gradient ids are a hash of the design and text, never random;
- frame text is drawn as **outlines** from bundled glyphs (Noto Sans Bold, Noto Sans Arabic Bold), never as `<text>`, so no renderer depends on installed fonts;
- the logo is only ever an `<image href>` of what the caller passes (`data:image/*;base64,…` or `https:`); the package never fetches.

Changing the output size changes only the `width`/`height` attributes. The `viewBox` is in design units.

## Catalogues

**Frames.** `title-strip`, `banner-bottom`, `banner-top`, `rounded-box`, `speech-bubble`, `ticket`, `circle-ring`. Frame text is at most 32 characters. When it is too long, it shrinks to a minimum size and is then cut with an ellipsis; it never overflows.

**CTA presets.** `scanMe`, `scanForMenu`, `scanToVisit`, `scanForWifi`, `scanToContact`, `scanToReview`. Each has `en`/`ar` text and the i18n key `qrDesign.cta.<id>`. Editors write the translated string into `frame.text`.

**Print presets** (artwork width, no bleed, sRGB). `sticker-3cm` 30 mm, `business-card` 25 mm, `flyer-5cm` 50 mm, `table-tent-8cm` 80 mm, `poster-15cm` 150 mm, and `custom` 20–500 mm. DPI is 150, 300 or 600 (default 300). The longest raster edge is capped at 6000 px.

**Shapes.**
- Dots: `square`, `rounded`, `dots`, `classy`, `extraRounded`.
- Eye frames: `square`, `rounded`, `circle`, `leaf`.
- Eye balls: `square`, `rounded`, `circle`, `diamond`.

## Scannability thresholds

| Code | Measures | warning / poor |
| --- | --- | --- |
| `contrast` | worst WCAG ratio of any foreground (fill stops, eye, alignment, timing colours) against the background | < 4.5 / < 3 |
| `inverted` | a foreground lighter than the background | warning only |
| `logoCoverage` | logo area ÷ symbol area, % (L / M / Q / H) | > 3 / 8 / 12 / 15 · > 5 / 12 / 18 / 22 |
| `quietZone` | quiet zone in modules; a frame's light padding counts | < 4 / < 2 |
| `moduleSize` | module edge in mm at a preset, else in px | < 0.5 mm or < 4 px / < 0.33 mm or < 2 px |
| `dotScale` | smallest dot scale | < 0.7 / < 0.5 |

Each check carries `messageKey` (`qrScannability.<code>.<status>`) and an English `message`. A transparent background is measured against white, and the message says so.

## Fonts

Glyph outlines are generated by `npm run build:glyphs` from `@fontsource/noto-sans` and `@fontsource/noto-sans-arabic`, which are licensed under the SIL Open Font License 1.1 (see `OFL.txt`). Arabic is shaped in-house to Unicode presentation forms (contextual forms, lam-alef) and ordered right to left. Combining marks (harakat) are dropped.

## License

MIT. The bundled glyph outlines are OFL-1.1.
