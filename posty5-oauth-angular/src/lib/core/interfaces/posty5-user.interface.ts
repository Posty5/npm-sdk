/** What the button needs to say "Continue as ...". Kept in `localStorage`. */
export interface IPosty5RememberedUser {
    name?: string;
    picture?: string;
    /** Masked unless `maskRememberedEmail: false`. */
    email?: string;
}

/** Verified ID-token claims. `sub` is pairwise: stable for this app, unrelated to other apps. */
export interface IPosty5IdTokenClaims {
    iss: string;
    sub: string;
    aud: string | string[];
    exp: number;
    iat: number;
    auth_time?: number;
    nonce?: string;
    azp?: string;
    name?: string;
    picture?: string;
    email?: string;
    email_verified?: boolean;
    [claim: string]: unknown;
}
