import { AuthorizationError } from "@posty5/core";
import type { IQrExportUrl } from "@posty5/qr-code";
import { presetWidthMm } from "@posty5/qr-design";
import { MM_PER_INCH, MS_PER_MINUTE } from "../config/limits.config";
import { QR_CUSTOM_PRESET, QR_PDF_DEFAULT_PRESET, QR_PRINT_DPI_FALLBACK } from "../config/qr-codes-enums.config";
import type { IQrPrintSizeArgs, IQrRenderToolArgs, IQrRenderToolResult } from "../interfaces/qr-codes.interface";
import { ToolInputError } from "./tool-input.error";

/**
 * Refuses print-size arguments that do not go together, before any request:
 * `dpi` needs a `presetId` and a PNG; `customMm` belongs to the `custom` preset,
 * which needs it.
 */
export function checkQrPrintSize(args: IQrPrintSizeArgs): void {
  if (args.dpi !== undefined && args.presetId === undefined) {
    throw new ToolInputError("dpi needs a presetId: it is the PNG's resolution at that print size.");
  }
  if (args.dpi !== undefined && args.format !== undefined && args.format !== "png") {
    throw new ToolInputError(`dpi applies to PNG only; ${args.format.toUpperCase()} is resolution-independent — leave dpi out.`);
  }
  if (args.presetId === QR_CUSTOM_PRESET && args.customMm === undefined) {
    throw new ToolInputError(`presetId "${QR_CUSTOM_PRESET}" needs customMm, the printed width in mm.`);
  }
  if (args.customMm !== undefined && args.presetId !== QR_CUSTOM_PRESET) {
    throw new ToolInputError(`customMm is only used with presetId "${QR_CUSTOM_PRESET}".`);
  }
}

/** True when the request needs the vector-export plan feature (anything but a plain PNG). */
function needsVectorExport(args: IQrRenderToolArgs): boolean {
  return args.format !== "png" || args.presetId !== undefined || args.dpi !== undefined;
}

/**
 * Runs `mint`; a plan refusal of a vector or print request comes back with the
 * API's message plus the hint that a plain PNG is on every plan.
 */
export async function withPngFallbackHint<T>(args: IQrRenderToolArgs, mint: () => Promise<T>): Promise<T> {
  try {
    return await mint();
  } catch (error) {
    if (error instanceof AuthorizationError && needsVectorExport(args)) {
      throw new AuthorizationError(`${error.message} A plain PNG (format "png", no presetId or dpi) is available on every plan.`, error.details);
    }
    throw error;
  }
}

/** The tool's answer: the link, how long it lasts, and the size it prints at. */
export function toQrRenderResult(link: IQrExportUrl, args: IQrRenderToolArgs, now: number = Date.now()): IQrRenderToolResult {
  const presetId = args.presetId ?? (args.format === "pdf" ? QR_PDF_DEFAULT_PRESET : undefined);
  const sizeMm = presetWidthMm(presetId, args.customMm);
  const expiresInMinutes = Math.max(0, Math.floor((Date.parse(link.expiresAt) - now) / MS_PER_MINUTE));
  return {
    url: link.url,
    expiresAt: link.expiresAt,
    expiresInMinutes,
    format: args.format,
    ...(presetId ? { presetId } : {}),
    ...(sizeMm !== undefined ? { sizeMm } : {}),
    ...(sizeMm !== undefined && args.format === "png" ? { sizePx: Math.round((sizeMm / MM_PER_INCH) * (args.dpi ?? QR_PRINT_DPI_FALLBACK)) } : {}),
  };
}
