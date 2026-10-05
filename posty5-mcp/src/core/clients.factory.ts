import type { HttpClient } from "@posty5/core";
import { AccountClient } from "@posty5/account";
import { HtmlHostingClient } from "@posty5/html-hosting";
import { HtmlHostingFormSubmissionClient } from "@posty5/html-hosting-form-submission";
import { HtmlHostingVariablesClient } from "@posty5/html-hosting-variables";
import { QRCodeClient, QRCodeTemplateClient } from "@posty5/qr-code";
import { ShortLinkClient } from "@posty5/short-link";
import { SocialPublisherPostClient } from "@posty5/social-publisher-post";
import { SocialPublisherAccountClient, SocialPublisherWorkspaceClient } from "@posty5/social-publisher-workspace";
import { StoreClient } from "@posty5/store";
import type { IPosty5Clients } from "../interfaces/clients.interface";

/**
 * Every SDK client over one HttpClient. Built per call — the client carries
 * that call's agent header — and lazily, so a call pays only for the client it
 * uses.
 */
export function createClients(http: HttpClient): IPosty5Clients {
  const cache = new Map<keyof IPosty5Clients, unknown>();
  const lazy = <K extends keyof IPosty5Clients>(key: K, build: () => IPosty5Clients[K]): IPosty5Clients[K] => {
    if (!cache.has(key)) cache.set(key, build());
    return cache.get(key) as IPosty5Clients[K];
  };
  return {
    get account() { return lazy("account", () => new AccountClient(http)); },
    get shortLinks() { return lazy("shortLinks", () => new ShortLinkClient(http)); },
    get qrCodes() { return lazy("qrCodes", () => new QRCodeClient(http)); },
    get qrTemplates() { return lazy("qrTemplates", () => new QRCodeTemplateClient(http)); },
    get htmlPages() { return lazy("htmlPages", () => new HtmlHostingClient(http)); },
    get htmlVariables() { return lazy("htmlVariables", () => new HtmlHostingVariablesClient(http)); },
    get formSubmissions() { return lazy("formSubmissions", () => new HtmlHostingFormSubmissionClient(http)); },
    get workspaces() { return lazy("workspaces", () => new SocialPublisherWorkspaceClient(http)); },
    get socialAccounts() { return lazy("socialAccounts", () => new SocialPublisherAccountClient(http)); },
    get posts() { return lazy("posts", () => new SocialPublisherPostClient(http)); },
    get store() { return lazy("store", () => new StoreClient(http)); },
  };
}
