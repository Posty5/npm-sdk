import { Posty5BuiltInLabels } from '../config/posty5-labels.config';
import {
    buildButtonClasses,
    formatWithName,
    isIconOnlyShape,
    localeDirection,
    resolveButtonLabel,
    resolveLabels,
    resolveLocale,
    toCssWidth,
    userInitial,
} from './posty5-button.helper';

describe('posty5-button.helper', () => {
    describe('resolveLocale', () => {
        it('takes the first known candidate', () => {
            expect(resolveLocale([undefined, 'ar', 'en'])).toBe('ar');
            expect(resolveLocale([null, '', 'en'])).toBe('en');
        });

        it('falls back to the base language', () => {
            expect(resolveLocale(['ar-EG'])).toBe('ar');
            expect(resolveLocale(['EN_us'])).toBe('en');
        });

        it('knows locales added through the config labels', () => {
            expect(resolveLocale(['fr'], { fr: { continue_with: 'Continuer avec Posty5' } })).toBe('fr');
        });

        it('falls back to English', () => {
            expect(resolveLocale(['de', 'ja'])).toBe('en');
            expect(resolveLocale([])).toBe('en');
        });
    });

    describe('resolveLabels', () => {
        it('returns the built-in labels', () => {
            expect(resolveLabels('en').continue_with).toBe('Continue with Posty5');
            expect(resolveLabels('ar').continue_with).toBe('المتابعة باستخدام Posty5');
            expect(resolveLabels('ar').signin_with).toBe('تسجيل الدخول باستخدام Posty5');
            expect(resolveLabels('ar').signup_with).toBe('إنشاء حساب باستخدام Posty5');
            expect(resolveLabels('ar').signin).toBe('تسجيل الدخول');
        });

        it('keeps Posty5 in Latin script in every built-in label', () => {
            for (const labels of Object.values(Posty5BuiltInLabels)) {
                for (const key of ['continue_with', 'signin_with', 'signup_with'] as const) expect(labels[key]).toContain('Posty5');
            }
        });

        it('applies overrides on top of the built-in labels', () => {
            const labels = resolveLabels('en', { EN: { continue_with: 'Go with Posty5' } });
            expect(labels.continue_with).toBe('Go with Posty5');
            expect(labels.signin).toBe('Sign in');
        });

        it('uses English for an unknown locale without overrides', () => {
            expect(resolveLabels('de').signin_with).toBe('Sign in with Posty5');
        });
    });

    describe('resolveButtonLabel', () => {
        const en = resolveLabels('en');

        it('maps every text option', () => {
            expect(resolveButtonLabel(en, 'continue_with')).toBe('Continue with Posty5');
            expect(resolveButtonLabel(en, 'signin_with')).toBe('Sign in with Posty5');
            expect(resolveButtonLabel(en, 'signup_with')).toBe('Sign up with Posty5');
            expect(resolveButtonLabel(en, 'signin')).toBe('Sign in');
        });

        it('personalises with the remembered name', () => {
            expect(resolveButtonLabel(en, 'signin_with', null, { name: 'Ahmed' })).toBe('Continue as Ahmed');
            expect(resolveButtonLabel(resolveLabels('ar'), 'continue_with', null, { name: 'أحمد' })).toBe('المتابعة باسم أحمد');
        });

        it('ignores a remembered user without a name', () => {
            expect(resolveButtonLabel(en, 'signin', null, { email: 'ah***@gmail.com' })).toBe('Sign in');
        });

        it('lets label override everything', () => {
            expect(resolveButtonLabel(en, 'signin', 'Log in to Trend Digest', { name: 'Ahmed' })).toBe('Log in to Trend Digest');
        });

        it('replaces every {name}', () => {
            expect(formatWithName('{name} / {name}', 'A')).toBe('A / A');
        });
    });

    describe('toCssWidth', () => {
        it('treats numbers and numeric strings as pixels', () => {
            expect(toCssWidth(240)).toBe('240px');
            expect(toCssWidth('240')).toBe('240px');
        });

        it('passes CSS widths through', () => {
            expect(toCssWidth('100%')).toBe('100%');
            expect(toCssWidth(' 20rem ')).toBe('20rem');
        });

        it('returns null for nothing', () => {
            expect(toCssWidth(undefined)).toBeNull();
            expect(toCssWidth('')).toBeNull();
            expect(toCssWidth(Number.NaN)).toBeNull();
        });
    });

    describe('classes and shapes', () => {
        it('marks circle and square as icon only', () => {
            expect(isIconOnlyShape('circle')).toBeTrue();
            expect(isIconOnlyShape('square')).toBeTrue();
            expect(isIconOnlyShape('pill')).toBeFalse();
        });

        it('builds the stable class list', () => {
            const classes = buildButtonClasses({ theme: 'outline', size: 'small', shape: 'circle', logoAlignment: 'center', unstyled: true, personalized: false, busy: false });
            expect(classes.split(' ')).toEqual([
                'posty5-btn',
                'posty5-btn--outline',
                'posty5-btn--small',
                'posty5-btn--circle',
                'posty5-btn--logo-center',
                'posty5-btn--icon-only',
                'posty5-btn--unstyled',
            ]);
        });

        it('adds personalized and busy', () => {
            const classes = buildButtonClasses({ theme: 'filled', size: 'large', shape: 'pill', logoAlignment: 'left', unstyled: false, personalized: true, busy: true });
            expect(classes).toContain('posty5-btn--personalized');
            expect(classes).toContain('posty5-btn--busy');
            expect(classes).not.toContain('posty5-btn--unstyled');
        });
    });

    it('gives the initial of the name or e-mail', () => {
        expect(userInitial({ name: 'ahmed' })).toBe('A');
        expect(userInitial({ email: 'zed@x.com' })).toBe('Z');
        expect(userInitial(null)).toBe('');
    });

    it('knows right-to-left locales', () => {
        expect(localeDirection('ar')).toBe('rtl');
        expect(localeDirection('ar-EG')).toBe('rtl');
        expect(localeDirection('en')).toBe('ltr');
    });
});
