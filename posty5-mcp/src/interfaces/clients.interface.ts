import type { AccountClient } from "@posty5/account";
import type { HtmlHostingClient } from "@posty5/html-hosting";
import type { HtmlHostingFormSubmissionClient } from "@posty5/html-hosting-form-submission";
import type { HtmlHostingVariablesClient } from "@posty5/html-hosting-variables";
import type { QRCodeClient, QRCodeTemplateClient } from "@posty5/qr-code";
import type { LinkCampaignClient, ShortLinkClient } from "@posty5/short-link";
import type { SocialPublisherPostClient } from "@posty5/social-publisher-post";
import type { SocialPublisherAccountClient, SocialPublisherWorkspaceClient } from "@posty5/social-publisher-workspace";
import type { StoreClient } from "@posty5/store";

/** The SDK clients a tool runs against — built per call over that call's HttpClient. */
export interface IPosty5Clients {
  account: AccountClient;
  shortLinks: ShortLinkClient;
  linkCampaigns: LinkCampaignClient;
  qrCodes: QRCodeClient;
  qrTemplates: QRCodeTemplateClient;
  htmlPages: HtmlHostingClient;
  htmlVariables: HtmlHostingVariablesClient;
  formSubmissions: HtmlHostingFormSubmissionClient;
  workspaces: SocialPublisherWorkspaceClient;
  socialAccounts: SocialPublisherAccountClient;
  posts: SocialPublisherPostClient;
  store: StoreClient;
}
