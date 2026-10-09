import type { IQRCode, IQrCodeBulkRow, IQRCodeRequest, IUpdateQRCodeRequest, QRCodeClient, QRCodeMode } from "@posty5/qr-code";
import { QR_CODE_DEFAULT_MODE, QR_CODE_DEFAULT_STATIC_TYPES, QR_CODE_DYNAMIC_ONLY_TYPES, QR_CODE_STATIC_ONLY_TYPES } from "../config/qr-codes-enums.config";
import { QR_MCP_FILE_MAX_BYTES } from "../config/limits.config";
import { ToolInputError } from "./tool-input.error";
import type { IQrBulkRowLabels, IQrBulkTargetArgs, IQrCodeTargetArgs } from "../interfaces/qr-codes.interface";

/**
 * The SDK's per-type target blocks, out of the tool's flat arguments. Optional
 * parts default to "" because the SDK writes them into the encoded text
 * (`mailto:…?subject=…`, `WIFI:…;P:…;`, `sms:…?body=…`) and would encode a
 * missing one as the word "undefined".
 */
function targetBlocks(target: Omit<IQrCodeTargetArgs, "type">) {
  return {
    text: target.text ?? "",
    email: { email: target.email, subject: target.emailSubject ?? "", body: target.emailBody ?? "" },
    wifi: { name: target.wifiName, authenticationType: target.wifiAuthenticationType, password: target.wifiPassword ?? "" },
    call: { phoneNumber: target.phoneNumber },
    sms: { phoneNumber: target.phoneNumber, message: target.smsMessage ?? "" },
    url: { url: target.url },
    geolocation: { latitude: target.latitude!, longitude: target.longitude! },
  };
}

/**
 * The mode a QR code tool sends. Wi-Fi is static-only: asking for dynamic is
 * refused before any request. With `applyDefault` (qr_code_create) an omitted
 * mode becomes the dynamic default (DQ-D3), or static for Wi-Fi; without it
 * (qr_code_update) an omitted mode stays omitted so the stored mode is kept.
 */
export function resolveQrCodeMode(target: Pick<IQrCodeTargetArgs, "type"> | Pick<IQrBulkTargetArgs, "type">, mode: QRCodeMode | undefined, applyDefault: boolean): QRCodeMode | undefined {
  const staticOnly = QR_CODE_STATIC_ONLY_TYPES.includes(target.type);
  if (staticOnly && mode === "dynamic") {
    throw new ToolInputError(`type "${target.type}" cannot be dynamic; use mode "static" or leave it out.`);
  }
  if (QR_CODE_DYNAMIC_ONLY_TYPES.includes(target.type)) {
    if (mode === "static") {
      throw new ToolInputError(`This QR code type cannot be static: type "${target.type}" is always dynamic; leave mode out.`);
    }
    return applyDefault ? "dynamic" : mode;
  }
  if (mode !== undefined || !applyDefault) {
    return mode;
  }
  if (staticOnly || QR_CODE_DEFAULT_STATIC_TYPES.includes(target.type)) {
    return "static";
  }
  return QR_CODE_DEFAULT_MODE;
}

/**
 * Checks a `social` target against its mode: more than one profile needs a
 * dynamic code (the API refuses it on a static one).
 */
export function checkQrSocialProfiles(target: IQrCodeTargetArgs, mode: QRCodeMode | undefined): void {
  if (target.type === "social" && mode === "static" && (target.social?.profiles.length ?? 0) > 1) {
    throw new ToolInputError('A static social QR code takes one profile; use mode "dynamic" (or leave it out) for up to 12.');
  }
}

/**
 * The bytes of a `file` code's `fileBase64`: a `data:<mime>;base64,` prefix is
 * stripped, malformed base64 and content over `QR_MCP_FILE_MAX_BYTES` are
 * refused before any request.
 */
export function decodeQrFileBase64(fileBase64: string): Uint8Array {
  const raw = fileBase64.replace(/^data:[^;,]*;base64,/i, "").replace(/\s+/g, "");
  if (!raw || !/^[A-Za-z0-9+/_-]*={0,2}$/.test(raw)) {
    throw new ToolInputError("fileBase64 is not valid base64.");
  }
  const bytes = Buffer.from(raw, raw.includes("-") || raw.includes("_") ? "base64url" : "base64");
  if (bytes.byteLength > QR_MCP_FILE_MAX_BYTES) {
    const maxMb = QR_MCP_FILE_MAX_BYTES / (1024 * 1024);
    throw new ToolInputError(`The file is ${(bytes.byteLength / (1024 * 1024)).toFixed(1)} MB; files over ${maxMb} MB cannot be sent through MCP. Upload it in the Posty5 dashboard instead.`);
  }
  if (bytes.byteLength === 0) {
    throw new ToolInputError("fileBase64 is empty.");
  }
  return new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

/** `base` without `mode`: dynamic-only types (appStore, file) take none; the API makes them dynamic. */
function withoutMode<T extends object>(base: T): Omit<T, "mode"> {
  const { mode: _mode, ...rest } = base as T & { mode?: unknown };
  return rest;
}

/** `base` without `access`: static-only types (Wi-Fi) take no scan rules. */
function withoutAccess<T extends object>(base: T): Omit<T, "access"> {
  const { access: _access, ...rest } = base as T & { access?: unknown };
  return rest;
}

/**
 * Refuses scan rules (`access`, other than leaving it out) on a static-only
 * type or an explicitly static code, before any request; the API would answer
 * 400 "Scan rules are only available for dynamic QR codes".
 */
export function checkQrCodeAccess(target: IQrCodeTargetArgs, mode: QRCodeMode | undefined, access: unknown): void {
  if (access === undefined) {
    return;
  }
  if (QR_CODE_STATIC_ONLY_TYPES.includes(target.type) || (mode === "static" && access !== null)) {
    throw new ToolInputError(`access (scan rules) is only available for dynamic QR codes; type "${target.type}"${mode ? `, mode "${mode}"` : ""} cannot take it.`);
  }
}

/** Creates a QR code through the SDK method of its `type`. Check the type's fields with `requireFields` first. */
export function createQrCode(client: QRCodeClient, base: IQRCodeRequest, target: IQrCodeTargetArgs): Promise<IQRCode> {
  const blocks = targetBlocks(target);
  switch (target.type) {
    case "freeText":
      return client.createFreeText({ ...base, text: blocks.text });
    case "email":
      return client.createEmail({ ...base, email: blocks.email });
    case "wifi":
      return client.createWifi({ ...withoutAccess(base), mode: base.mode === "dynamic" ? undefined : base.mode, wifi: blocks.wifi });
    case "call":
      return client.createCall({ ...base, call: blocks.call });
    case "sms":
      return client.createSMS({ ...base, sms: blocks.sms });
    case "url":
      return client.createURL({ ...base, url: blocks.url });
    case "geolocation":
      return client.createGeolocation({ ...base, geolocation: blocks.geolocation });
    case "vcard":
      return client.createVCard({ ...base, vcard: target.vcard! });
    case "event":
      return client.createEvent({ ...base, event: target.event! });
    case "whatsapp":
      return client.createWhatsApp({ ...base, whatsapp: target.whatsapp! });
    case "review":
      return client.createReview({ ...base, review: target.review! });
    case "social":
      return client.createSocial({ ...base, social: target.social! });
    case "appStore":
      return client.createAppStore({ ...withoutMode(base), appStore: target.appStore! });
    case "file":
      return client.createFile({ ...withoutMode(base), file: { fileName: target.fileName, mimeType: target.mimeType } }, decodeQrFileBase64(target.fileBase64!));
  }
}

/** Replaces a QR code's target (and the given base fields) through the SDK update method of its `type`. */
export function updateQrCode(client: QRCodeClient, id: string, base: IUpdateQRCodeRequest, target: IQrCodeTargetArgs, version: number): Promise<IQRCode> {
  const blocks = targetBlocks(target);
  switch (target.type) {
    case "freeText":
      return client.updateFreeText(id, { ...base, text: blocks.text }, version);
    case "email":
      return client.updateEmail(id, { ...base, email: blocks.email }, version);
    case "wifi":
      return client.updateWifi(id, { ...withoutAccess(base), mode: base.mode === "dynamic" ? undefined : base.mode, wifi: blocks.wifi }, version);
    case "call":
      return client.updateCall(id, { ...base, call: blocks.call }, version);
    case "sms":
      return client.updateSMS(id, { ...base, sms: blocks.sms }, version);
    case "url":
      return client.updateURL(id, { ...base, url: blocks.url }, version);
    case "geolocation":
      return client.updateGeolocation(id, { ...base, geolocation: blocks.geolocation }, version);
    case "vcard":
      return client.updateVCard(id, { ...base, vcard: target.vcard! }, version);
    case "event":
      return client.updateEvent(id, { ...base, event: target.event! }, version);
    case "whatsapp":
      return client.updateWhatsApp(id, { ...base, whatsapp: target.whatsapp! }, version);
    case "review":
      return client.updateReview(id, { ...base, review: target.review! }, version);
    case "social":
      return client.updateSocial(id, { ...base, social: target.social! }, version);
    case "appStore":
      return client.updateAppStore(id, { ...withoutMode(base), appStore: target.appStore! }, version);
    case "file": {
      const content = target.fileBase64 ? decodeQrFileBase64(target.fileBase64) : undefined;
      return client.updateFile(id, { ...withoutMode(base), file: { fileName: target.fileName, mimeType: target.mimeType } }, version, content);
    }
  }
}

/** One `qr_code_create_many` row (flat target fields, as `qr_code_create` takes them) as the SDK's type-tagged bulk row. */
export function toQrBulkRow(row: IQrBulkTargetArgs & IQrBulkRowLabels, mode: QRCodeMode | undefined): IQrCodeBulkRow {
  const blocks = targetBlocks(row);
  const { name, customId, tag, refId, templateId, fileName } = row;
  const base = { mode, name, customId, tag, refId, templateId, fileName };
  switch (row.type) {
    case "freeText":
      return { ...base, type: "freeText", target: { text: blocks.text } };
    case "email":
      return { ...base, type: "email", target: blocks.email };
    case "wifi":
      return { ...base, type: "wifi", target: blocks.wifi };
    case "call":
      return { ...base, type: "call", target: blocks.call };
    case "sms":
      return { ...base, type: "sms", target: blocks.sms };
    case "url":
      return { ...base, type: "url", target: blocks.url };
    case "geolocation":
      return { ...base, type: "geolocation", target: blocks.geolocation };
  }
}
