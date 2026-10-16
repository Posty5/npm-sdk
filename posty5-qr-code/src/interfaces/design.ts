import type {
  IQrDesignOptions,
  IQrScannabilityCheck,
  IQrScannabilityReport,
  QrPrintPresetId,
  QrScannabilityCode,
} from "@posty5/qr-design";
import type { IQRCodeTemplate } from "./responses";

// The design types are declared once in @posty5/qr-design (the engine the API
// renders with) and re-exported here, so the SDK and the engine cannot drift.
export type {
  IQrDesignOptions,
  IQrFill,
  IQrFillStop,
  IQrFrameOptions,
  IQrScannabilityThreshold,
  IQrScannabilitySymbol,
  QrDotShape,
  QrEyeFrameShape,
  QrEyeBallShape,
  QrFillType,
  QrEcLevel,
  QrFrameId,
  QrCtaPresetId,
  QrPrintPresetId,
  QrScannabilityStatus,
} from "@posty5/qr-design";

/** File format of a rendered QR image. */
export type QrRenderFormat = "png" | "svg" | "pdf";

/** PNG resolution at a print preset. */
export type QrRenderDpi = 150 | 300 | 600;

/**
 * Options of `render` / `getExportUrl`. Plain PNG is on every plan; SVG, PDF,
 * a print preset, a DPI or a PNG wider than 2048 px need a plan with vector
 * export.
 */
export interface IQrExportOptions {
  /** `png` by default. */
  format?: QrRenderFormat;
  /** Print size; `pdf` defaults to `flyer-5cm`. */
  presetId?: QrPrintPresetId;
  /** Width in mm for `presetId: "custom"` (20–500). */
  customMm?: number;
  /** PNG resolution at a preset; needs `presetId`. */
  dpi?: QrRenderDpi;
  /** PNG / SVG width in px (64–6000). Over 2048 counts as print export. */
  sizePx?: number;
}

/** Options of `render`: the export options plus an attachment file name. */
export interface IQrRenderOptions extends IQrExportOptions {
  /** Answer as an attachment named `<name>-<preset|size>.<ext>` (sets `fileName`). */
  download?: boolean;
}

/** A signed, expiring download link of a QR image (`GET /api/qr-code/{id}/export-url`). */
export interface IQrExportUrl {
  /** A public `build-qr` URL; anyone holding it can download the file until it expires. */
  url: string;
  /** ISO date-time the link stops working (1 hour after it was minted). */
  expiresAt: string;
}

/** Scannability check code; the API adds `density` when the text does not fit the symbol. */
export type QrCodeScannabilityCode = QrScannabilityCode | "density";

/** One check of a scannability report, as the API answers it. */
export interface IQRCodeScannabilityCheck extends Omit<IQrScannabilityCheck, "code"> {
  code: QrCodeScannabilityCode;
}

/** A scannability report (`POST /api/qr-code/scannability-check`). */
export interface IQRCodeScannabilityReport extends Omit<IQrScannabilityReport, "checks"> {
  checks: IQRCodeScannabilityCheck[];
}

/** Print-size fields every scannability source may add. */
interface IQrScannabilitySize {
  /** Judge the module size at this print size. */
  presetId?: QrPrintPresetId;
  /** Width in mm for `presetId: "custom"`. */
  customMm?: number;
  /** Judge the module size at this PNG width instead. */
  sizePx?: number;
}

/** Check a saved QR code as it renders (its template wins). */
export interface IQrScannabilityByQrCode extends IQrScannabilitySize {
  qrCodeId: string;
  templateId?: never;
  options?: never;
}

/** Check a template (yours or public); `text` defaults to a representative QR URL. */
export interface IQrScannabilityByTemplate extends IQrScannabilitySize {
  templateId: string;
  text?: string;
  qrCodeId?: never;
  options?: never;
}

/** Check an unsaved design for a given text. */
export interface IQrScannabilityByDesign extends IQrScannabilitySize {
  options: IQrDesignOptions;
  text: string;
  qrCodeId?: never;
  templateId?: never;
}

/** Exactly one source: a QR code, a template, or a design with its text. */
export type IQrScannabilityInput = IQrScannabilityByQrCode | IQrScannabilityByTemplate | IQrScannabilityByDesign;

/** Body of `QRCodeTemplateClient.create`. */
export interface ICreateQRCodeTemplateRequest {
  name?: string;
  /** The design; any v2 field (shapes, fill, frame…) makes it a v2 design. */
  options: IQrDesignOptions;
}

/** Body of `QRCodeTemplateClient.update`: replaces the name and the whole design. */
export interface IUpdateQRCodeTemplateRequest {
  name: string;
  /**
   * The design. A v2 design updated without `designVersion` keeps its v2
   * fields; send `designVersion: 1` to remove them.
   */
  options: IQrDesignOptions;
}

/** Filter of `QRCodeTemplateClient.list`. */
export interface IQRCodeTemplateListParams {
  /** Name contains, case-insensitive. */
  name?: string;
}

/** A template in `list` and the answer of `create`. */
export interface IQRCodeTemplateItem extends IQRCodeTemplate {
  createdAt?: string;
  updatedAt?: string;
}

/** One of your templates with its design (`get`). */
export interface IQRCodeTemplateDetails extends IQRCodeTemplateItem {
  /** Document version: pass it to `update` and `delete`. */
  __v: number;
  isPublic?: boolean;
  schemeType?: number;
  options: IQrDesignOptions;
}

/** One entry of a design catalogue list. */
export interface IQrDesignCatalogueEntry {
  id: string;
  /** i18n key of the label. */
  labelKey: string;
  previewSvg?: string;
  [key: string]: unknown;
}

/** The design catalogue (`GET /api/qr-code-template/design-catalogue`). */
export interface IQrDesignCatalogue {
  frames: IQrDesignCatalogueEntry[];
  ctaPresets: IQrDesignCatalogueEntry[];
  printPresets: IQrDesignCatalogueEntry[];
  dotShapes: IQrDesignCatalogueEntry[];
  eyeFrameShapes: IQrDesignCatalogueEntry[];
  eyeBallShapes: IQrDesignCatalogueEntry[];
  /** Design limits (sizes, DPI values, frame text length…). */
  limits: Record<string, unknown>;
}

/** Logo file types the upload accepts. */
export type QrLogoFileType = "image/png" | "image/jpeg" | "image/webp" | "image/svg+xml";

/** Upload target of a logo (`POST /api/qr-code-template/logo-upload-url`). */
export interface IQrLogoUploadTicket {
  /** Signed PUT URL; PUT the file with the same `Content-Type`. */
  uploadFileURL: string;
  /** Public URL to save as `options.logo` with `logoSource: "upload"`. */
  fileURL: string;
  bucketFilePath?: string;
  /** Resumable upload endpoint, when enabled. */
  tusEndpoint?: string;
  /** Resumable upload ticket, when enabled. */
  ticket?: string;
}
