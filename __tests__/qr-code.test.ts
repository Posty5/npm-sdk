import { HttpClient } from "@posty5/core";
import { ICreateEmailQRCodeRequest, ICreateFreeTextQRCodeRequest, QRCodeClient } from "@posty5/qr-code";
import { TEST_CONFIG, createdResources } from "./setup";
import { stubHttp } from "./helpers/stub-http.helper";
const templateId = "698a268af42b052d15e8f93c";

/**
 * `@posty5/qr-code`.
 *
 * The offline part pins the payloads with a stub standing in for `HttpClient`
 * (the pattern `store-suppliers.test.ts` uses): the API builds the encoded
 * text from `qrCodeTarget`, so structured types send no `options.text`, and
 * `isEnableMonetization` never leaves the SDK. The live part runs against the
 * API in `setup.ts` and only when `POSTY5_API_KEY` is set; its truth-pass
 * block needs the API's link-qr truth pass deployed there.
 */

const source = { templateType: "user", createdFrom: "npmPackage" };

/** One structured-type call per method: content key, content, create and update. */
const structuredCases = [
  { type: "email", content: { email: "a@example.com", subject: "Q&A", body: "x;y" } },
  { type: "wifi", content: { name: "Net;1", authenticationType: "WPA", password: "p:w" } },
  { type: "call", content: { phoneNumber: "+1234567890" } },
  { type: "sms", content: { phoneNumber: "+1234567890" } },
  { type: "url", content: { url: "https://example.com/?a=1&b=2" } },
  { type: "geolocation", content: { latitude: 40.7128, longitude: -74.006 } },
] as const;

function createStructured(client: QRCodeClient, type: (typeof structuredCases)[number]["type"], data: any) {
  switch (type) {
    case "email":
      return client.createEmail(data);
    case "wifi":
      return client.createWifi(data);
    case "call":
      return client.createCall(data);
    case "sms":
      return client.createSMS(data);
    case "url":
      return client.createURL(data);
    case "geolocation":
      return client.createGeolocation(data);
  }
}

function updateStructured(client: QRCodeClient, type: (typeof structuredCases)[number]["type"], id: string, data: any) {
  switch (type) {
    case "email":
      return client.updateEmail(id, data);
    case "wifi":
      return client.updateWifi(id, data);
    case "call":
      return client.updateCall(id, data);
    case "sms":
      return client.updateSMS(id, data);
    case "url":
      return client.updateURL(id, data);
    case "geolocation":
      return client.updateGeolocation(id, data);
  }
}

describe("QR Code SDK — payloads (offline)", () => {
  it.each(structuredCases)("$type create and update send qrCodeTarget only — no options.text, no isEnableMonetization", async ({ type, content }) => {
    const { http, calls } = stubHttp({ _id: "qr1" });
    const client = new QRCodeClient(http);
    const data = { name: "N", templateId, tag: "t", refId: "r", isEnableMonetization: true, [type]: content };

    await createStructured(client, type, data);
    await updateStructured(client, type, "qr1", data);

    const expected = { name: "N", templateId, tag: "t", refId: "r", qrCodeTarget: { type, [type]: content }, ...source };
    expect(calls[0]).toEqual({ method: "POST", url: `/api/qr-code/${type}`, body: expected });
    expect(calls[1]).toEqual({ method: "PUT", url: `/api/qr-code/${type}/qr1`, body: expected });
    for (const call of calls) {
      expect(call.body).not.toHaveProperty("options");
      expect(call.body).not.toHaveProperty("isEnableMonetization");
      expect(JSON.stringify(call.body)).not.toContain("undefined");
    }
  });

  it("does not mutate the caller's request (the content key stays in place)", async () => {
    const { http } = stubHttp({ _id: "qr1" });
    const data: ICreateEmailQRCodeRequest = { templateId, email: { email: "a@example.com" }, isEnableMonetization: true };

    await new QRCodeClient(http).createEmail(data);

    expect(data).toEqual({ templateId, email: { email: "a@example.com" }, isEnableMonetization: true });
  });

  it("free text keeps options.text = text on create and update, and forwards the landing-page fields", async () => {
    const { http, calls } = stubHttp({ _id: "qr1" });
    const client = new QRCodeClient(http);
    const data: ICreateFreeTextQRCodeRequest = {
      name: "Ticket",
      templateId,
      text: "TICKET-1",
      isEnableLandingPage: true,
      pageInfo: { title: "Ticket", description: "Seat A12" },
      isEnableMonetization: true,
    };

    await client.createFreeText(data);
    await client.updateFreeText("qr1", data);

    const expected = {
      name: "Ticket",
      templateId,
      isEnableLandingPage: true,
      pageInfo: { title: "Ticket", description: "Seat A12" },
      qrCodeTarget: { type: "freeText", freeText: { text: "TICKET-1" } },
      options: { text: "TICKET-1" },
      ...source,
    };
    expect(calls[0]).toEqual({ method: "POST", url: "/api/qr-code/freeText", body: expected });
    expect(calls[1]).toEqual({ method: "PUT", url: "/api/qr-code/freeText/qr1", body: expected });
  });

  it("list sends refId and the boolean landing-page filter, never isEnableMonetization", async () => {
    const { http, calls } = stubHttp({ items: [], pagination: {} });

    await new QRCodeClient(http).list({ refId: "R1", isEnableLandingPage: true, isEnableMonetization: true }, { page: 1, pageSize: 10 });

    expect(calls[0]).toEqual({ method: "GET", url: "/api/qr-code", params: { refId: "R1", isEnableLandingPage: true, page: 1, pageSize: 10 } });
  });

  it("getAnalytics calls GET /api/qr-code/:id/analytics with the serialized query (VA)", async () => {
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
    const client = new QRCodeClient(http);

    const result = await client.getAnalytics("qr1", { breakdown: "all", interval: "month", tz: "Africa/Cairo", limit: 5 });
    await client.getAnalytics("qr1", { breakdown: [] });

    expect(result).toEqual(answer);
    expect(calls[0]).toEqual({
      method: "GET",
      url: "/api/qr-code/qr1/analytics",
      params: { breakdown: "all", interval: "month", tz: "Africa/Cairo", limit: 5 },
    });
    expect(calls[1]).toEqual({ method: "GET", url: "/api/qr-code/qr1/analytics", params: {} });
  });

  it("statistics calls GET /api/qr-code/statistics with the serialized range (VA)", async () => {
    const answer = {
      range: { from: "2026-09-29T00:00:00.000Z", to: "2026-10-05T23:59:59.999Z", period: "7d" },
      data: {
        totals: { totalQRCodes: 2, totalVisitors: 40, avgVisitorsPerQRCode: 20, visitsInRange: 5, uniqueVisitorsInRange: 4, botVisitsInRange: 1 },
        daily: [{ _id: "2026-10-01", createdCount: 1, visitorsSum: 5 }],
        topQRCodes: [{ _id: "qr1", name: "Menu", createdAt: "2026-10-01T10:00:00.000Z", visitsInRange: 5 }],
      },
    };
    const { http, calls } = stubHttp(answer);
    const client = new QRCodeClient(http);

    const result = await client.statistics({ period: "7d" });
    await client.statistics({ from: new Date("2026-10-01T00:00:00.000Z"), to: "2026-10-05" });
    await client.statistics();

    expect(result).toEqual(answer);
    expect(calls.map((call) => [call.method, call.url, call.params])).toEqual([
      ["GET", "/api/qr-code/statistics", { period: "7d" }],
      ["GET", "/api/qr-code/statistics", { from: "2026-10-01", to: "2026-10-05" }],
      ["GET", "/api/qr-code/statistics", {}],
    ]);
  });

  it("sends mode only when defined; a call without mode is unchanged (DQ)", async () => {
    const { http, calls } = stubHttp({ _id: "qr1" });
    const client = new QRCodeClient(http);

    await client.createURL({ templateId, url: { url: "https://example.com" } });
    await client.createURL({ templateId, url: { url: "https://example.com" }, mode: "dynamic" });
    await client.updateURL("qr1", { name: "N", templateId, url: { url: "https://example.com" }, mode: "static" });

    expect(calls[0].body).toEqual({ templateId, qrCodeTarget: { type: "url", url: { url: "https://example.com" } }, ...source });
    expect(calls[1].body).toEqual({ templateId, mode: "dynamic", qrCodeTarget: { type: "url", url: { url: "https://example.com" } }, ...source });
    expect(calls[2].body).toMatchObject({ mode: "static" });
  });

  it("a dynamic free-text code sends no client-built options.text (DQ)", async () => {
    const { http, calls } = stubHttp({ _id: "qr1" });
    await new QRCodeClient(http).createFreeText({ templateId, text: "HELLO", mode: "dynamic" });
    expect(calls[0].body).toEqual({ templateId, mode: "dynamic", qrCodeTarget: { type: "freeText", freeText: { text: "HELLO" } }, ...source });
  });

  it("list sends the mode filter (DQ)", async () => {
    const { http, calls } = stubHttp({ items: [], pagination: {} });
    await new QRCodeClient(http).list({ mode: "dynamic" });
    expect(calls[0].params).toEqual({ mode: "dynamic" });
  });

  it("passes access through only when defined; null clears; Dates serialise to ISO (DQ Part B)", async () => {
    const { http, calls } = stubHttp({ _id: "qr1" });
    const client = new QRCodeClient(http);
    const access = { activeFrom: new Date("2026-11-01T00:00:00.000Z"), expiresAt: "2026-12-01T00:00:00.000Z", maxVisits: 100, fallbackUrl: "https://example.com/closed" };

    await client.createURL({ templateId, url: { url: "https://example.com" }, mode: "dynamic", access });
    await client.updateURL("qr1", { name: "N", templateId, url: { url: "https://example.com" }, access: null });
    await client.updateURL("qr1", { name: "N", templateId, url: { url: "https://example.com" } });

    expect(JSON.parse(JSON.stringify(calls[0].body)).access).toEqual({ ...access, activeFrom: "2026-11-01T00:00:00.000Z" });
    expect((calls[1].body as any).access).toBeNull();
    expect("access" in (calls[2].body as object)).toBe(false);
  });

  it("Wi-Fi codes take no access at compile time (DQ Part B)", () => {
    const { http } = stubHttp();
    const client = new QRCodeClient(http);
    const compileOnly = () => {
      // @ts-expect-error Wi-Fi codes are static, so they take no scan rules
      void client.createWifi({ templateId, wifi: { name: "Cafe" }, access: { maxVisits: 1 } });
    };
    expect(typeof compileOnly).toBe("function");
  });

  it("Wi-Fi codes cannot be dynamic at compile time (DQ)", () => {
    const { http } = stubHttp();
    const client = new QRCodeClient(http);
    const compileOnly = () => {
      void client.createWifi({ templateId, wifi: { name: "Cafe" }, mode: "static" });
      // @ts-expect-error Wi-Fi codes are static only
      void client.createWifi({ templateId, wifi: { name: "Cafe" }, mode: "dynamic" });
      // @ts-expect-error Wi-Fi codes are static only
      void client.updateWifi("qr1", { name: "N", templateId, wifi: { name: "Cafe" }, mode: "dynamic" });
    };
    expect(typeof compileOnly).toBe("function");
  });

  it("requires templateId at compile time (TP-D7)", () => {
    const { http } = stubHttp();
    const client = new QRCodeClient(http);
    // Never called: the assertions are the `@ts-expect-error` lines, which fail
    // the type check of this file if templateId ever becomes optional.
    const compileOnly = () => {
      // @ts-expect-error templateId is required on create
      void client.createURL({ url: { url: "https://example.com" } });
      // @ts-expect-error templateId is required on update
      void client.updateURL("qr1", { name: "N", url: { url: "https://example.com" } });
    };
    expect(typeof compileOnly).toBe("function");
  });
});

const describeLive = TEST_CONFIG.apiKey ? describe : describe.skip;

describeLive("QR Code SDK", () => {
  let httpClient: HttpClient;
  let client!: QRCodeClient;
  let createdId: string;
  const qrCodeURLTag = "test-url-qr-code";
  const qrCodeFreeTextTag = "test-free-text-qr-code";

  beforeAll(() => {
    httpClient = new HttpClient({
      apiKey: TEST_CONFIG.apiKey,
      baseUrl: TEST_CONFIG.baseUrl,
      debug: true,
    });
    client = new QRCodeClient(httpClient);
  });

  describe("CREATE - URL QR Code", () => {
    it("should create a URL QR code", async () => {
      const result = await client.createURL({
        name: "Test URL QR Code - " + Date.now(),
        templateId,
        tag: qrCodeURLTag,
        url: {
          url: "https://posty5.com",
        },
      });

      expect(result._id).toBeDefined();
      expect(result.qrCodeLandingPageURL).toBeDefined();

      createdId = result._id;
      createdResources.qrCodes.push(createdId);
    });
  });

  describe("CREATE - Other Types", () => {
    it("should create a Free Text QR code", async () => {
      const result = await client.createFreeText({
        name: "Test Free Text QR",
        templateId,
        tag: qrCodeFreeTextTag,
        text: "Hello from QR Code Test!",
      });

      expect(result._id).toBeDefined();
      expect(result.qrCodeLandingPageURL).toBeDefined();
      createdResources.qrCodes.push(result._id);
    });

    it("should create an Email QR code", async () => {
      const result = await client.createEmail({
        name: "Test Email QR",
        templateId,
        email: {
          email: "test@example.com",
          subject: "Test Subject",
          body: "Test Body",
        },
      });

      expect(result._id).toBeDefined();
      expect(result.qrCodeLandingPageURL).toBeDefined();
      createdResources.qrCodes.push(result._id);
    });

    it("should create a WiFi QR code", async () => {
      const result = await client.createWifi({
        name: "Test WiFi QR",
        templateId,
        wifi: {
          name: "TestNetwork",
          authenticationType: "WPA",
          password: "testpassword123",
        },
      });

      expect(result._id).toBeDefined();
      expect(result.qrCodeLandingPageURL).toBeDefined();
      createdResources.qrCodes.push(result._id);
    });

    it("should create a Phone Call QR code", async () => {
      const result = await client.createCall({
        name: "Test Call QR",
        templateId,
        call: {
          phoneNumber: "+1234567890",
        },
      });

      expect(result._id).toBeDefined();
      expect(result.qrCodeLandingPageURL).toBeDefined();
      createdResources.qrCodes.push(result._id);
    });

    it("should create an SMS QR code", async () => {
      const result = await client.createSMS({
        name: "Test SMS QR",
        templateId,
        sms: {
          phoneNumber: "+1234567890",
          message: "Hello from QR Code!",
        },
      });

      expect(result._id).toBeDefined();
      expect(result.qrCodeLandingPageURL).toBeDefined();
      createdResources.qrCodes.push(result._id);
    });

    it("should create a Geolocation QR code", async () => {
      const result = await client.createGeolocation({
        name: "Test Location QR",
        templateId,
        geolocation: {
          latitude: 40.7128,
          longitude: -74.006,
        },
      });

      expect(result._id).toBeDefined();
      expect(result.qrCodeLandingPageURL).toBeDefined();
      createdResources.qrCodes.push(result._id);
    });
  });

  describe("GET BY ID", () => {
    it("should get QR code by ID", async () => {
      const result = await client.get(createdId);

      expect(result._id).toBe(createdId);
      expect(result.name).toBeDefined();
    });

    it("should fail with invalid ID", async () => {
      await expect(client.get("invalid-id-123")).rejects.toThrow();
    });
  });

  describe("GET LIST", () => {
    it("should get list of QR codes", async () => {
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
  });

  describe("UPDATE", () => {
    it("should update URL QR code", async () => {
      const targetId = (
        await client.list(
          {
            tag: qrCodeURLTag,
          },
          {
            page: 1,
            pageSize: 1,
          },
        )
      ).items[0]._id;
      const result = await client.updateURL(targetId, {
        name: "Updated QR Code - " + Date.now(),
        templateId,
        url: {
          url: "https://updated.posty5.com",
        },
      });

      expect(result._id).toBe(targetId);
    });

    it("should update Free Text QR code", async () => {
      const targetId = (
        await client.list(
          {
            tag: qrCodeFreeTextTag,
          },
          {
            page: 1,
            pageSize: 1,
          },
        )
      ).items[0]._id;

      const result = await client.updateFreeText(targetId, {
        name: "Updated Free Text QR",
        templateId,
        text: "Updated text content",
      });

      expect(result._id).toBe(targetId);
    });
  });

  describe("Dynamic QR codes (DQ)", () => {
    let dynamicId: string;

    it("creates a dynamic URL code that encodes its landing page URL", async () => {
      const created = await client.createURL({ name: "DQ dynamic - " + Date.now(), templateId, url: { url: "https://example.com/a" }, mode: "dynamic" });
      dynamicId = created._id;
      createdResources.qrCodes.push(dynamicId);

      const stored = await client.get(dynamicId);
      expect(stored.mode).toBe("dynamic");
      expect(stored.dynamicSince).toBeTruthy();
      expect(stored.options?.text).toBe(stored.qrCodeLandingPageURL);
    });

    it("changing the target keeps the landing page URL", async () => {
      const before = await client.get(dynamicId);
      await client.updateURL(dynamicId, { name: before.name, templateId, url: { url: "https://example.com/b" } });
      const after = await client.get(dynamicId);
      expect(after.qrCodeLandingPageURL).toBe(before.qrCodeLandingPageURL);
      expect(after.mode).toBe("dynamic");
    });

    it("creates a static code when mode is omitted", async () => {
      const created = await client.createURL({ name: "DQ static - " + Date.now(), templateId, url: { url: "https://example.com" } });
      createdResources.qrCodes.push(created._id);
      expect((await client.get(created._id)).mode ?? "static").toBe("static");
    });

    it("list({ mode: 'dynamic' }) includes the dynamic code", async () => {
      const result = await client.list({ mode: "dynamic" }, { page: 1, pageSize: 50 });
      expect(result.items.some((item) => item._id === dynamicId)).toBe(true);
    });

    it("sets and clears access (scan rules), or surfaces the plan 403", async () => {
      const before = await client.get(dynamicId);
      const access = { expiresAt: new Date(Date.now() + 86_400_000).toISOString(), maxVisits: 5, fallbackUrl: "https://example.com/closed" };
      try {
        await client.updateURL(dynamicId, { name: before.name, templateId, url: { url: "https://example.com/b" }, access });
      } catch (error: any) {
        // A Free test account: the plan gate surfaces through the core error unchanged
        expect(String(error?.message)).toContain("not available on your current plan");
        return;
      }
      const set = await client.get(dynamicId);
      expect(set.access?.maxVisits).toBe(5);
      expect(set.access?.fallbackUrl).toBe("https://example.com/closed");
      expect(set.access?.activeFrom ?? null).toBeNull();

      await client.updateURL(dynamicId, { name: before.name, templateId, url: { url: "https://example.com/b" }, access: null });
      expect((await client.get(dynamicId)).access ?? null).toBeNull();
    });
  });

  describe("Truth pass — server-built text, refId and landing-page filters", () => {
    const refId = "TP-QR-" + Date.now();
    const ids: string[] = [];

    afterAll(async () => {
      for (const id of ids) {
        await client.delete(id).catch(() => undefined);
      }
    });

    it("stores the text the server builds from qrCodeTarget (escaped, no 'undefined')", async () => {
      const email = await client.createEmail({ name: "TP email", templateId, refId, email: { email: "test@example.com", subject: "Q&A" } });
      const sms = await client.createSMS({ name: "TP sms", templateId, refId, sms: { phoneNumber: "+1234567890" } });
      ids.push(email._id, sms._id);

      const emailText = (await client.get(email._id)).options?.text ?? "";
      const smsText = (await client.get(sms._id)).options?.text ?? "";
      expect(emailText.startsWith("mailto:test@example.com")).toBe(true);
      expect(emailText).toContain("Q%26A");
      expect(smsText.startsWith("sms:+1234567890")).toBe(true);
      expect(smsText).not.toContain("undefined");
    });

    it("filters by refId and by the landing-page flag", async () => {
      const landing = await client.createURL({
        name: "TP landing",
        templateId,
        refId,
        url: { url: "https://posty5.com" },
        isEnableLandingPage: true,
        pageInfo: { title: "TP landing" },
      });
      ids.push(landing._id);

      const byRef = await client.list({ refId }, { page: 1, pageSize: 10 });
      expect(byRef.items.length).toBe(3);
      expect(byRef.items.every((qr) => qr.refId === refId)).toBe(true);

      const withLanding = await client.list({ refId, isEnableLandingPage: true }, { page: 1, pageSize: 10 });
      expect(withLanding.items.map((qr) => qr._id)).toEqual([landing._id]);
      expect(withLanding.items[0].isEnableLandingPage).toBe(true);
      expect(withLanding.items[0].status).toBeDefined();
    });
  });

  // Needs the API's visit-analytics routes (VA) on the stack POSTY5_BASE_URL points at.
  describe("VA — getAnalytics", () => {
    it("answers zeros and meta.analyticsStartedAt for a new code", async () => {
      const result = await client.getAnalytics(createdId);

      expect(result.totals).toEqual({ visits: 0, uniqueVisitors: 0, botVisits: 0 });
      expect(Array.isArray(result.series)).toBe(true);
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
      const result = await client.getAnalytics(createdId, { breakdown: ["device"] });

      expect(Object.keys(result.breakdowns)).toEqual(["device"]);
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
      await expect(client.getAnalytics("000000000000000000000000")).rejects.toMatchObject({ statusCode: 400, message: "The QR Code Is Not Found" });
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
      result.data.topQRCodes.forEach((row) => expect(row.visitsInRange).toBeGreaterThan(0));
    });
  });

  describe("DELETE", () => {
    it("should delete QR code", async () => {
      await client.delete(createdId);

      // Verify deletion
      await expect(client.get(createdId)).rejects.toThrow();
    });
  });
});
