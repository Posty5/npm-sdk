import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Posty5StorageKeys } from '../core/config/posty5-auth.config';
import { parseStoredJson } from '../core/helpers/posty5-auth.helper';
import type { IPosty5PendingSignIn, IPosty5RememberedUser } from '../core/interfaces';

/**
 * Browser storage of the package: the one pending sign-in of the tab
 * (`sessionStorage`) and the remembered user (`localStorage`). On the server
 * every read is `null` and every write is a no-op; storage that throws
 * (private mode, blocked site data) behaves the same way.
 */
@Injectable({ providedIn: 'root' })
export class Posty5AuthStorageService {
    private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

    readPending(): IPosty5PendingSignIn | null {
        return parseStoredJson<IPosty5PendingSignIn>(this.read('session', Posty5StorageKeys.pendingSignIn));
    }

    writePending(pending: IPosty5PendingSignIn): void {
        this.write('session', Posty5StorageKeys.pendingSignIn, JSON.stringify(pending));
    }

    clearPending(): void {
        this.remove('session', Posty5StorageKeys.pendingSignIn);
    }

    readUser(): IPosty5RememberedUser | null {
        return parseStoredJson<IPosty5RememberedUser>(this.read('local', Posty5StorageKeys.rememberedUser));
    }

    writeUser(user: IPosty5RememberedUser): void {
        this.write('local', Posty5StorageKeys.rememberedUser, JSON.stringify(user));
    }

    clearUser(): void {
        this.remove('local', Posty5StorageKeys.rememberedUser);
    }

    private storage(kind: 'session' | 'local'): Storage | null {
        if (!this.isBrowser) return null;
        try {
            return kind === 'session' ? window.sessionStorage : window.localStorage;
        } catch {
            return null;
        }
    }

    private read(kind: 'session' | 'local', key: string): string | null {
        try {
            return this.storage(kind)?.getItem(key) ?? null;
        } catch {
            return null;
        }
    }

    private write(kind: 'session' | 'local', key: string, value: string): void {
        try {
            this.storage(kind)?.setItem(key, value);
        } catch {
            // Storage full or blocked: the sign-in still works, it just cannot be resumed or remembered.
        }
    }

    private remove(kind: 'session' | 'local', key: string): void {
        try {
            this.storage(kind)?.removeItem(key);
        } catch {
            // Nothing to clean up when storage is blocked.
        }
    }
}
