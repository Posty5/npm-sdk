import {
    ChangeDetectionStrategy,
    Component,
    ViewEncapsulation,
    afterNextRender,
    booleanAttribute,
    computed,
    inject,
    input,
    output,
    signal,
} from '@angular/core';
import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { Posty5ButtonDefaults, Posty5ButtonIntrinsicSizes } from '../../core/config/posty5-button.config';
import { Posty5LogoConfig } from '../../core/config/posty5-logo.config';
import {
    buildButtonClasses,
    isIconOnlyShape,
    localeDirection,
    resolveButtonLabel,
    resolveLabels,
    resolveLocale,
    toCssWidth,
    userInitial,
} from '../../core/helpers/posty5-button.helper';
import type {
    IPosty5ButtonClickEvent,
    IPosty5RememberedUser,
    Posty5ButtonShape,
    Posty5ButtonSize,
    Posty5ButtonText,
    Posty5ButtonTheme,
    Posty5LogoAlignment,
    Posty5Prompt,
} from '../../core/interfaces';
import { Posty5AuthConfigToken } from '../../core/tokens/posty5-auth-config.token';
import { Posty5AuthService } from '../../services/posty5-auth.service';

/**
 * "Continue with Posty5" button, modelled on Google's GSI button options.
 *
 * ```html
 * <button posty5SignInButton theme="outline" shape="pill" returnUrl="/feed"></button>
 * ```
 *
 * A click calls `Posty5AuthService.signIn({ returnUrl, prompt, maxAge })`
 * unless `autoSignIn` is `false`; `(posty5Click)` fires either way. When a
 * remembered user exists (and `showUserPicture` is on) the button reads
 * "Continue as {name}" with the avatar and the e-mail. The personalised
 * content only appears after hydration, so SSR markup always matches.
 */
@Component({
    selector: 'button[posty5SignInButton]',
    standalone: true,
    imports: [NgTemplateOutlet],
    templateUrl: './posty5-sign-in-button.component.html',
    styleUrls: ['./posty5-sign-in-button.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        type: 'button',
        '[class]': 'hostClasses()',
        '[style.width]': 'cssWidth()',
        '[attr.aria-label]': 'ariaLabel()',
        '[attr.aria-busy]': 'busy() || null',
        '[attr.lang]': 'activeLocale()',
        '[attr.dir]': 'direction()',
        '[disabled]': 'disabled() || busy()',
        '(click)': 'onClick($event)',
    },
})
export class Posty5SignInButtonComponent {
    /** `filled` (Posty5 blue, default), `outline` (white) or `filledDark`. */
    readonly theme = input<Posty5ButtonTheme>(Posty5ButtonDefaults.theme);
    /** `large` (44px, default), `medium` (40px) or `small` (32px). */
    readonly size = input<Posty5ButtonSize>(Posty5ButtonDefaults.size);
    /** `rectangular` (default), `pill`, `circle` or `square` (the last two show the logo only). */
    readonly shape = input<Posty5ButtonShape>(Posty5ButtonDefaults.shape);
    /** `continue_with` (default), `signin_with`, `signup_with` or `signin`. */
    readonly text = input<Posty5ButtonText>(Posty5ButtonDefaults.text);
    /** `left` (logo at the start edge, default) or `center` (logo next to the label). */
    readonly logoAlignment = input<Posty5LogoAlignment>(Posty5ButtonDefaults.logoAlignment);
    /** A number is pixels (`240`), a string is any CSS width (`'100%'`, `'20rem'`). */
    readonly width = input<string | number | null | undefined>(undefined);
    /** Replaces the whole label (also on the personalised button). */
    readonly label = input<string | null | undefined>(undefined);
    /** Overrides the config / `<html lang>` locale for this button. */
    readonly locale = input<string | null | undefined>(undefined);
    /** Show "Continue as {name}" + avatar + e-mail when a remembered user exists. Default `true`. */
    readonly showUserPicture = input<boolean, unknown>(Posty5ButtonDefaults.showUserPicture, { transform: booleanAttribute });
    /** No built-in styles at all: only the structure and the `posty5-btn*` classes. */
    readonly unstyled = input<boolean, unknown>(Posty5ButtonDefaults.unstyled, { transform: booleanAttribute });
    readonly disabled = input<boolean, unknown>(Posty5ButtonDefaults.disabled, { transform: booleanAttribute });
    /** Sent to `signIn` (where the app goes after the sign-in). */
    readonly returnUrl = input<string | undefined>(undefined);
    /** Sent to `signIn`: `consent` or `login`. */
    readonly prompt = input<Posty5Prompt | undefined>(undefined);
    /** Sent to `signIn`: maximum age of the Posty5 sign-in in seconds. */
    readonly maxAge = input<number | undefined>(undefined);
    /** `false`: only emit `(posty5Click)`, do not start the sign-in. */
    readonly autoSignIn = input<boolean, unknown>(Posty5ButtonDefaults.autoSignIn, { transform: booleanAttribute });

    /** Fires on every click (before the sign-in starts). */
    readonly posty5Click = output<IPosty5ButtonClickEvent>();

    protected readonly logo = Posty5LogoConfig;
    protected readonly intrinsicSizes = Posty5ButtonIntrinsicSizes;
    protected readonly busy = signal(false);
    protected readonly avatarFailed = signal(false);
    private readonly auth = inject(Posty5AuthService);
    private readonly config = inject(Posty5AuthConfigToken, { optional: true });
    private readonly document = inject(DOCUMENT);
    private readonly hydrated = signal(false);

    protected readonly activeLocale = computed(() =>
        resolveLocale([this.locale(), this.config?.locale, this.document.documentElement?.getAttribute('lang')], this.config?.labels),
    );
    protected readonly direction = computed(() => localeDirection(this.activeLocale()));
    protected readonly labels = computed(() => resolveLabels(this.activeLocale(), this.config?.labels));
    protected readonly iconOnly = computed(() => isIconOnlyShape(this.shape()));
    protected readonly user = computed<IPosty5RememberedUser | null>(() =>
        this.hydrated() && this.showUserPicture() && !this.iconOnly() ? this.auth.lastUser() : null,
    );
    protected readonly initial = computed(() => userInitial(this.user()));
    protected readonly labelText = computed(() => resolveButtonLabel(this.labels(), this.text(), this.label(), this.user()));
    protected readonly ariaLabel = computed(() => this.labelText());
    protected readonly cssWidth = computed(() => toCssWidth(this.width()));
    protected readonly hostClasses = computed(() =>
        buildButtonClasses({
            theme: this.theme(),
            size: this.size(),
            shape: this.shape(),
            logoAlignment: this.logoAlignment(),
            unstyled: this.unstyled(),
            personalized: !!this.user(),
            busy: this.busy(),
        }),
    );

    constructor() {
        afterNextRender(() => this.hydrated.set(true));
    }

    protected onClick(event: MouseEvent): void {
        if (this.disabled() || this.busy()) return;
        this.posty5Click.emit({ event, user: this.user() });
        if (!this.autoSignIn() || event.defaultPrevented) return;
        this.busy.set(true);
        this.auth
            .signIn({ returnUrl: this.returnUrl(), prompt: this.prompt(), maxAge: this.maxAge() })
            .catch((error) => {
                this.busy.set(false);
                console.error('[posty5] sign-in could not start', error);
            });
    }
}
