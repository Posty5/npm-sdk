import { HttpClient, IPaginationParams, IPaginationResponse } from "@posty5/core";
import { ISocialAccountDetails, ISocialAccountListParams, ISocialAccountLookupItem, ISocialAccountSummary, SocialAccountPlatform } from "./interfaces";

/**
 * Connected social accounts, read-only — `/api/social-publisher-account`.
 *
 * Where an `accountId` for the account-targeted post methods
 * (`createImagePostToAccount`, `publishShortVideoToAccount`, …) comes from.
 * Connecting an account is an OAuth flow done in the Posty5 dashboard, not
 * through the API. No response carries a platform token.
 *
 * With an API key whose record scope is `key`, only accounts connected with
 * that key are listed; with `account`, every account of its owner.
 */
export class SocialPublisherAccountClient {
  private http: HttpClient;
  private readonly basePath = "/api/social-publisher-account";

  constructor(http: HttpClient) {
    this.http = http;
  }

  /** List connected accounts, filtered by platform, status or name. */
  async list(params?: ISocialAccountListParams, pagination?: IPaginationParams): Promise<IPaginationResponse<ISocialAccountSummary>> {
    const response = await this.http.get<IPaginationResponse<ISocialAccountSummary>>(this.basePath, {
      params: { ...params, ...pagination },
    });
    return response.result!;
  }

  /** Look accounts up by name, optionally on one platform. One page, no cursor (`pageSize` defaults to 10). */
  async lookup(term?: string, platform?: SocialAccountPlatform, pageSize?: number): Promise<ISocialAccountLookupItem[]> {
    const params: Record<string, string | number> = {};
    if (term) params.term = term;
    if (platform) params.platform = platform;
    if (pageSize) params.pageSize = pageSize;
    const response = await this.http.get<ISocialAccountLookupItem[]>(`${this.basePath}/lookup`, { params });
    return response.result || [];
  }

  /** One account's details. */
  async get(id: string): Promise<ISocialAccountDetails> {
    const response = await this.http.get<ISocialAccountDetails>(`${this.basePath}/${id}`);
    return response.result!;
  }
}
