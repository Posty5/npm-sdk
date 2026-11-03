import { Posty5AuthDefaults } from '../config/posty5-auth.config';
import type { IPosty5JsonWebKey, IPosty5PkcePair } from '../interfaces';
import { base64UrlEncode } from './posty5-auth.helper';

/**
 * WebCrypto helpers. Every function takes the `Crypto` object so callers
 * decide where it comes from; the services only call them in the browser
 * (`isPlatformBrowser`).
 */

/** `bytes` random bytes, base64url (43 characters for 32 bytes). */
export function randomUrlSafe(crypto: Crypto, bytes: number = Posty5AuthDefaults.randomBytes): string {
    const buffer = new Uint8Array(bytes);
    crypto.getRandomValues(buffer);
    return base64UrlEncode(buffer);
}

/** base64url(SHA-256(verifier)): the RFC 7636 S256 challenge. */
export async function createCodeChallenge(crypto: Crypto, codeVerifier: string): Promise<string> {
    const digest = await crypto.subtle.digest(Posty5AuthDefaults.digestAlgorithm, new TextEncoder().encode(codeVerifier));
    return base64UrlEncode(new Uint8Array(digest));
}

/** A new PKCE S256 pair. */
export async function createPkcePair(crypto: Crypto): Promise<IPosty5PkcePair> {
    const codeVerifier = randomUrlSafe(crypto);
    return { codeVerifier, codeChallenge: await createCodeChallenge(crypto, codeVerifier) };
}

/** Does `signature` verify `signingInput` with this RSA JWK (RS256)? */
export async function verifyRs256(crypto: Crypto, jwk: IPosty5JsonWebKey, signingInput: string, signature: Uint8Array): Promise<boolean> {
    const key = await crypto.subtle.importKey(
        'jwk',
        { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: Posty5AuthDefaults.signingAlg, ext: true },
        Posty5AuthDefaults.webCryptoAlgorithm,
        false,
        ['verify'],
    );
    return crypto.subtle.verify(Posty5AuthDefaults.webCryptoAlgorithm.name, key, signature, new TextEncoder().encode(signingInput));
}
