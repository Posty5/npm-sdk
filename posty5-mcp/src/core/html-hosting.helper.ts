import { INLINE_HTML_CONTENT_TYPE } from "../config/html-hosting-enums.config";
import { INLINE_HTML_MAX_BYTES } from "../config/limits.config";
import { ToolInputError } from "./tool-input.error";

/**
 * An inline `html` argument as the `Blob` the SDK uploads (its name goes in the
 * request's `fileName`). Refuses a body over `INLINE_HTML_MAX_BYTES`, naming
 * the GitHub tool that takes a larger page.
 */
export function inlineHtmlBlob(html: string, githubTool: string): Blob {
  const bytes = Buffer.byteLength(html, "utf8");
  if (bytes > INLINE_HTML_MAX_BYTES) {
    throw new ToolInputError(`The HTML is ${bytes} bytes; inline HTML may be at most ${INLINE_HTML_MAX_BYTES} bytes. Put the page in a GitHub repository and use ${githubTool} instead.`);
  }
  return new Blob([html], { type: INLINE_HTML_CONTENT_TYPE });
}
