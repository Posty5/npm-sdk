import { IQrExportOptions, IQrRenderOptions } from "../interfaces";
import { QrRenderDownloadFlagConst } from "../qr-code.config";

/**
 * The query string of `export-url`: only the options the caller set, so a
 * call with none asks for the API's defaults (plain PNG).
 */
export function toQrExportQuery(options?: IQrExportOptions): Record<string, string | number> {
  const query: Record<string, string | number> = {};
  if (!options) return query;
  const { format, presetId, customMm, dpi, sizePx } = options;
  if (format !== undefined) query.format = format;
  if (presetId !== undefined) query.presetId = presetId;
  if (customMm !== undefined) query.customMm = customMm;
  if (dpi !== undefined) query.dpi = dpi;
  if (sizePx !== undefined) query.sizePx = sizePx;
  return query;
}

/** The query string of `render`: the export options plus `download` when asked for. */
export function toQrRenderQuery(options?: IQrRenderOptions): Record<string, string | number> {
  const query = toQrExportQuery(options);
  if (options?.download) query.download = QrRenderDownloadFlagConst;
  return query;
}
