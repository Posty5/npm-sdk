/**
 * Arabic letters → first presentation form (U+FE70 block) and joining type.
 * 'D' dual-joining: forms are isolated, final, initial, medial at first+0..3.
 * 'R' right-joining: isolated, final at first+0..1. 'U' hamza: isolated only.
 */
export const ARABIC_FORMS: Readonly<Record<number, readonly [number, 'D' | 'R' | 'U']>> = {
    0x0621: [0xfe80, 'U'],
    0x0622: [0xfe81, 'R'],
    0x0623: [0xfe83, 'R'],
    0x0624: [0xfe85, 'R'],
    0x0625: [0xfe87, 'R'],
    0x0626: [0xfe89, 'D'],
    0x0627: [0xfe8d, 'R'],
    0x0628: [0xfe8f, 'D'],
    0x0629: [0xfe93, 'R'],
    0x062a: [0xfe95, 'D'],
    0x062b: [0xfe99, 'D'],
    0x062c: [0xfe9d, 'D'],
    0x062d: [0xfea1, 'D'],
    0x062e: [0xfea5, 'D'],
    0x062f: [0xfea9, 'R'],
    0x0630: [0xfeab, 'R'],
    0x0631: [0xfead, 'R'],
    0x0632: [0xfeaf, 'R'],
    0x0633: [0xfeb1, 'D'],
    0x0634: [0xfeb5, 'D'],
    0x0635: [0xfeb9, 'D'],
    0x0636: [0xfebd, 'D'],
    0x0637: [0xfec1, 'D'],
    0x0638: [0xfec5, 'D'],
    0x0639: [0xfec9, 'D'],
    0x063a: [0xfecd, 'D'],
    0x0641: [0xfed1, 'D'],
    0x0642: [0xfed5, 'D'],
    0x0643: [0xfed9, 'D'],
    0x0644: [0xfedd, 'D'],
    0x0645: [0xfee1, 'D'],
    0x0646: [0xfee5, 'D'],
    0x0647: [0xfee9, 'D'],
    0x0648: [0xfeed, 'R'],
    0x0649: [0xfeef, 'R'],
    0x064a: [0xfef1, 'D'],
};

export const ARABIC_LAM = 0x0644;
export const ARABIC_TATWEEL = 0x0640;

/** Lam + alef ligature: alef variant → [isolated, final]. */
export const LAM_ALEF_LIGATURES: Readonly<Record<number, readonly [number, number]>> = {
    0x0622: [0xfef5, 0xfef6],
    0x0623: [0xfef7, 0xfef8],
    0x0625: [0xfef9, 0xfefa],
    0x0627: [0xfefb, 0xfefc],
};

/** Mirrored punctuation in right-to-left runs. */
export const BIDI_MIRRORS: Readonly<Record<string, string>> = {
    '(': ')',
    ')': '(',
    '[': ']',
    ']': '[',
    '{': '}',
    '}': '{',
    '<': '>',
    '>': '<',
};
