# Changelog

## 4.7.1

- Fix: `quietZoneColor` painted the whole symbol when `quietZone` was 0, so a
  v2 design with a dark quiet-zone colour and no margin rendered as a solid
  square. It now paints the margin only (EasyQRCode's rule); with no margin the
  background is `colorLight`.

## 4.7.0

First release (feature `qr-design-and-export`, contract K2). No dependency on
`@posty5/core`.

### Added

- `renderDesignSvg`: deterministic v2 SVG composer.
  - Dot shapes, eye frame and eye ball shapes, linear and radial gradients.
  - Per-eye, alignment and timing colours; quiet zone; logo with excavation.
  - Seven frames with call-to-action text drawn as outlines (Latin and Arabic).
  - Print presets with DPI, and a 6000 px raster cap.
- `checkScannability`: K5 report with contrast, inversion, logo coverage, quiet zone, module size and dot scale checks.
- `normalizeDesign`, `isV2Design`, `encodeMatrix`, `QrCapacityError`.
- Catalogues: `QrFrames`, `QrCtaPresets`, `QrPrintPresets`, `QrDotShapes`, `QrEyeFrameShapes`, `QrEyeBallShapes`, `QrScannabilityThresholds`.
