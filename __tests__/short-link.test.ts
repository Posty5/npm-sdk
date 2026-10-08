import { ConflictError, HttpClient } from "@posty5/core";
import { ICreateShortLinkRequest, IListParams, IUpdateShortLinkRequest, ShortLinkClient } from "@posty5/short-link";
import { TEST_CONFIG, createdResources } from "./setup";
import { stubHttp } from "./helpers/stub-http.helper";
const templateId = "698a268af42b052d15e8f93c";

/**
 * `@posty5/short-link`.
 *
 * The offline part pins the payloads with a stub standing in for `HttpClient`
 * (the pattern `store-suppliers.test.ts` uses). The live part runs against the
 * API in `setup.ts` and only when `POSTY5_API_KEY` is set; its S13 block
 * (deep links, landing page kept on update) needs the API's link-qr truth
 * pass deployed there.
 */

describe("Short Link SDK — payloads (offline)", () => {
  it("never sends isEnableMonetization on create or update, and leaves the caller's object untouched", async () => {
    const { http, calls } = stubHttp();
    const client = new ShortLinkClient(http);
    const create: ICreateShortLinkRequest = { baseUrl: "https://example.com", templateId, isEnableMonetization: true };
    const update: IUpdateShortLinkRequest = { baseUrl: "https://example.com", templateId, isEnableMonetization: false };

    await client.create(create);
    await client.update("sl1", update, 0);

    expect(calls[0]).toEqual({
      method: "POST",
      url: "/api/short-link",
      body: { baseUrl: "https://example.com", templateId, templateType: "user", createdFrom: "npmPackage" },
    });
    expect(calls[1]).toEqual({ method: "PUT", url: "/api/short-link/sl1", body: { baseUrl: "https://example.com", templateId } });
    expect(create.isEnableMonetization).toBe(true);
    expect(update.isEnableMonetization).toBe(false);
  });

  it("serializes the S13 fields as given", async () => {
    const { http, calls } = stubHttp();
    const client = new ShortLinkClient(http);

    await client.create({
      baseUrl: "https://example.com/item/1",
      templateId,
      isEnableLandingPage: true,
      pageInfo: { title: "Item 1", description: "Opens in the app" },
      androidUrl: "myapp://item/1",
      iosUrl: "https://apps.example.com/item/1",
      tag: "s13",
      refId: "REF-1",
    });

    expect(calls[0].body).toEqual({
      baseUrl: "https://example.com/item/1",
      templateId,
      isEnableLandingPage: true,
      pageInfo: { title: "Item 1", description: "Opens in the app" },
      androidUrl: "myapp://item/1",
      iosUrl: "https://apps.example.com/item/1",
      tag: "s13",
      refId: "REF-1",
      templateType: "user",
      createdFrom: "npmPackage",
    });
  });

  it("on update, sends an empty deep link to clear it and leaves absent keys absent", async () => {
    const { http, calls } = stubHttp();
    const client = new ShortLinkClient(http);

    await client.update("sl1", { baseUrl: "https://example.com", templateId, androidUrl: "" }, 0);
    await client.update("sl1", { baseUrl: "https://example.com/moved", templateId }, 0);

    expect(calls[0].body).toEqual({ baseUrl: "https://example.com", templateId, androidUrl: "" });
    // Absent keys stay absent so the API keeps (or, after a baseUrl change, re-derives) them.
    expect(Object.keys(calls[1].body as object).sort()).toEqual(["baseUrl", "templateId"]);
  });

  it("sends the legacy pageinfo.title filter as pageInfo.title and drops isEnableMonetization", async () => {
    const { http, calls } = stubHttp({ items: [], pagination: {} });
    const client = new ShortLinkClient(http);
    const params: IListParams = { "pageinfo.title": "Summer", isEnableMonetization: true, tag: "t" };

    await client.list(params, { page: 2, pageSize: 5 });

    expect(calls[0]).toEqual({
      method: "GET",
      url: "/api/short-link",
      params: { "pageInfo.title": "Summer", tag: "t", page: 2, pageSize: 5 },
    });
    expect(params).toEqual({ "pageinfo.title": "Summer", isEnableMonetization: true, tag: "t" });
  });

  it("prefers an explicit pageInfo.title over the legacy key", async () => {
    const { http, calls } = stubHttp({ items: [], pagination: {} });

    await new ShortLinkClient(http).list({ "pageInfo.title": "New", "pageinfo.title": "Old" });

    expect(calls[0].params).toEqual({ "pageInfo.title": "New" });
  });

  it("getAnalytics calls GET /api/short-link/:id/analytics with the serialized query (VA)", async () => {
    const answer = {
      totals: { visits: 3, uniqueVisitors: 2, botVisits: 1 },
      series: [{ date: "2026-10-01", visits: 3, uniqueVisitors: 2 }],
      breakdowns: { device: [{ key: "mobile", visits: 2, uniqueVisitors: 1 }, { key: "unknown", visits: 1, uniqueVisitors: 1 }] },
      meta: {
        from: "2026-10-01",
        to: "2026-10-31",
        interval: "day",
        timezone: "UTC",
        source: "events",
        analyticsStartedAt: "2026-10-01T00:00:00.000Z",
        locked: [{ breakdown: "country", requiredPlan: "basic" }],
        maxHistoryDays: 30,
      },
    };
    const { http, calls } = stubHttp(answer);
    const client = new ShortLinkClient(http);

    const result = await client.getAnalytics("sl1", { from: new Date("2026-10-01T00:00:00.000Z"), to: "2026-10-31", breakdown: ["country", "channel"] });
    await client.getAnalytics("sl1");

    expect(result).toEqual(answer);
    expect(calls[0]).toEqual({
      method: "GET",
      url: "/api/short-link/sl1/analytics",
      params: { from: "2026-10-01", to: "2026-10-31", breakdown: "country,channel" },
    });
    expect(calls[1]).toEqual({ method: "GET", url: "/api/short-link/sl1/analytics", params: {} });
  });

  it("statistics calls GET /api/short-link/statistics with the serialized range (VA)", async () => {
    const answer = {
      range: { from: "2026-09-29T00:00:00.000Z", to: "2026-10-05T23:59:59.999Z", period: "7d" },
      data: {
        totals: { totalLinks: 2, totalVisitors: 40, avgVisitorsPerLink: 20, visitsInRange: 5, uniqueVisitorsInRange: 4, botVisitsInRange: 1 },
        daily: [{ _id: "2026-10-01", createdCount: 1, visitorsSum: 5 }],
        topLinks: [{ _id: "sl1", baseUrl: "https://example.com", shortLinkId: "abc", createdAt: "2026-10-01T10:00:00.000Z", visitsInRange: 5 }],
      },
    };
    const { http, calls } = stubHttp(answer);
    const client = new ShortLinkClient(http);

    const result = await client.statistics({ period: "7d" });
    await client.statistics({ from: new Date("2026-10-01T00:00:00.000Z"), to: "2026-10-05" });
    await client.statistics();

    expect(result).toEqual(answer);
    expect(calls.map((call) => [call.method, call.url, call.params])).toEqual([
      ["GET", "/api/short-link/statistics", { period: "7d" }],
      ["GET", "/api/short-link/statistics", { from: "2026-10-01", to: "2026-10-05" }],
      ["GET", "/api/short-link/statistics", {}],
    ]);
  });

  it("requires templateId at compile time (TP-D7)", () => {
    const { http } = stubHttp();
    const client = new ShortLinkClient(http);
    // Never called: the assertions are the two `@ts-expect-error` lines, which
    // fail the type check of this file if templateId ever becomes optional.
    const compileOnly = () => {
      // @ts-expect-error templateId is required on create
      void client.create({ baseUrl: "https://example.com" });
      // @ts-expect-error templateId is required on update
      void client.update("sl1", { baseUrl: "https://example.com" }, 0);
    };
    expect(typeof compileOnly).toBe("function");
  });
});

describe("Short Link SDK — short link controls payloads (offline)", () => {
  it("sends every control field as given, keeps the deprecated tag, and joins list tags", async () => {
    const { http, calls } = stubHttp();
    const client = new ShortLinkClient(http);

    await client.create({
      baseUrl: "https://example.com",
      templateId,
      tag: "old",
      tags: ["spring", "promo"],
      campaignId: "a".repeat(24),
      access: { password: "secret1", maxVisits: 100, fallbackUrl: "https://example.com/gone" },
      routing: [{ conditions: { countries: ["DE"], devices: ["mobile"] }, targetUrl: "https://example.de" }],
      variants: [{ url: "https://a.example.com", weight: 50 }, { url: "https://b.example.com", weight: 50 }],
      utm: { source: "news", medium: "email" },
      pixels: [{ provider: "meta", id: "1234567890" }],
      pixelsConsentAcknowledged: true,
      health: { enabled: true },
    });
    expect(calls[0].body).toMatchObject({ tag: "old", tags: ["spring", "promo"], health: { enabled: true }, access: { password: "secret1" } });

    await client.list({ tags: ["spring", "promo"], campaignId: "c".repeat(24) });
    expect(calls[1].params).toMatchObject({ tags: "spring,promo", campaignId: "c".repeat(24) });

    await client.list({ tags: [] });
    expect(calls[2].params).not.toHaveProperty("tags");
  });

  it("listTags, checkHealth and setRules hit the documented routes", async () => {
    const { http, calls } = stubHttp({ baseUrl: "https://stored.example.com", templateId });
    const client = new ShortLinkClient(http);

    await client.listTags("spr");
    await client.checkHealth("sl1");
    await client.setRules("sl1", { utm: { source: "x" } }, 0);
    await client.setRules("sl2", { routing: null, baseUrl: "https://given.example.com", templateId }, 0);

    expect(calls[0]).toEqual({ method: "GET", url: "/api/short-link/tags", params: { term: "spr" } });
    expect(calls[1]).toEqual({ method: "POST", url: "/api/short-link/sl1/health-check", body: {} });
    expect(calls[2]).toMatchObject({ method: "GET", url: "/api/short-link/sl1" });
    expect(calls[3]).toEqual({ method: "PUT", url: "/api/short-link/sl1", body: { utm: { source: "x" }, baseUrl: "https://stored.example.com", templateId } });
    expect(calls[4]).toEqual({ method: "PUT", url: "/api/short-link/sl2", body: { routing: null, baseUrl: "https://given.example.com", templateId } });
  });
});

describe("Short Link SDK — controls (live)", () => {
  const live = TEST_CONFIG.apiKey ? it : it.skip;
  const client = new ShortLinkClient(new HttpClient({ apiKey: TEST_CONFIG.apiKey, baseUrl: TEST_CONFIG.baseUrl }));

  live("creates with controls, never returns the password, and setRules leaves other sections", async () => {
    const created = await client.create({
      baseUrl: "https://example.com/controls",
      templateId,
      tags: ["sdk-controls"],
      access: { password: "secret1" },
      routing: [{ conditions: { countries: ["DE"] }, targetUrl: "https://example.de" }],
      variants: [{ url: "https://a.example.com", weight: 1 }, { url: "https://b.example.com", weight: 1 }],
      utm: { source: "sdk" },
    });
    createdResources.shortLinks.push(created._id);

    const details = await client.get(created._id);
    expect(details.access?.hasPassword).toBe(true);
    expect(details.access).not.toHaveProperty("password");
    expect(details.tags).toEqual(["sdk-controls"]);
    expect(details.routing).toHaveLength(1);

    const after = await client.setRules(created._id, { utm: { source: "changed" } }, details.__v);
    expect(after.utm?.source).toBe("changed");
    expect(after.routing).toHaveLength(1);
    expect(after.variants).toHaveLength(2);

    expect(await client.listTags("sdk-")).toContain("sdk-controls");
  });

  live("queues a health check", async () => {
    const id = createdResources.shortLinks[createdResources.shortLinks.length - 1];
    await expect(client.checkHealth(id)).resolves.toBeUndefined();
  });
});

const describeLive = TEST_CONFIG.apiKey ? describe : describe.skip;

describeLive("Short Link SDK", () => {
  let httpClient: HttpClient;
  let client!: ShortLinkClient;
  let createdId: string;

  beforeAll(() => {
    httpClient = new HttpClient({
      apiKey: TEST_CONFIG.apiKey,
      baseUrl: TEST_CONFIG.baseUrl,
      debug: true,
    });
    client = new ShortLinkClient(httpClient);
  });

  describe("CREATE", () => {
    it("should create a short link", async () => {
      const result = await client.create({
        name: "Test Short Link - " + Date.now(),
        baseUrl: "https://posty5.com",
        templateId,
      });

      expect(result._id).toBeDefined();
      expect(result.shorterLink).toBeDefined();
      expect(result.baseUrl).toBe("https://posty5.com");

      createdId = result._id;
      createdResources.shortLinks.push(createdId);
    });

    it("should create short link with custom slug", async () => {
      const customSlug = "test-" + Date.now();
      const result = await client.create({
        name: "Custom Slug Link",
        baseUrl: "https://example.com",
        customLandingId: customSlug,
        templateId,
      });

      expect(result._id).toBeDefined();
      expect(result.shorterLink).toContain(customSlug);
      createdResources.shortLinks.push(result._id);
    });

    it("should create short link with tag and refId", async () => {
      const result = await client.create({
        name: "Tagged Link",
        baseUrl: "https://example.com",
        tag: "test-tag",
        refId: "REF-" + Date.now(),
        templateId,
      });

      expect(result._id).toBeDefined();
      createdResources.shortLinks.push(result._id);
    });
  });

  describe("GET BY ID", () => {
    it("should get short link by ID", async () => {
      const result = await client.get(createdId);

      expect(result._id).toBe(createdId);
      expect(result.shorterLink).toBeDefined();
      expect(result.baseUrl).toBeDefined();
    });

    it("should fail with invalid ID", async () => {
      await expect(client.get("invalid-id-123")).rejects.toThrow();
    });
  });

  describe("GET LIST", () => {
    it("should get list of short links", async () => {
      const result = await client.list(
        {},
        {
          page: 1,
          pageSize: 10,
        },
      );

      expect(result.items).toBeInstanceOf(Array);
      expect(result.pagination.totalCount).toBeGreaterThanOrEqual(0);
    });

    it("should support search", async () => {
      const result = await client.list(
        {
          name: "test",
        },
        {
          page: 1,
          pageSize: 10,
        },
      );

      expect(result.items).toBeInstanceOf(Array);
    });

    it("should filter by tag", async () => {
      const result = await client.list(
        {
          tag: "test-tag",
        },
        {
          page: 1,
          pageSize: 10,
        },
      );

      expect(result.items).toBeInstanceOf(Array);
    });
  });

  describe("UPDATE", () => {
    it("should update short link with the current version, and __v goes up", async () => {
      const before = await client.get(createdId);
      const newName = "Updated Short Link - " + Date.now();
      const result = await client.update(createdId, {
        name: newName,
        baseUrl: "https://guide.posty5.com",
        templateId,
      }, before.__v);

      expect(result._id).toBe(createdId);
      expect(result.__v).toBeGreaterThan(before.__v);
    });

    it("chains a second update with the returned __v", async () => {
      const before = await client.get(createdId);
      const first = await client.update(createdId, { baseUrl: "https://updated.posty5.com", templateId }, before.__v);
      const second = await client.update(createdId, { baseUrl: "https://guide.posty5.com", templateId }, first.__v);

      expect(second._id).toBe(createdId);
      expect(second.__v).toBeGreaterThan(first.__v);
    });

    it("throws ConflictError with currentVersion on a stale version", async () => {
      const current = await client.get(createdId);
      const stale = current.__v - 1 >= 0 ? current.__v - 1 : current.__v + 100;
      const error = await client.update(createdId, { baseUrl: "https://guide.posty5.com", templateId }, stale).catch((e) => e);

      expect(error).toBeInstanceOf(ConflictError);
      expect(error.currentVersion).toBe(current.__v);
    });
  });

  describe("S13 — deep links, landing page, refId filter", () => {
    const refId = "TP-S13-" + Date.now();
    const appUrl = "myapp://item/1";
    let s13Id = "";

    afterAll(async () => {
      if (s13Id) {
        await client.delete(s13Id, (await client.get(s13Id)).__v).catch(() => undefined);
      }
    });

    it("stores a manual Android/iOS URL and returns it to the owner", async () => {
      const created = await client.create({
        name: "TP S13 deep links",
        baseUrl: "https://posty5.com",
        templateId,
        refId,
        androidUrl: appUrl,
        iosUrl: appUrl,
        isEnableLandingPage: true,
        pageInfo: { title: "TP S13", description: "Deep-link round trip" },
      });
      s13Id = created._id;

      const fetched = await client.get(s13Id);
      expect(fetched.androidUrl).toBe(appUrl);
      expect(fetched.iosUrl).toBe(appUrl);
      expect(fetched.isSupportAndroidDeepUrl).toBe(true);
      expect(fetched.isSupportIOSDeepUrl).toBe(true);
      expect(fetched.isEnableLandingPage).toBe(true);
    });

    it("keeps the landing page and the deep links when the update omits them", async () => {
      await client.update(s13Id, { name: "TP S13 renamed", baseUrl: "https://posty5.com", templateId, pageInfo: { title: "TP S13", description: "Kept" } }, (await client.get(s13Id)).__v);

      const fetched = await client.get(s13Id);
      expect(fetched.isEnableLandingPage).toBe(true);
      expect(fetched.androidUrl).toBe(appUrl);
    });

    it("re-derives the deep links when only baseUrl changes", async () => {
      await client.update(s13Id, { baseUrl: "https://guide.posty5.com", templateId, pageInfo: { title: "TP S13", description: "Moved" } }, (await client.get(s13Id)).__v);

      const fetched = await client.get(s13Id);
      expect(fetched.baseUrl).toBe("https://guide.posty5.com");
      expect(fetched.androidUrl ?? "").not.toBe(appUrl);
      expect(fetched.isSupportAndroidDeepUrl).toBe(!!fetched.androidUrl);
    });

    it("clears a deep link sent as an empty string", async () => {
      await client.update(s13Id, { baseUrl: "https://guide.posty5.com", templateId, iosUrl: "myapp://item/2", pageInfo: { title: "TP S13", description: "Set" } }, (await client.get(s13Id)).__v);
      expect((await client.get(s13Id)).iosUrl).toBe("myapp://item/2");

      await client.update(s13Id, { baseUrl: "https://guide.posty5.com", templateId, iosUrl: "", pageInfo: { title: "TP S13", description: "Cleared" } }, (await client.get(s13Id)).__v);
      const fetched = await client.get(s13Id);
      expect(fetched.iosUrl || "").toBe("");
      expect(fetched.isSupportIOSDeepUrl).toBe(false);
    });

    it("lists only the links with the requested refId, with visits, status and landing flag", async () => {
      const result = await client.list({ refId }, { page: 1, pageSize: 10 });

      expect(result.items.length).toBe(1);
      expect(result.items[0]._id).toBe(s13Id);
      expect(typeof result.items[0].numberOfVisitors).toBe("number");
      expect(result.items[0].status).toBeDefined();
      expect(result.items[0].isEnableLandingPage).toBe(true);
    });

    it("refuses a javascript: URL on baseUrl, androidUrl and iosUrl", async () => {
      await expect(client.create({ baseUrl: "javascript:alert(1)", templateId })).rejects.toThrow();
      await expect(client.create({ baseUrl: "https://posty5.com", templateId, androidUrl: "javascript:alert(1)" })).rejects.toThrow();
      await expect(client.create({ baseUrl: "https://posty5.com", templateId, iosUrl: "javascript:alert(1)" })).rejects.toThrow();
    });
  });

  // Needs the API's visit-analytics routes (VA) on the stack POSTY5_BASE_URL points at.
  describe("VA — getAnalytics", () => {
    it("answers zeros and meta.analyticsStartedAt for a new link", async () => {
      const result = await client.getAnalytics(createdId);

      expect(result.totals).toEqual({ visits: 0, uniqueVisitors: 0, botVisits: 0 });
      expect(Array.isArray(result.series)).toBe(true);
      expect(result.series.every((point) => point.visits === 0)).toBe(true);
      expect(result.meta.analyticsStartedAt).toBeDefined();
      expect(Array.isArray(result.meta.locked)).toBe(true);
    });

    it('returns every allowed breakdown for breakdown: "all" and lists the rest in meta.locked', async () => {
      const result = await client.getAnalytics(createdId, { breakdown: "all" });
      const returned = Object.keys(result.breakdowns);
      const locked = result.meta.locked.map((entry) => entry.breakdown);

      expect(returned).toEqual(expect.arrayContaining(["channel", "device"]));
      expect(returned.filter((name) => locked.includes(name as never))).toEqual([]);
    });

    it("returns the breakdowns named in an explicit list", async () => {
      const result = await client.getAnalytics(createdId, { breakdown: ["channel", "device"], interval: "week" });

      expect(Object.keys(result.breakdowns).sort()).toEqual(["channel", "device"]);
      expect(result.meta.interval).toBe("week");
    });

    it("returns the allowed breakdowns when breakdown is omitted, as for \"all\"", async () => {
      const omitted = await client.getAnalytics(createdId);
      const all = await client.getAnalytics(createdId, { breakdown: "all" });

      expect(Object.keys(omitted.breakdowns).sort()).toEqual(Object.keys(all.breakdowns).sort());
      expect([30, null]).toContain(omitted.meta.maxHistoryDays);
      expect(["events", "rollup", "mixed"]).toContain(omitted.meta.source);
      expect(omitted.meta.from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("answers 400 for an invalid interval or limit", async () => {
      await expect(client.getAnalytics(createdId, { interval: "year" as never })).rejects.toMatchObject({ statusCode: 400 });
      await expect(client.getAnalytics(createdId, { limit: 51 })).rejects.toMatchObject({ statusCode: 400 });
    });

    it("answers 400, not 404, for an unknown id", async () => {
      await expect(client.getAnalytics("000000000000000000000000")).rejects.toMatchObject({ statusCode: 400, message: "The Short Link Is Not Found" });
    });
  });

  describe("VA — statistics", () => {
    it("answers the rebuilt shape: visit totals, UTC days, top rows with visitsInRange", async () => {
      const result = await client.statistics({ period: "7d" });

      expect(result.range.period).toBe("7d");
      expect(typeof result.data.totals.visitsInRange).toBe("number");
      expect(typeof result.data.totals.uniqueVisitorsInRange).toBe("number");
      expect(typeof result.data.totals.botVisitsInRange).toBe("number");
      result.data.daily.forEach((day) => expect(day._id).toMatch(/^\d{4}-\d{2}-\d{2}$/));
      result.data.topLinks.forEach((row) => expect(row.visitsInRange).toBeGreaterThan(0));
    });
  });

  describe("DELETE", () => {
    it("should delete short link", async () => {
      await client.delete(createdId, (await client.get(createdId)).__v);

      // Verify deletion
      await expect(client.get(createdId)).rejects.toThrow();
    });
  });
});
