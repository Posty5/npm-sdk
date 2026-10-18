import { InjectionToken } from '@angular/core';
import type { IPosty5ResolvedAuthConfig } from '../interfaces';

/** The resolved config set by `providePosty5Auth(config)`. */
export const Posty5AuthConfigToken = new InjectionToken<IPosty5ResolvedAuthConfig>('Posty5AuthConfig');
