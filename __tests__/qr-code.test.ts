import { HttpClient } from "@posty5/core";
import { QRCodeClient } from "@posty5/qr-code";
import { TEST_CONFIG, createdResources } from "./setup";
const templateId = "698a268af42b052d15e8f93c";
describe("QR Code SDK", () => {
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

  describe("DELETE", () => {
    it("should delete QR code", async () => {
      await client.delete(createdId);

      // Verify deletion
      await expect(client.get(createdId)).rejects.toThrow();
    });
  });
});
