import { Posty5OAuthConfig } from './config';
import { Posty5OAuthError } from './errors';
import type { IAppUsersPage, IListAppUsersOptions, IPosty5AppUser, IPosty5AppUsersClientOptions } from './interfaces';

/**
 * The users who signed in to your app with Posty5, read from your back end
 * with an API key ATTACHED to the app (Studio → Developers Kit → OAuth apps →
 * API keys). Each user carries only what they granted your app; `sub` is the
 * same id as in their ID token.
 *
 * ```ts
 * const users = new Posty5AppUsersClient({ apiKey: process.env.POSTY5_API_KEY! });
 * const page = await users.list({ search: 'ahmed' });
 * const one = await users.get(page.items[0].sub);
 * ```
 */
export class Posty5AppUsersClient {
    private readonly apiKey: string;
    private readonly baseUrl: string;
    private readonly fetchImpl: typeof fetch;

    constructor(options: IPosty5AppUsersClientOptions) {
        if (!options?.apiKey) throw new Posty5OAuthError('config_invalid', 'apiKey is required');
        this.apiKey = options.apiKey;
        this.baseUrl = String(options.baseUrl || Posty5OAuthConfig.apiBaseUrl).replace(/\/+$/, '');
        const fetchImpl = options.fetch || (globalThis as any).fetch;
        if (typeof fetchImpl !== 'function') throw new Posty5OAuthError('config_invalid', 'No fetch available: use Node 18+ or pass options.fetch');
        this.fetchImpl = fetchImpl;
    }

    /** A page of users, newest first. Pass `nextCursor` back as `cursor` for the next page. */
    async list(options: IListAppUsersOptions = {}): Promise<IAppUsersPage> {
        const url = new URL(`${this.baseUrl}${Posty5OAuthConfig.appUsersPath}`);
        if (options.search) url.searchParams.set('search', options.search);
        if (options.pageSize) url.searchParams.set('pageSize', String(options.pageSize));
        if (options.cursor) url.searchParams.set('cursor', options.cursor);
        const result = await this.get_(url.toString());
        const p = result?.pagination || {};
        return {
            items: Array.isArray(result?.items) ? result.items : [],
            nextCursor: p.nextCursor ?? null,
            previousCursor: p.previousCursor ?? null,
            hasMore: p.hasMore === true,
            totalCount: Number(p.totalCount) || 0,
            pageSize: Number(p.pageSize) || 0,
        };
    }

    /** One user by `sub`, or null when no such user granted your app. */
    async get(sub: string): Promise<IPosty5AppUser | null> {
        if (!sub) throw new Posty5OAuthError('config_invalid', 'sub is required');
        return this.get_(`${this.baseUrl}${Posty5OAuthConfig.appUsersPath}/${encodeURIComponent(sub)}`, true);
    }

    /** GET with the API key; answers the house `result`, or null for a 404 when `nullOn404`. */
    private async get_(url: string, nullOn404 = false): Promise<any> {
        let response: Response;
        try {
            response = await this.fetchImpl(url, { headers: { 'x-api-key': this.apiKey, accept: 'application/json' }, signal: AbortSignal.timeout(Posty5OAuthConfig.requestTimeoutMs) });
        } catch (error: any) {
            throw new Posty5OAuthError('api_error', `Request to ${url} failed: ${error?.message || error}`);
        }
        if (nullOn404 && response.status === 404) return null;
        let body: any = null;
        try {
            body = await response.json();
        } catch {
            // handled below
        }
        if (!response.ok) throw new Posty5OAuthError('api_error', body?.message || `Posty5 answered ${response.status}`, { status: response.status });
        return body?.result;
    }
}
