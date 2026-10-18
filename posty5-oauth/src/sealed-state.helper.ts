import { createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes } from 'node:crypto';
import { Posty5OAuthConfig } from './config';
import { Posty5OAuthError } from './errors';
import type { ISealedLoginState } from './interfaces';

/** AES-256-GCM key for login-link states, derived from the client secret (HKDF-SHA256). */
function stateKey(clientSecret: string): Buffer {
    const c = Posty5OAuthConfig.loginLink;
    return Buffer.from(hkdfSync('sha256', Buffer.from(clientSecret, 'utf8'), Buffer.from(c.hkdfSalt, 'utf8'), Buffer.from(c.hkdfInfo, 'utf8'), 32));
}

/** SHA-256 base64url of the browser binding value (only its hash travels in the state). */
export function bindingHash(binding: string): string {
    return createHash('sha256').update(binding, 'utf8').digest('base64url');
}

/** `state` = base64url(iv ‖ tag ‖ AES-256-GCM(JSON payload)). Opaque and tamper-proof without the secret. */
export function sealState(clientSecret: string, payload: ISealedLoginState): string {
    const c = Posty5OAuthConfig.loginLink;
    const iv = randomBytes(c.ivBytes);
    const cipher = createCipheriv('aes-256-gcm', stateKey(clientSecret), iv);
    const body = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);
    const sealed = Buffer.concat([iv, cipher.getAuthTag(), body]).toString('base64url');
    if (sealed.length > c.maxStateLength) {
        throw new Posty5OAuthError('config_invalid', `The login link state is too long (${sealed.length} > ${c.maxStateLength}); keep returnTo and data small`);
    }
    return sealed;
}

/** The payload of a sealed state, or a `state_mismatch` error (tampered, foreign or expired). */
export function unsealState(clientSecret: string, state: string): ISealedLoginState {
    const c = Posty5OAuthConfig.loginLink;
    let payload: ISealedLoginState;
    try {
        const raw = Buffer.from(String(state || ''), 'base64url');
        const iv = raw.subarray(0, c.ivBytes);
        const tag = raw.subarray(c.ivBytes, c.ivBytes + c.tagBytes);
        const body = raw.subarray(c.ivBytes + c.tagBytes);
        const decipher = createDecipheriv('aes-256-gcm', stateKey(clientSecret), iv);
        decipher.setAuthTag(tag);
        payload = JSON.parse(Buffer.concat([decipher.update(body), decipher.final()]).toString('utf8'));
    } catch {
        throw new Posty5OAuthError('state_mismatch', 'The login link state is invalid');
    }
    if (payload?.v !== c.version) throw new Posty5OAuthError('state_mismatch', 'Unknown login link version');
    if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Posty5OAuthError('state_mismatch', 'The login link has expired');
    }
    return payload;
}
