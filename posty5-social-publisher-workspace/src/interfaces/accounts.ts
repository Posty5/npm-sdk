/** A platform a social account can be connected on. */
export type SocialAccountPlatform = "youtube" | "tiktok" | "facebook" | "instagram" | "threads" | "twitter";

/** `authenticationExpired`: reconnect the account in the Posty5 dashboard before publishing to it. */
export type SocialAccountStatus = "active" | "inactive" | "authenticationExpired";

/** Filters for `SocialPublisherAccountClient.list`. */
export interface ISocialAccountListParams {
  platform?: SocialAccountPlatform;
  status?: SocialAccountStatus;
  /** Contains, case-insensitive. */
  name?: string;
}

/** A connected social account as lists return it. Never carries a platform token. */
export interface ISocialAccountSummary {
  /** The `accountId` the account-targeted post methods take. */
  _id: string;
  platform: SocialAccountPlatform;
  status: SocialAccountStatus;
  /** Instagram only: how the account was connected. */
  authSource?: "facebook_page" | "instagram_login";
  name: string;
  thumbnail?: string;
  link?: string;
  createdAt: string;
}

/** One account's details: its platform profile and publishing defaults. */
export interface ISocialAccountDetails extends ISocialAccountSummary {
  defaultPostSettings?: Record<string, unknown>;
  defaultComments?: Record<string, unknown>[];
  [platformBlock: string]: unknown;
}

/** One row of `SocialPublisherAccountClient.lookup`. */
export interface ISocialAccountLookupItem {
  _id: string;
  name: string;
  data?: { img?: string };
}
