import qrcode from 'qrcode-generator';
import type { QrEcLevel } from '../enums';
import { QR_EMPTY_TEXT_PLACEHOLDER } from '../config/render-limits.config';
import { QrCapacityError } from '../errors/qr-capacity.error';
import type { IQrMatrix } from '../interface';

/**
 * UTF-8 bytes as a "binary string" (one char per byte). qrcode-generator's byte
 * mode keeps `charCode & 0xff`, so this encodes UTF-8 without touching the
 * library's global `stringToBytes` (the package must stay side-effect free).
 */
const toUtf8ByteString = (text: string): string => {
    // Manual UTF-8 (no TextEncoder global needed in older SSR/test runtimes).
    let out = '';
    for (const ch of text) {
        const cp = ch.codePointAt(0) as number;
        if (cp < 0x80) out += String.fromCharCode(cp);
        else if (cp < 0x800) out += String.fromCharCode(0xc0 | (cp >> 6), 0x80 | (cp & 0x3f));
        else if (cp < 0x10000) out += String.fromCharCode(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f));
        else out += String.fromCharCode(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3f), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f));
    }
    return out;
};

/** Encodes `text` (UTF-8, byte mode, smallest version that fits). Throws `QrCapacityError`. */
export const encodeMatrix = (text: string, ecLevel: QrEcLevel): IQrMatrix => {
    const content = text === '' || text == null ? QR_EMPTY_TEXT_PLACEHOLDER : text;
    const qr = qrcode(0, ecLevel);
    qr.addData(toUtf8ByteString(content), 'Byte');
    try {
        qr.make();
    } catch {
        throw new QrCapacityError(content.length, ecLevel);
    }
    const size = qr.getModuleCount();
    const modules: boolean[][] = [];
    for (let row = 0; row < size; row += 1) {
        const line: boolean[] = [];
        for (let col = 0; col < size; col += 1) line.push(qr.isDark(row, col));
        modules.push(line);
    }
    return { version: (size - 17) / 4, size, ecLevel, modules };
};
