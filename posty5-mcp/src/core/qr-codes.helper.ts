import type { IQRCode, IQrCodeBulkRow, IQRCodeRequest, IUpdateQRCodeRequest, QRCodeClient, QRCodeMode } from "@posty5/qr-code";
import { QR_CODE_DEFAULT_MODE, QR_CODE_STATIC_ONLY_TYPES } from "../config/qr-codes-enums.config";
import { ToolInputError } from "./tool-input.error";
import type { IQrBulkRowLabels, IQrCodeTargetArgs } from "../interfaces/qr-codes.interface";

/**
 * The SDK's per-type target blocks, out of the tool's flat arguments. Optional
 * parts default to "" because the SDK writes them into the encoded text
 * (`mailto:…?subject=…`, `WIFI:…;P:…;`, `sms:…?body=…`) and would encode a
 * missing one as the word "undefined".
 */
function targetBlocks(target: IQrCodeTargetArgs) {
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
export function resolveQrCodeMode(target: IQrCodeTargetArgs, mode: QRCodeMode | undefined, applyDefault: boolean): QRCodeMode | undefined {
  const staticOnly = QR_CODE_STATIC_ONLY_TYPES.includes(target.type);
  if (staticOnly && mode === "dynamic") {
    throw new ToolInputError(`type "${target.type}" cannot be dynamic; use mode "static" or leave it out.`);
  }
  if (mode !== undefined || !applyDefault) {
    return mode;
  }
  return staticOnly ? "static" : QR_CODE_DEFAULT_MODE;
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
      return client.createWifi({ ...base, mode: base.mode === "dynamic" ? undefined : base.mode, wifi: blocks.wifi });
    case "call":
      return client.createCall({ ...base, call: blocks.call });
    case "sms":
      return client.createSMS({ ...base, sms: blocks.sms });
    case "url":
      return client.createURL({ ...base, url: blocks.url });
    case "geolocation":
      return client.createGeolocation({ ...base, geolocation: blocks.geolocation });
  }
}

/** Replaces a QR code's target (and the given base fields) through the SDK update method of its `type`. */
export function updateQrCode(client: QRCodeClient, id: string, base: IUpdateQRCodeRequest, target: IQrCodeTargetArgs): Promise<IQRCode> {
  const blocks = targetBlocks(target);
  switch (target.type) {
    case "freeText":
      return client.updateFreeText(id, { ...base, text: blocks.text });
    case "email":
      return client.updateEmail(id, { ...base, email: blocks.email });
    case "wifi":
      return client.updateWifi(id, { ...base, mode: base.mode === "dynamic" ? undefined : base.mode, wifi: blocks.wifi });
    case "call":
      return client.updateCall(id, { ...base, call: blocks.call });
    case "sms":
      return client.updateSMS(id, { ...base, sms: blocks.sms });
    case "url":
      return client.updateURL(id, { ...base, url: blocks.url });
    case "geolocation":
      return client.updateGeolocation(id, { ...base, geolocation: blocks.geolocation });
  }
}

/** One `qr_code_create_many` row (flat target fields, as `qr_code_create` takes them) as the SDK's type-tagged bulk row. */
export function toQrBulkRow(row: IQrCodeTargetArgs & IQrBulkRowLabels, mode: QRCodeMode | undefined): IQrCodeBulkRow {
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
