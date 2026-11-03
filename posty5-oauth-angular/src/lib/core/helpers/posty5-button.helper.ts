import { Posty5ButtonClasses, Posty5IconOnlyShapes, Posty5RtlLocales, Posty5WidthUnit } from '../config/posty5-button.config';
import { Posty5BuiltInLabels, Posty5DefaultLocale, Posty5NamePlaceholder } from '../config/posty5-labels.config';
import type {
    IPosty5ButtonClassOptions,
    IPosty5LabelOverrides,
    IPosty5Labels,
    IPosty5RememberedUser,
    Posty5ButtonShape,
    Posty5ButtonText,
} from '../interfaces';

/**
 * The first candidate that has labels (exact match, then its base language:
 * `ar-EG` -> `ar`), else `en`.
 */
export function resolveLocale(candidates: ReadonlyArray<string | null | undefined>, overrides: IPosty5LabelOverrides = {}): string {
    const known = new Set([...Object.keys(Posty5BuiltInLabels), ...Object.keys(overrides)].map((l) => l.toLowerCase()));
    for (const candidate of candidates) {
        if (!candidate) continue;
        const locale = candidate.trim().toLowerCase();
        if (known.has(locale)) return locale;
        const base = locale.split(/[-_]/)[0];
        if (known.has(base)) return base;
    }
    return Posty5DefaultLocale;
}

/** Built-in labels of the locale (or English), with the config overrides on top. */
export function resolveLabels(locale: string, overrides: IPosty5LabelOverrides = {}): IPosty5Labels {
    const key = locale.toLowerCase();
    const base = Posty5BuiltInLabels[key] || Posty5BuiltInLabels[Posty5DefaultLocale];
    const override = Object.keys(overrides).find((l) => l.toLowerCase() === key);
    return { ...base, ...(override ? overrides[override] : {}) };
}

/** `Continue as {name}` -> `Continue as Ahmed`. */
export function formatWithName(template: string, name: string): string {
    return template.split(Posty5NamePlaceholder).join(name);
}

/**
 * The button's text: `label` wins; a remembered user with a name gives
 * "Continue as {name}"; otherwise the `text` option.
 */
export function resolveButtonLabel(labels: IPosty5Labels, text: Posty5ButtonText, label?: string | null, user?: IPosty5RememberedUser | null): string {
    if (label) return label;
    if (user?.name) return formatWithName(labels.continue_as, user.name);
    return labels[text] || labels.continue_with;
}

/** A numeric width is pixels; a string is used as is; empty is `null`. */
export function toCssWidth(width: string | number | null | undefined): string | null {
    if (width === null || width === undefined || width === '') return null;
    if (typeof width === 'number') return Number.isFinite(width) ? `${width}${Posty5WidthUnit}` : null;
    return /^\d+(\.\d+)?$/.test(width.trim()) ? `${width.trim()}${Posty5WidthUnit}` : width.trim();
}

/** Do this shape render the logo only? */
export function isIconOnlyShape(shape: Posty5ButtonShape): boolean {
    return Posty5IconOnlyShapes.includes(shape);
}

/** The first letter of the name (or e-mail), for the avatar fallback. */
export function userInitial(user: IPosty5RememberedUser | null | undefined): string {
    const source = (user?.name || user?.email || '').trim();
    return source ? Array.from(source)[0].toUpperCase() : '';
}

/** Host classes: `posty5-btn posty5-btn--filled posty5-btn--large posty5-btn--rectangular posty5-btn--logo-left ...` */
export function buildButtonClasses(options: IPosty5ButtonClassOptions): string {
    const prefix = Posty5ButtonClasses.modifierPrefix;
    const classes: string[] = [
        Posty5ButtonClasses.root,
        `${prefix}${options.theme}`,
        `${prefix}${options.size}`,
        `${prefix}${options.shape}`,
        `${prefix}${Posty5ButtonClasses.logoPrefix}${options.logoAlignment}`,
    ];
    if (isIconOnlyShape(options.shape)) classes.push(Posty5ButtonClasses.iconOnly);
    if (options.personalized) classes.push(Posty5ButtonClasses.personalized);
    if (options.unstyled) classes.push(Posty5ButtonClasses.unstyled);
    if (options.busy) classes.push(Posty5ButtonClasses.busy);
    return classes.join(' ');
}

/** `rtl` for a right-to-left locale (`ar`, `ar-EG` ...), else `ltr`. */
export function localeDirection(locale: string): 'rtl' | 'ltr' {
    return Posty5RtlLocales.includes(locale.toLowerCase().split(/[-_]/)[0]) ? 'rtl' : 'ltr';
}
