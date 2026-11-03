import type { IPosty5RememberedUser } from './posty5-user.interface';

export type Posty5ButtonTheme = 'outline' | 'filled' | 'filledDark';
export type Posty5ButtonSize = 'large' | 'medium' | 'small';
/** `circle` and `square` render the logo only. */
export type Posty5ButtonShape = 'rectangular' | 'pill' | 'circle' | 'square';
export type Posty5LogoAlignment = 'left' | 'center';

/** `(posty5Click)` payload. */
export interface IPosty5ButtonClickEvent {
    event: MouseEvent;
    /** The remembered user the button showed, if any. */
    user: IPosty5RememberedUser | null;
}

/** Input of `buildButtonClasses`. */
export interface IPosty5ButtonClassOptions {
    theme: Posty5ButtonTheme;
    size: Posty5ButtonSize;
    shape: Posty5ButtonShape;
    logoAlignment: Posty5LogoAlignment;
    unstyled: boolean;
    personalized: boolean;
    busy: boolean;
}
