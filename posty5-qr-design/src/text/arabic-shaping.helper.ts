import { ARABIC_FORMS, ARABIC_LAM, ARABIC_TATWEEL, BIDI_MIRRORS, LAM_ALEF_LIGATURES } from './arabic-forms.data';

type Direction = 'L' | 'R' | 'N';

/** Harakat and other combining marks: transparent to joining, dropped from output (not positioned). */
const isTransparentMark = (cp: number): boolean => (cp >= 0x064b && cp <= 0x065f) || cp === 0x0670;
const isArabicLetter = (cp: number): boolean => (cp >= 0x0600 && cp <= 0x06ff) || (cp >= 0xfb50 && cp <= 0xfeff);
const isStrongLtr = (ch: string): boolean => /[A-Za-zÀ-ɏ0-9٠-٩]/.test(ch);

const joinsLeft = (cp: number | undefined): boolean =>
    cp === ARABIC_TATWEEL || (cp !== undefined && ARABIC_FORMS[cp]?.[1] === 'D');
const joinsRight = (cp: number | undefined): boolean =>
    cp === ARABIC_TATWEEL || (cp !== undefined && (ARABIC_FORMS[cp]?.[1] === 'D' || ARABIC_FORMS[cp]?.[1] === 'R'));

/** True when the text contains Arabic letters (the paragraph is then right-to-left). */
export const hasArabic = (text: string): boolean => /[؀-ۿ]/.test(text);

/**
 * Shapes Arabic in logical order to presentation forms: contextual
 * isolated/final/initial/medial forms and lam-alef ligatures. Marks are dropped.
 */
export const shapeArabic = (text: string): string => {
    const cps = Array.from(text, (c) => c.codePointAt(0) as number).filter((cp) => !isTransparentMark(cp));
    const out: number[] = [];
    for (let i = 0; i < cps.length; i += 1) {
        const cp = cps[i];
        const forms = ARABIC_FORMS[cp];
        if (!forms) {
            out.push(cp);
            continue;
        }
        const prev = cps[i - 1];
        const joinedFromPrev = joinsLeft(prev) && forms[1] !== 'U';
        const next = cps[i + 1];
        const ligature = cp === ARABIC_LAM && next !== undefined ? LAM_ALEF_LIGATURES[next] : undefined;
        if (ligature) {
            out.push(joinedFromPrev ? ligature[1] : ligature[0]);
            i += 1;
            continue;
        }
        const joinsNext = forms[1] === 'D' && joinsRight(next);
        const [first] = forms;
        if (forms[1] === 'U') out.push(first);
        else if (forms[1] === 'R') out.push(joinedFromPrev ? first + 1 : first);
        else if (joinedFromPrev && joinsNext) out.push(first + 3);
        else if (joinedFromPrev) out.push(first + 1);
        else if (joinsNext) out.push(first + 2);
        else out.push(first);
    }
    return String.fromCodePoint(...out);
};

/**
 * Visual order for one line (simplified UBA): an Arabic-bearing paragraph is RTL,
 * runs of strong LTR (Latin, digits) keep their order, neutrals take the direction
 * of equal neighbours or the paragraph's. Input must already be shaped.
 */
export const toVisualOrder = (shaped: string): string => {
    const chars = Array.from(shaped);
    if (!chars.some((c) => isArabicLetter(c.codePointAt(0) as number))) return shaped;
    const dirs: Direction[] = chars.map((c) =>
        isArabicLetter(c.codePointAt(0) as number) ? 'R' : isStrongLtr(c) ? 'L' : 'N',
    );
    const resolved = dirs.map((d, i) => {
        if (d !== 'N') return d;
        const before = dirs.slice(0, i).reverse().find((x) => x !== 'N') ?? 'R';
        const after = dirs.slice(i + 1).find((x) => x !== 'N') ?? 'R';
        return before === after ? before : 'R';
    });
    const runs: { dir: Direction; chars: string[] }[] = [];
    chars.forEach((c, i) => {
        const last = runs[runs.length - 1];
        if (last && last.dir === resolved[i]) last.chars.push(c);
        else runs.push({ dir: resolved[i], chars: [c] });
    });
    return runs
        .reverse()
        .map((run) => (run.dir === 'R' ? run.chars.reverse().map((c) => BIDI_MIRRORS[c] ?? c).join('') : run.chars.join('')))
        .join('');
};
