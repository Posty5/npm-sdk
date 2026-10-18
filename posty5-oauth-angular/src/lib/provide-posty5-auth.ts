import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { resolveAuthConfig } from './core/helpers/posty5-auth.helper';
import type { IPosty5AuthConfig } from './core/interfaces';
import { Posty5AuthConfigToken } from './core/tokens/posty5-auth-config.token';

/**
 * Configure Login with Posty5 (in `bootstrapApplication` / `app.config.ts`).
 * The config is checked here, so a wrong config fails at start-up.
 *
 * ```ts
 * providers: [providePosty5Auth({ mode: 'startUrl', startUrl: '/api/auth/posty5/start' })]
 * ```
 */
export function providePosty5Auth(config: IPosty5AuthConfig): EnvironmentProviders {
    return makeEnvironmentProviders([{ provide: Posty5AuthConfigToken, useValue: resolveAuthConfig(config) }]);
}
