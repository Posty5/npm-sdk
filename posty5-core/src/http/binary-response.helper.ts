/**
 * A failed download (`getBinary`) arrives with its body as bytes, because the
 * request asked for an `arraybuffer`. The API still answers an error with its
 * JSON envelope (`{ message, ... }`), so decode it in place before the error
 * is mapped — otherwise a 403 plan gate or a 404 surfaces as axios's generic
 * "Request failed with status code …" instead of the API's own message.
 * A body that is not JSON (a gateway's HTML page) or is empty is left as is,
 * so the error keeps axios's status message rather than a page of markup.
 */
export function decodeBinaryErrorBody<T>(error: T): T {
  const response = (error as any)?.response;
  const data = response?.data;
  const isBytes = data instanceof ArrayBuffer || (typeof Uint8Array !== "undefined" && data instanceof Uint8Array);
  if (!isBytes) return error;
  const text = new TextDecoder().decode(data as ArrayBuffer | Uint8Array).trim();
  if (!text) return error;
  try {
    response.data = JSON.parse(text);
  } catch {
    // Not JSON: keep the bytes.
  }
  return error;
}
