import { IPaginationParams, ValidationError } from "@posty5/core";
import {
  ICreateEventQRCodeRequest,
  ICreateFileQRCodeRequest,
  ICreateFreeTextQRCodeRequest,
  IListParams,
  IQRCodeEventTarget,
  IQRCodeRequest,
  QrCodeFileContent,
} from "../interfaces";
import { QrCodeFileMimeType, QrCodeStructuredTargetType } from "../interfaces/types/type";
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

/** A `Date` as its ISO string; any other value unchanged. */
function toIsoDate<T>(value: T | Date): T | string {
  return value instanceof Date ? value.toISOString() : value;
}

/**
 * The body for creating or updating an `event` code: like
 * {@link toStructuredQrCodeBody}, with `startsAt` / `endsAt` sent as ISO
 * strings when given as `Date`. The caller's object is left untouched.
 */
export function toEventQrCodeBody(data: ICreateEventQRCodeRequest): Record<string, unknown> {
  const event: IQRCodeEventTarget | undefined = data.event && {
    ...data.event,
    startsAt: toIsoDate(data.event.startsAt),
    endsAt: toIsoDate(data.event.endsAt),
  };
  return toStructuredQrCodeBody("event", { ...data, event } as IQRCodeRequest);
}

/** A `file` code's upload input: the content as a `Blob`, its MIME type and size. */
export interface IQrCodeFileUpload {
  blob: Blob;
  mimeType: QrCodeFileMimeType;
  sizeBytes: number;
}

/**
 * The content of a `file` code as a `Blob` plus the MIME type and size the
 * upload-url route asks for. A `Blob` brings its own `type` unless
 * `mimeType` is given; an `ArrayBuffer` / `Uint8Array` (Node `Buffer`)
 * requires `mimeType`. Throws `ValidationError` before any request when the
 * type is missing or the content is empty.
 */
export function toQrCodeFileUpload(content: QrCodeFileContent, mimeType?: QrCodeFileMimeType): IQrCodeFileUpload {
  const isBlob = typeof Blob !== "undefined" && content instanceof Blob;
  const type = (mimeType || (isBlob ? (content as Blob).type : "")) as QrCodeFileMimeType;
  if (!type) {
    throw new ValidationError("file.mimeType is required when the file content is not a Blob with a type");
  }
  const blob = isBlob ? (content as Blob) : new Blob([content as ArrayBuffer], { type });
  if (!(blob.size > 0)) {
    throw new ValidationError("The file is empty");
  }
  return { blob, mimeType: type, sizeBytes: blob.size };
}

/**
 * The body for creating or updating a `file` code: the caller's common fields
 * plus `qrCodeTarget.file` with `fileName` and, when a file was uploaded,
 * `bucketFilePath`. `mimeType` is never sent (the API sets it). The caller's
 * object is left untouched.
 */
export function toFileQrCodeBody(data: ICreateFileQRCodeRequest, bucketFilePath?: string): Record<string, unknown> {
  const { file, ...fields } = data;
  const target: Record<string, unknown> = {};
  if (file?.fileName !== undefined) target.fileName = file.fileName;
  if (bucketFilePath !== undefined) target.bucketFilePath = bucketFilePath;
  return {
    ...withoutDeprecatedKeys(fields),
    qrCodeTarget: { type: "file", file: target },
  };
}

/** The query string sent by `list()`: filters plus pagination, deprecated keys removed. */
export function toQrCodeListQuery(params?: IListParams, pagination?: IPaginationParams): Record<string, unknown> {
  return withoutDeprecatedKeys({ ...params, ...pagination });
}
