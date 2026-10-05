import type { IQRCode, IQRCodeRequest, IUpdateQRCodeRequest, QRCodeClient } from "@posty5/qr-code";
import type { IQrCodeTargetArgs } from "../interfaces/qr-codes.interface";

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

/** Creates a QR code through the SDK method of its `type`. Check the type's fields with `requireFields` first. */
export function createQrCode(client: QRCodeClient, base: IQRCodeRequest, target: IQrCodeTargetArgs): Promise<IQRCode> {
  const blocks = targetBlocks(target);
  switch (target.type) {
    case "freeText":
      return client.createFreeText({ ...base, text: blocks.text });
    case "email":
      return client.createEmail({ ...base, email: blocks.email });
    case "wifi":
      return client.createWifi({ ...base, wifi: blocks.wifi });
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
      return client.updateWifi(id, { ...base, wifi: blocks.wifi });
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
