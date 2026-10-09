import { LinkCampaignClient } from "@posty5/short-link";
import { HttpClient } from "@posty5/core";
import { TEST_CONFIG, createdResources } from "./setup";
import { stubHttp } from "./helpers/stub-http.helper";

/** `LinkCampaignClient` (short link controls, S10). */
describe("Link Campaign SDK — payloads (offline)", () => {
  it("pins routes, bodies and the detach flag", async () => {
    const { http, calls } = stubHttp();
    const client = new LinkCampaignClient(http);

    await client.list({ archived: false, term: "spring" }, { page: 1, pageSize: 10 });
    await client.get("c1");
    await client.create({ name: "Spring", color: "green", utm: { source: "news" } });
    await client.update("c1", { archived: true }, 0);
    await client.delete("c1", 0, { detach: true });
    await client.delete("c2", 0);

    expect(calls[0]).toEqual({ method: "GET", url: "/api/link-campaign", params: { archived: false, term: "spring", page: 1, pageSize: 10 } });
    expect(calls[1]).toEqual({ method: "GET", url: "/api/link-campaign/c1", params: undefined });
    expect(calls[2]).toEqual({
      method: "POST",
      url: "/api/link-campaign",
      body: { name: "Spring", color: "green", utm: { source: "news" }, createdFrom: "npmPackage" },
    });
    expect(calls[3]).toEqual({ method: "PUT", url: "/api/link-campaign/c1", body: { archived: true } });
    expect(calls[4]).toEqual({ method: "DELETE", url: "/api/link-campaign/c1", params: { detach: true } });
    expect(calls[5]).toEqual({ method: "DELETE", url: "/api/link-campaign/c2", params: undefined });
  });
});

const describeLive = TEST_CONFIG.apiKey ? describe : describe.skip;

describeLive("Link Campaign SDK (live)", () => {
  const client = new LinkCampaignClient(new HttpClient({ apiKey: TEST_CONFIG.apiKey, baseUrl: TEST_CONFIG.baseUrl }));
  let id = "";

  afterAll(async () => {
    for (const campaignId of createdResources.linkCampaigns) {
      await client.delete(campaignId, (await client.get(campaignId)).__v, { detach: true }).catch(() => undefined);
    }
  });

  it("creates, reads, updates, lists and deletes with detach", async () => {
    const created = await client.create({ name: `SDK test ${Date.now()}`, utm: { source: "sdk" } });
    id = created._id;
    createdResources.linkCampaigns.push(id);

    const details = await client.get(id);
    expect(details.linkCount).toBe(0);
    expect(details.utm?.source).toBe("sdk");

    const updated = await client.update(id, { archived: true }, details.__v);
    expect(updated.isArchived).toBe(true);

    const archived = await client.list({ archived: true });
    expect(archived.items.some((c) => c._id === id)).toBe(true);

    await client.delete(id, updated.__v, { detach: true });
    createdResources.linkCampaigns.splice(createdResources.linkCampaigns.indexOf(id), 1);
  });
});
