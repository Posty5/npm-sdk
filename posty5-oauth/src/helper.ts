import { createHash, createPublicKey, createVerify, randomBytes, timingSafeEqual } from 'node:crypto';
import { Posty5OAuthConfig } from './config';
import { Posty5OAuthError } from './errors';
import type { IJsonWebKey, IPkcePair } from './interfaces';

/** `bytes` random bytes, base64url (43 characters for 32 bytes). */
export function randomUrlSafe(bytes: number = Posty5OAuthConfig.randomBytes): string {
    return randomBytes(bytes).toString('base64url');
}

/** RFC 7636 S256 pair. */
export function createPkcePair(): IPkcePair {
    const codeVerifier = randomUrlSafe();
    const codeChallenge = createHash('sha256').update(codeVerifier, 'ascii').digest('base64url');
    return { codeVerifier, codeChallenge };
}

/** Constant-time string equality (for `state`). */
export function safeEqual(a: string, b: string): boolean {
    const x = Buffer.from(String(a), 'utf8');
    const y = Buffer.from(String(b), 'utf8');
    return x.length === y.length && x.length > 0 && timingSafeEqual(x, y);
}

/** RFC 6749 §2.3.1: id and secret are form-urlencoded, then joined and base64'd. */
export function basicAuthHeader(clientId: string, clientSecret: string): string {
    const encode = (value: string) => encodeURIComponent(value).replace(/%20/g, '+');
    return `Basic ${Buffer.from(`${encode(clientId)}:${encode(clientSecret)}`, 'utf8').toString('base64')}`;
}

/** The three parts of a compact JWS, decoded (signature not checked). */
export function decodeJwt(token: string): { header: Record<string, any>; payload: Record<string, any>; signingInput: string; signature: Buffer } {
    const parts = String(token || '').split('.');
    if (parts.length !== 3) throw new Posty5OAuthError('id_token_invalid', 'The ID token is not a JWT');
    try {
        return {
            header: JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8')),
            payload: JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')),
            signingInput: `${parts[0]}.${parts[1]}`,
            signature: Buffer.from(parts[2], 'base64url'),
        };
    } catch {
        throw new Posty5OAuthError('id_token_invalid', 'The ID token could not be decoded');
    }
}

/** Does `signature` verify `signingInput` with this RSA JWK (RS256)? */
export function verifyRs256(jwk: IJsonWebKey, signingInput: string, signature: Buffer): boolean {
    const key = createPublicKey({ key: { kty: jwk.kty, n: jwk.n, e: jwk.e } as any, format: 'jwk' });
    return createVerify('RSA-SHA256').update(signingInput).verify(key, signature);
}

/** Seconds since the epoch. */
export function nowSeconds(): number {
    return Math.floor(Date.now() / 1000);
}

/** The issuer without a trailing slash. */
export function normalizeIssuer(issuer: string): string {
    return String(issuer || '').replace(/\/+$/, '');
}
