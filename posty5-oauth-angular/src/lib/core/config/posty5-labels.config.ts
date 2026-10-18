import type { IPosty5Labels } from '../interfaces';

/** The locale used when neither the button, the config nor `<html lang>` names a known one. */
export const Posty5DefaultLocale = 'en';

/** The placeholder replaced by the user's name in `continue_as`. */
export const Posty5NamePlaceholder = '{name}';

/**
 * Built-in labels. "Posty5" stays in Latin script in every language
 * (workspace glossary: product names are never translated). Arabic messages
 * use the verbal noun for buttons and جارٍ / تعذّر for status messages.
 */
export const Posty5BuiltInLabels: Readonly<Record<string, IPosty5Labels>> = {
    en: {
        continue_with: 'Continue with Posty5',
        signin_with: 'Sign in with Posty5',
        signup_with: 'Sign up with Posty5',
        signin: 'Sign in',
        continue_as: 'Continue as {name}',
        callback_pending: 'Signing you in...',
        callback_failed: 'Sign-in failed. Please try again.',
        callback_cancelled: 'Sign-in was cancelled.',
    },
    ar: {
        continue_with: 'المتابعة باستخدام Posty5',
        signin_with: 'تسجيل الدخول باستخدام Posty5',
        signup_with: 'إنشاء حساب باستخدام Posty5',
        signin: 'تسجيل الدخول',
        continue_as: 'المتابعة باسم {name}',
        callback_pending: 'جارٍ تسجيل الدخول...',
        callback_failed: 'تعذّر تسجيل الدخول. يرجى المحاولة مرة أخرى.',
        callback_cancelled: 'تم إلغاء تسجيل الدخول.',
    },
};
