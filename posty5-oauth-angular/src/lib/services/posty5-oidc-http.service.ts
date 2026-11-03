import { Injectable } from '@angular/core';
import { Posty5AuthDefaults } from '../core/config/posty5-auth.config';
import { Posty5AuthError } from '../core/errors/posty5-auth.error';
import { createTimeoutSignal } from '../core/helpers/posty5-auth.helper';
import type { IPosty5CodeHandlerPayload, IPosty5Jwks, IPosty5TokenResponse, Posty5AuthErrorCode } from '../core/interfaces';

/**
 * The HTTP calls of Login with Posty5 (discovery, JWKS, token endpoint, the
 * app's code handler). It uses `fetch` directly, not `HttpClient`, so app
 * interceptors never add the app's own `Authorization` header to Posty5's
 * endpoints. No state: caching lives in `Posty5AuthService`. Only called in
 * the browser.
 */
@Injectable({ providedIn: 'root' })
export class Posty5OidcHttpService {
    /** `GET {issuer}/.well-known/openid-configuration` (unchecked body). */
    getDiscovery(issuer: string): Promise<unknown> {
        return this.getJson(`${issuer}${Posty5AuthDefaults.discoveryPath}`, 'discovery_failed');
    }

    /** `GET jwks_uri`. */
    async getJwks(jwksUri: string): Promise<IPosty5Jwks> {
        const body = (await this.getJson(jwksUri, 'jwks_failed')) as IPosty5Jwks | null;
        if (!body || !Array.isArray(body.keys)) throw new Posty5AuthError('jwks_failed', 'The JWKS has no keys');
        return body;
    }

    /** `POST token_endpoint` as a public client (form body, no secret). */
    async exchangeCode(tokenEndpoint: string, form: URLSearchParams): Promise<IPosty5TokenResponse> {
        const response = await this.send(
            tokenEndpoint,
            {
                method: 'POST',
                headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
                body: form.toString(),
                credentials: 'omit',
                redirect: 'error',
            },
            'token_error',
        );
        const json = (await this.readJson(response, 'token_error')) as Record<string, unknown> | null;
        if (!response.ok) {
            throw new Posty5AuthError('token_error', String(json?.['error_description'] || `Token request failed (${response.status})`), {
                providerError: typeof json?.['error'] === 'string' ? (json['error'] as string) : undefined,
                status: response.status,
            });
        }
        if (typeof json?.['id_token'] !== 'string' || typeof json?.['access_token'] !== 'string') {
            throw new Posty5AuthError('token_error', 'The token response has no id_token or access_token');
        }
        return json as IPosty5TokenResponse;
    }

    /** `POST codeHandlerUrl` with the JSON payload and the app's cookies; returns the app's JSON. */
    async postCodeHandler<TResponse>(url: string, payload: IPosty5CodeHandlerPayload): Promise<TResponse> {
        const response = await this.send(
            url,
            {
                method: 'POST',
                headers: { 'content-type': 'application/json', accept: 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include',
            },
            'code_handler_failed',
        );
        const text = await response.text();
        let json: unknown = null;
        try {
            json = text ? JSON.parse(text) : null;
        } catch {
            json = null;
        }
        if (!response.ok) {
            const message = (json as Record<string, unknown> | null)?.['message'];
            throw new Posty5AuthError('code_handler_failed', typeof message === 'string' ? message : `The code handler answered ${response.status}`, {
                status: response.status,
            });
        }
        return json as TResponse;
    }

    private async getJson(url: string, code: Posty5AuthErrorCode): Promise<unknown> {
        const response = await this.send(url, { headers: { accept: 'application/json' }, credentials: 'omit', redirect: 'error' }, code);
        if (!response.ok) throw new Posty5AuthError(code, `GET ${url} answered ${response.status}`, { status: response.status });
        return this.readJson(response, code);
    }

    private async send(url: string, init: RequestInit, code: Posty5AuthErrorCode): Promise<Response> {
        try {
            return await fetch(url, { ...init, signal: createTimeoutSignal(Posty5AuthDefaults.requestTimeoutMs) });
        } catch (error) {
            throw new Posty5AuthError(code, `Request to ${url} failed: ${(error as Error)?.message || String(error)}`);
        }
    }

    private async readJson(response: Response, code: Posty5AuthErrorCode): Promise<unknown> {
        try {
            return await response.json();
        } catch {
            throw new Posty5AuthError(code, `Invalid JSON (${response.status})`, { status: response.status });
        }
    }
}
