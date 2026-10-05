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

  describe("DELETE", () => {
    it("should delete QR code", async () => {
      await client.delete(createdId);

      // Verify deletion
      await expect(client.get(createdId)).rejects.toThrow();
    });
  });
});
