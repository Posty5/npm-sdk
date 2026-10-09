import type { QrModuleRole } from '../enums';

/** Alignment-pattern centre coordinates per version (ISO/IEC 18004 Annex E). */
const ALIGNMENT_POSITIONS: readonly (readonly number[])[] = [
    [], [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
    [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50], [6, 30, 54], [6, 32, 58], [6, 34, 62],
    [6, 26, 46, 66], [6, 26, 48, 70], [6, 26, 50, 74], [6, 30, 54, 78], [6, 30, 56, 82], [6, 30, 58, 86], [6, 34, 62, 90],
    [6, 28, 50, 72, 94], [6, 26, 50, 74, 98], [6, 30, 54, 78, 102], [6, 28, 54, 80, 106], [6, 32, 58, 84, 110], [6, 30, 58, 86, 114], [6, 34, 62, 90, 118],
    [6, 26, 50, 74, 98, 122], [6, 30, 54, 78, 102, 126], [6, 26, 52, 78, 104, 130], [6, 30, 56, 82, 108, 134], [6, 34, 60, 86, 112, 138], [6, 30, 58, 86, 114, 142], [6, 34, 62, 90, 118, 146],
    [6, 30, 54, 78, 102, 126, 150], [6, 24, 50, 76, 102, 128, 154], [6, 28, 54, 80, 106, 132, 158], [6, 32, 58, 84, 110, 136, 162], [6, 26, 54, 82, 110, 138, 166], [6, 30, 58, 86, 114, 142, 170],
];

/** Edge of a finder pattern including its separator. */
export const FINDER_ZONE = 8;
/** Edge of a finder pattern. */
export const FINDER_SIZE = 7;

/** True when (row, col) lies in one of the three finder zones (pattern + separator). */
export const isFinderZone = (row: number, col: number, size: number): boolean =>
    (row < FINDER_ZONE && col < FINDER_ZONE) ||
    (row < FINDER_ZONE && col >= size - FINDER_ZONE) ||
    (row >= size - FINDER_ZONE && col < FINDER_ZONE);

/**
 * Builds a role grid for a symbol: finder, alignment outer/inner, timing H/V, data.
 * The renderer draws finders as eyes and gives the others their legacy colours/scales.
 */
export const buildModuleRoles = (version: number, size: number): QrModuleRole[][] => {
    const roles: QrModuleRole[][] = Array.from({ length: size }, () => Array<QrModuleRole>(size).fill('data'));
    for (let row = 0; row < size; row += 1) {
        for (let col = 0; col < size; col += 1) {
            if (isFinderZone(row, col, size)) roles[row][col] = 'finder';
            else if (row === 6) roles[row][col] = 'timingH';
            else if (col === 6) roles[row][col] = 'timingV';
        }
    }
    const centres = ALIGNMENT_POSITIONS[version] ?? [];
    for (const cr of centres) {
        for (const cc of centres) {
            if (isFinderZone(cr, cc, size)) continue;
            for (let dr = -2; dr <= 2; dr += 1) {
                for (let dc = -2; dc <= 2; dc += 1) {
                    roles[cr + dr][cc + dc] = dr === 0 && dc === 0 ? 'alignmentInner' : 'alignmentOuter';
                }
            }
        }
    }
    return roles;
};
