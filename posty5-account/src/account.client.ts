import { HttpClient } from "@posty5/core";
import { ACCOUNT_PATHS } from "./config/account.config";
import {
  IAccountCreditsResponse,
  IAccountCurrent,
  ICreditUsageFilters,
  ICreditUsagePage,
  ICreditUsagePaging,
  ICreditUsageSummary,
  ICreditUsageSummaryFilters,
  ICreditTransfer,
  ICreditTransferEligibility,
  ICreditTransferFilters,
  ICreditTransferPage,
  IOperationCosts,
} from "./interfaces";

/**
 * Who an API key is and what it can spend.
 *
 * `getCurrent()` is the cheapest way to validate a key: a revoked or unknown
 * key answers 401 (`AuthenticationError`). Prices change — read them from
 * `getOperationCosts()` rather than hard-coding them.
 *
 * @example
 * ```ts
 * const account = new AccountClient(new HttpClient({ apiKey }));
 * const me = await account.getCurrent();
 * console.log(me.user.userName, me.plan?.key, me.credits.spendable);
 * ```
 */
export class AccountClient {
  private http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  /** The calling key, its owner, plan, credits and MCP settings. API keys only — a browser session gets a 400. */
  async getCurrent(): Promise<IAccountCurrent> {
    const response = await this.http.get<IAccountCurrent>(ACCOUNT_PATHS.current);
    return response.result!;
  }

  /** The owner's credit balance and per-feature usage. */
  async getCredits(): Promise<IAccountCreditsResponse> {
    const response = await this.http.get<IAccountCreditsResponse>(ACCOUNT_PATHS.credits);
    return response.result!;
  }

  /** The owner's credit history, newest first — including what staff members spent. */
  async getCreditUsage(filters?: ICreditUsageFilters, paging?: ICreditUsagePaging): Promise<ICreditUsagePage> {
    const response = await this.http.get<ICreditUsagePage>(ACCOUNT_PATHS.creditUsage, { params: { ...filters, ...paging } });
    return response.result!;
  }

  /** The current balance, and totals over the filtered history under `range`. */
  async getCreditUsageSummary(filters?: ICreditUsageSummaryFilters): Promise<ICreditUsageSummary> {
    const response = await this.http.get<ICreditUsageSummary>(ACCOUNT_PATHS.creditUsageSummary, { params: { ...filters } });
    return response.result!;
  }

  /**
   * Can the key owner send credits to another Posty5 account (Business plan
   * only), how many, and can they still receive one (a Free account can receive
   * one transfer).
   *
   * Read-only: sending a transfer is done from the Posty5 dashboard by a
   * signed-in person — an API key cannot send (the API answers 403
   * `SESSION_REQUIRED`).
   */
  async getCreditTransferEligibility(): Promise<ICreditTransferEligibility> {
    const response = await this.http.get<ICreditTransferEligibility>(ACCOUNT_PATHS.creditTransferEligibility);
    return response.result!;
  }

  /** Credits the key owner sent to or received from other Posty5 accounts, newest first. Counterparties are masked. */
  async listCreditTransfers(filters?: ICreditTransferFilters, paging?: ICreditUsagePaging): Promise<ICreditTransferPage> {
    const response = await this.http.get<ICreditTransferPage>(ACCOUNT_PATHS.creditTransfers, { params: { ...filters, ...paging } });
    return response.result!;
  }

  /** One transfer the key owner sent or received. A transfer they are not a party to is a 404. */
  async getCreditTransfer(id: string): Promise<ICreditTransfer> {
    const response = await this.http.get<ICreditTransfer>(`${ACCOUNT_PATHS.creditTransfers}/${encodeURIComponent(id)}`);
    return response.result!;
  }

  /** The live price of every paid operation, grouped by module. Public — needs no key. */
  async getOperationCosts(activeOnly = true): Promise<IOperationCosts> {
    const response = await this.http.get<IOperationCosts>(ACCOUNT_PATHS.operationCosts, { params: { activeOnly: String(activeOnly) } });
    return response.result!;
  }
}
