import type { QrEcLevel } from '../enums';

/** Stored `width` is clamped to this range (the editor slider's range). */
export const QR_DESIGN_WIDTH_MIN = 10;
export const QR_DESIGN_WIDTH_MAX = 600;
/** EasyQRCode's default `width`. */
export const QR_DESIGN_WIDTH_DEFAULT = 256;

/** Largest raster edge any render may produce (K3). */
export const QR_MAX_RASTER_EDGE_PX = 6000;
export const QR_MIN_RENDER_PX = 16;

/** DPI values accepted for print presets (K3) and the default. */
export const QR_PRINT_DPI_VALUES = [150, 300, 600] as const;
export const QR_PRINT_DPI_DEFAULT = 300;
export const MM_PER_INCH = 25.4;

/** Frame CTA text, chars (K1). */
export const QR_FRAME_TEXT_MAX_CHARS = 32;

/** Gradient stops allowed (K1). */
export const QR_FILL_STOPS_MIN = 2;
export const QR_FILL_STOPS_MAX = 3;

/** Every number written into SVG is rounded to this many decimals (determinism). */
export const QR_SVG_PRECISION = 3;

/** EasyQRCode `correctLevel` numbers → EC level. */
export const QR_EC_LEVEL_BY_NUMBER: Record<number, QrEcLevel> = { 1: 'L', 0: 'M', 3: 'Q', 2: 'H' };
/** EasyQRCode's default `correctLevel` (H). */
export const QR_EC_LEVEL_DEFAULT: QrEcLevel = 'H';

/** EasyQRCode's default logo edge is `width / 3.5`. */
export const QR_LOGO_DEFAULT_DIVISOR = 3.5;

/** Text encoded when the caller passes none (the dashboard preview does the same). */
export const QR_EMPTY_TEXT_PLACEHOLDER = '\n';
