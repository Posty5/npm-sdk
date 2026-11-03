import { ChangeDetectionStrategy, Component, ViewEncapsulation, afterNextRender, booleanAttribute, computed, inject, input, output, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Posty5CallbackDefaults } from '../../core/config/posty5-button.config';
import { Posty5AuthError } from '../../core/errors/posty5-auth.error';
import { resolveLabels, resolveLocale } from '../../core/helpers/posty5-button.helper';
import type { IPosty5CallbackResult, Posty5CallbackStatus } from '../../core/interfaces';
import { Posty5AuthConfigToken } from '../../core/tokens/posty5-auth-config.token';
import { Posty5AuthService } from '../../services/posty5-auth.service';

/**
 * Completes the sign-in on the redirect URI (`codeHandler` and `browser`
 * modes). Use it as the route component of the redirect URI, or put the
 * attribute on any element of your own callback page:
 *
 * ```html
 * <div posty5Callback (signedIn)="done($event)" (failed)="oops($event)"></div>
 * ```
 *
 * It runs `Posty5AuthService.handleCallback()` once, in the browser only
 * (after the first render, so SSR renders the pending state). Projected
 * content is always shown; `hideDefaultUi` removes the built-in spinner and
 * message.
 */
@Component({
    selector: '[posty5Callback]',
    standalone: true,
    templateUrl: './posty5-callback.component.html',
    styleUrls: ['./posty5-callback.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        class: 'posty5-callback',
        '[class.posty5-callback--pending]': "status() === 'pending'",
        '[class.posty5-callback--failed]': "status() === 'failed'",
        '[class.posty5-callback--signed-in]': "status() === 'signedIn'",
        '[attr.lang]': 'activeLocale()',
    },
})
export class Posty5CallbackComponent {
    /** The callback URL; defaults to the current `location.href`. */
    readonly url = input<string | undefined>(undefined);
    /** `false`: do not run automatically; call `run()` yourself. */
    readonly autoHandle = input<boolean, unknown>(Posty5CallbackDefaults.autoHandle, { transform: booleanAttribute });
    /** Hide the built-in spinner and error message (projected content stays). */
    readonly hideDefaultUi = input<boolean, unknown>(Posty5CallbackDefaults.hideDefaultUi, { transform: booleanAttribute });
    readonly locale = input<string | null | undefined>(undefined);

    /** The sign-in completed: claims + tokens (browser) or your back end's JSON (codeHandler). */
    readonly signedIn = output<IPosty5CallbackResult>();
    /** The sign-in failed; `error.code === 'cancelled'` when the user pressed Cancel. */
    readonly failed = output<Posty5AuthError>();

    /** `pending` until the callback is handled, then `signedIn` or `failed`. */
    readonly status = signal<Posty5CallbackStatus>('pending');
    readonly error = signal<Posty5AuthError | null>(null);
    private readonly auth = inject(Posty5AuthService);
    private readonly config = inject(Posty5AuthConfigToken, { optional: true });
    private readonly document = inject(DOCUMENT);
    private started = false;

    protected readonly activeLocale = computed(() =>
        resolveLocale([this.locale(), this.config?.locale, this.document.documentElement?.getAttribute('lang')], this.config?.labels),
    );
    protected readonly labels = computed(() => resolveLabels(this.activeLocale(), this.config?.labels));
    protected readonly errorMessage = computed(() =>
        this.error()?.code === 'cancelled' ? this.labels().callback_cancelled : this.labels().callback_failed,
    );

    constructor() {
        afterNextRender(() => {
            if (this.autoHandle()) void this.run();
        });
    }

    /** Handle the callback (once per component instance). */
    async run(): Promise<void> {
        if (this.started) return;
        this.started = true;
        this.status.set('pending');
        try {
            const result = await this.auth.handleCallback(this.url());
            this.status.set('signedIn');
            this.signedIn.emit(result);
        } catch (caught) {
            const error = caught instanceof Posty5AuthError ? caught : new Posty5AuthError('authorization_error', String((caught as Error)?.message || caught));
            this.error.set(error);
            this.status.set('failed');
            this.failed.emit(error);
        }
    }
}
