import { HttpClient } from "@posty5/core";
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
    await client.update("sl1", update);

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

    await client.update("sl1", { baseUrl: "https://example.com", templateId, androidUrl: "" });
    await client.update("sl1", { baseUrl: "https://example.com/moved", templateId });

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

  it("requires templateId at compile time (TP-D7)", () => {
    const { http } = stubHttp();
    const client = new ShortLinkClient(http);
    // Never called: the assertions are the two `@ts-expect-error` lines, which
    // fail the type check of this file if templateId ever becomes optional.
    const compileOnly = () => {
      // @ts-expect-error templateId is required on create
      void client.create({ baseUrl: "https://example.com" });
      // @ts-expect-error templateId is required on update
      void client.update("sl1", { baseUrl: "https://example.com" });
    };
    expect(typeof compileOnly).toBe("function");
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
    it("should update short link", async () => {
      const newName = "Updated Short Link - " + Date.now();
      const result = await client.update(createdId, {
        name: newName,
        baseUrl: "https://guide.posty5.com",
        templateId,
      });

      expect(result._id).toBe(createdId);
    });

    it("should update target URL", async () => {
      const result = await client.update(createdId, {
        baseUrl: "https://updated.posty5.com",
        templateId,
      });

      expect(result._id).toBe(createdId);
    });
  });

  describe("S13 — deep links, landing page, refId filter", () => {
    const refId = "TP-S13-" + Date.now();
    const appUrl = "myapp://item/1";
    let s13Id = "";

    afterAll(async () => {
      if (s13Id) {
        await client.delete(s13Id).catch(() => undefined);
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
      await client.update(s13Id, { name: "TP S13 renamed", baseUrl: "https://posty5.com", templateId, pageInfo: { title: "TP S13", description: "Kept" } });

      const fetched = await client.get(s13Id);
      expect(fetched.isEnableLandingPage).toBe(true);
      expect(fetched.androidUrl).toBe(appUrl);
    });

    it("re-derives the deep links when only baseUrl changes", async () => {
      await client.update(s13Id, { baseUrl: "https://guide.posty5.com", templateId, pageInfo: { title: "TP S13", description: "Moved" } });

      const fetched = await client.get(s13Id);
      expect(fetched.baseUrl).toBe("https://guide.posty5.com");
      expect(fetched.androidUrl ?? "").not.toBe(appUrl);
      expect(fetched.isSupportAndroidDeepUrl).toBe(!!fetched.androidUrl);
    });

    it("clears a deep link sent as an empty string", async () => {
      await client.update(s13Id, { baseUrl: "https://guide.posty5.com", templateId, iosUrl: "myapp://item/2", pageInfo: { title: "TP S13", description: "Set" } });
      expect((await client.get(s13Id)).iosUrl).toBe("myapp://item/2");

      await client.update(s13Id, { baseUrl: "https://guide.posty5.com", templateId, iosUrl: "", pageInfo: { title: "TP S13", description: "Cleared" } });
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

  describe("DELETE", () => {
    it("should delete short link", async () => {
      await client.delete(createdId);

      // Verify deletion
      await expect(client.get(createdId)).rejects.toThrow();
    });
  });
});
