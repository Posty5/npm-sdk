import { IPaginationParams } from "@posty5/core";
import { ICreateFreeTextQRCodeRequest, IListParams, IQRCodeRequest } from "../interfaces";
import { QrCodeStructuredTargetType } from "../interfaces/types/type";
import { QrCodeDeprecatedRequestKeysConst } from "../qr-code.config";

/** A shallow copy of `source` without the keys the API rejects. Never mutates `source`. */
function withoutDeprecatedKeys(source: object): Record<string, unknown> {
  const copy: Record<string, unknown> = { ...source };
  for (const key of QrCodeDeprecatedRequestKeysConst) {
    delete copy[key];
  }
  return copy;
}

/**
 * The body for creating or updating a code of a structured type (`email`,
 * `wifi`, `call`, `sms`, `url`, `geolocation`): the caller's common fields plus
 * `qrCodeTarget: { type, [type]: content }`.
 *
 * It carries no `options.text`. The API builds — and escapes — the text the
 * image encodes from `qrCodeTarget`, so this SDK is never the source of it.
 * The caller's object is left untouched.
 */
export function toStructuredQrCodeBody(type: QrCodeStructuredTargetType, data: IQRCodeRequest): Record<string, unknown> {
  const { [type]: content, ...fields } = data as IQRCodeRequest & Partial<Record<QrCodeStructuredTargetType, unknown>>;
  return {
    ...withoutDeprecatedKeys(fields),
    qrCodeTarget: { type, [type]: content },
  };
}

/**
 * The body for creating or updating a free-text code. The text is both the
 * target (`qrCodeTarget.freeText.text`) and the encoded content
 * (`options.text`); the API derives the stored text from the target.
 * A dynamic code encodes its Posty5 link instead, so no `options.text` is sent
 * for `mode: "dynamic"`. `mode` itself is passed through only when defined.
 * The caller's object is left untouched.
 */
export function toFreeTextQrCodeBody(data: ICreateFreeTextQRCodeRequest): Record<string, unknown> {
  const { text, ...fields } = data;
  const body: Record<string, unknown> = {
    ...withoutDeprecatedKeys(fields),
    qrCodeTarget: { type: "freeText", freeText: { text } },
  };
  if (data.mode !== "dynamic") {
    body.options = { text };
  }
  return body;
}

/** The query string sent by `list()`: filters plus pagination, deprecated keys removed. */
export function toQrCodeListQuery(params?: IListParams, pagination?: IPaginationParams): Record<string, unknown> {
  return withoutDeprecatedKeys({ ...params, ...pagination });
}
