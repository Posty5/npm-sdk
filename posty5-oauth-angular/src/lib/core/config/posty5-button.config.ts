import type { Posty5ButtonShape, Posty5ButtonSize, Posty5ButtonText, Posty5ButtonTheme, Posty5LogoAlignment } from '../interfaces';

/** Default values of the `button[posty5SignInButton]` inputs. */
export const Posty5ButtonDefaults = {
    theme: 'filled' as Posty5ButtonTheme,
    size: 'large' as Posty5ButtonSize,
    shape: 'rectangular' as Posty5ButtonShape,
    text: 'continue_with' as Posty5ButtonText,
    logoAlignment: 'left' as Posty5LogoAlignment,
    showUserPicture: true,
    unstyled: false,
    disabled: false,
    autoSignIn: true,
} as const;

/** Shapes that render the logo only (the label stays as `aria-label`). */
export const Posty5IconOnlyShapes: readonly Posty5ButtonShape[] = ['circle', 'square'];

/** Stable class names apps can target. */
export const Posty5ButtonClasses = {
    root: 'posty5-btn',
    unstyled: 'posty5-btn--unstyled',
    iconOnly: 'posty5-btn--icon-only',
    personalized: 'posty5-btn--personalized',
    busy: 'posty5-btn--busy',
    /** `posty5-btn--filled`, `posty5-btn--large`, `posty5-btn--pill`, `posty5-btn--logo-left` ... */
    modifierPrefix: 'posty5-btn--',
    logoPrefix: 'logo-',
} as const;

/** Unit appended to a numeric `width`. */
export const Posty5WidthUnit = 'px';

/**
 * `width` / `height` attributes of the logo and the avatar image. They only
 * matter with `unstyled` (the built-in styles size both through CSS), so an
 * unstyled button never shows a 300 x 150 SVG.
 */
export const Posty5ButtonIntrinsicSizes = {
    logo: '1.25em',
    avatar: 24,
} as const;

/** Locales written right to left: the button sets `dir="rtl"` for them. */
export const Posty5RtlLocales: readonly string[] = ['ar', 'fa', 'he', 'ur'];

/** Default values of the `[posty5Callback]` inputs. */
export const Posty5CallbackDefaults = {
    autoHandle: true,
    hideDefaultUi: false,
} as const;
