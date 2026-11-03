/*
 * Public API of @posty5/oauth-angular.
 */

// Setup
export { providePosty5Auth } from './lib/provide-posty5-auth';
export { Posty5AuthConfigToken } from './lib/core/tokens/posty5-auth-config.token';

// Services
export { Posty5AuthService } from './lib/services/posty5-auth.service';
export { Posty5AuthStorageService } from './lib/services/posty5-auth-storage.service';
export { Posty5OidcHttpService } from './lib/services/posty5-oidc-http.service';

// Components
export { Posty5SignInButtonComponent } from './lib/components/sign-in-button/posty5-sign-in-button.component';
export { Posty5CallbackComponent } from './lib/components/callback/posty5-callback.component';

// Errors
export { Posty5AuthError } from './lib/core/errors/posty5-auth.error';

// Config and defaults
export { Posty5AuthDefaults, Posty5StorageKeys, Posty5CallbackParams, Posty5EmailMask } from './lib/core/config/posty5-auth.config';
export {
    Posty5ButtonDefaults,
    Posty5ButtonClasses,
    Posty5IconOnlyShapes,
    Posty5ButtonIntrinsicSizes,
    Posty5RtlLocales,
    Posty5WidthUnit,
    Posty5CallbackDefaults,
} from './lib/core/config/posty5-button.config';
export { Posty5BuiltInLabels, Posty5DefaultLocale, Posty5NamePlaceholder } from './lib/core/config/posty5-labels.config';
export { Posty5LogoConfig } from './lib/core/config/posty5-logo.config';

// Helpers (pure; usable in tests and custom buttons)
export * from './lib/core/helpers/posty5-auth.helper';
export * from './lib/core/helpers/posty5-button.helper';
export * from './lib/core/helpers/posty5-crypto.helper';

// Types
export * from './lib/core/interfaces';
