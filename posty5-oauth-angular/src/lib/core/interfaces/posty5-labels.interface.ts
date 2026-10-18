/** The `text` option of the button (same names as Google's GSI button). */
export type Posty5ButtonText = 'continue_with' | 'signin_with' | 'signup_with' | 'signin';

/** Every string the package renders, for one locale. `{name}` is replaced by the user's name. */
export interface IPosty5Labels {
    continue_with: string;
    signin_with: string;
    signup_with: string;
    signin: string;
    /** Personalised button, e.g. `Continue as {name}`. */
    continue_as: string;
    /** Callback component while the code is exchanged. */
    callback_pending: string;
    /** Callback component when the sign-in failed. */
    callback_failed: string;
    /** Callback component when the user pressed Cancel on Posty5. */
    callback_cancelled: string;
}

/** `labels` of the config: per-locale partial overrides. */
export interface IPosty5LabelOverrides {
    [locale: string]: Partial<IPosty5Labels>;
}
