import { NetworkError, ValidationError } from "@posty5/core";
import { QRCodeClient } from "@posty5/qr-code";
import { stubHttp } from "./helpers/stub-http.helper";

/**
 * `@posty5/qr-code` content types (QT, 4.7.0) — offline payload tests.
 *
 * Pass 1 (static types: vcard, event, whatsapp, review, social) and Pass 2
 * (dynamic-only appStore and file, social up to 12 profiles). Every body
 * carries `qrCodeTarget` and the SDK's source fields, never `options.text`.
 * `createFile` / `updateFile` PUT to the signed URL through `uploadToR2`,
 * which calls the global `fetch`; it is replaced by a jest mock here.
 */

const templateId = "698a268af42b052d15e8f93c";
const source = { templateType: "user", createdFrom: "npmPackage" };

const typedCases = [
  {
    type: "vcard",
    content: { firstName: "Sara", lastName: "Ali", organization: "Acme", phones: [{ kind: "mobile", number: "+201001234567" }], emails: ["sara@acme.com"], website: "https://acme.com" },
    create: (c: QRCodeClient, d: any) => c.createVCard(d),
    update: (c: QRCodeClient, id: string, d: any) => c.updateVCard(id, d, 0),
  },
  {
    type: "event",
    content: { title: "Launch", location: "Cairo", startsAt: "2026-11-01T18:00:00.000Z", endsAt: "2026-11-01T20:00:00.000Z" },
    create: (c: QRCodeClient, d: any) => c.createEvent(d),
    update: (c: QRCodeClient, id: string, d: any) => c.updateEvent(id, d, 0),
  },
  {
    type: "whatsapp",
    content: { phoneNumber: "+201001234567", message: "Hi & welcome" },
    create: (c: QRCodeClient, d: any) => c.createWhatsApp(d),
    update: (c: QRCodeClient, id: string, d: any) => c.updateWhatsApp(id, d, 0),
  },
  {
    type: "review",
    content: { platform: "google", placeId: "ChIJN1t_tDeuEmsRUsoyG83frY4" },
    create: (c: QRCodeClient, d: any) => c.createReview(d),
    update: (c: QRCodeClient, id: string, d: any) => c.updateReview(id, d, 0),
  },
  {
    type: "social",
    content: { profiles: [{ platform: "instagram", handle: "posty5" }], title: "Follow us" },
    create: (c: QRCodeClient, d: any) => c.createSocial(d),
    update: (c: QRCodeClient, id: string, d: any) => c.updateSocial(id, d, 0),
  },
  {
    type: "appStore",
    content: { androidUrl: "https://play.google.com/store/apps/details?id=com.example", iosUrl: "https://apps.apple.com/app/id123456789", fallbackUrl: "https://example.com/app" },
    create: (c: QRCodeClient, d: any) => c.createAppStore(d),
    update: (c: QRCodeClient, id: string, d: any) => c.updateAppStore(id, d, 0),
  },
] as const;

/** Replaces `fetch` for the signed PUT; returns the mock. */
function mockFetch(impl?: (...args: any[]) => Promise<unknown>) {
  const fn = jest.fn(impl ?? (async () => ({ ok: true, status: 200, statusText: "OK" })));
  (globalThis as any).fetch = fn;
  return fn;
}

const ticket = { uploadFileURL: "https://r2.example.com/qr-files/u1/abc.pdf?X-Amz-Signature=s", bucketFilePath: "qr-files/u1/abc.pdf", expiresInSeconds: 60 };

describe("QR Code SDK — content types (offline)", () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    (globalThis as any).fetch = realFetch;
    jest.restoreAllMocks();
  });

  it.each(typedCases)("$type create and update send qrCodeTarget only — no options.text", async ({ type, content, create, update }) => {
    const { http, calls } = stubHttp({ _id: "qr1" });
    const client = new QRCodeClient(http);
    const data = { name: "N", templateId, tag: "t", refId: "r", isEnableMonetization: true, [type]: content };

    await create(client, data);
    await update(client, "qr1", data);

    const expected = { name: "N", templateId, tag: "t", refId: "r", qrCodeTarget: { type, [type]: content }, ...source };
    expect(calls[0]).toEqual({ method: "POST", url: `/api/qr-code/${type}`, body: expected });
    expect(calls[1]).toEqual({ method: "PUT", url: `/api/qr-code/${type}/qr1`, body: expected });
    for (const call of calls) {
      expect(call.body).not.toHaveProperty("options");
      expect(call.body).not.toHaveProperty("isEnableMonetization");
      expect(JSON.stringify(call.body)).not.toContain("undefined");
    }
  });

  it("passes mode through on the new types only when defined", async () => {
    const { http, calls } = stubHttp({ _id: "qr1" });
    const client = new QRCodeClient(http);
    await client.createVCard({ templateId, vcard: { firstName: "S" }, mode: "dynamic" });
    await client.createAppStore({ templateId, appStore: { fallbackUrl: "https://example.com" } });
    expect((calls[0].body as any).mode).toBe("dynamic");
    expect("mode" in (calls[1].body as object)).toBe(false);
  });

  it("event serialises Date startsAt / endsAt to ISO and leaves the caller's object untouched", async () => {
    const { http, calls } = stubHttp({ _id: "qr1" });
    const startsAt = new Date("2026-11-01T18:00:00.000Z");
    const data = { templateId, event: { title: "Launch", startsAt, endsAt: "2026-11-01T20:00:00.000Z" } };
    await new QRCodeClient(http).createEvent(data);
    expect((calls[0].body as any).qrCodeTarget.event).toEqual({ title: "Launch", startsAt: "2026-11-01T18:00:00.000Z", endsAt: "2026-11-01T20:00:00.000Z" });
    expect(data.event.startsAt).toBe(startsAt);
  });

  it("social accepts up to 12 profiles (dynamic)", async () => {
    const { http, calls } = stubHttp({ _id: "qr1" });
    const profiles = Array.from({ length: 12 }, (_, i) => ({ platform: "other" as const, url: `https://example.com/p${i}` }));
    await new QRCodeClient(http).createSocial({ templateId, mode: "dynamic", social: { profiles } });
    expect((calls[0].body as any).qrCodeTarget.social.profiles).toHaveLength(12);
  });

  it("appStore and file are dynamic-only at compile time", () => {
    const { http } = stubHttp();
    const client = new QRCodeClient(http);
    const compileOnly = () => {
      // @ts-expect-error app store codes cannot be static
      void client.createAppStore({ templateId, mode: "static", appStore: { fallbackUrl: "https://example.com" } });
      // @ts-expect-error fallbackUrl is required
      void client.createAppStore({ templateId, appStore: { iosUrl: "https://apps.apple.com/app/id1" } });
      // @ts-expect-error file codes cannot be static
      void client.createFile({ templateId, mode: "static" }, new Blob(["x"], { type: "application/pdf" }));
    };
    expect(typeof compileOnly).toBe("function");
  });

  it("createFile: upload-url, PUT with the content type, then create with bucketFilePath", async () => {
    const { http, calls } = stubHttp(ticket);
    const fetchMock = mockFetch();
    const blob = new Blob(["%PDF-1.4 test"], { type: "application/pdf" });

    await new QRCodeClient(http).createFile({ name: "Menu", templateId, file: { fileName: "menu.pdf" } }, blob);

    expect(calls[0]).toEqual({ method: "POST", url: "/api/qr-code/file/upload-url", body: { fileName: "menu.pdf", mimeType: "application/pdf", sizeBytes: blob.size } });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [putUrl, init] = fetchMock.mock.calls[0];
    expect(putUrl).toBe(ticket.uploadFileURL);
    expect(init.method).toBe("PUT");
    expect(init.headers["Content-Type"]).toBe("application/pdf");
    expect(calls[1]).toEqual({
      method: "POST",
      url: "/api/qr-code/file",
      body: { name: "Menu", templateId, qrCodeTarget: { type: "file", file: { fileName: "menu.pdf", bucketFilePath: ticket.bucketFilePath } }, ...source },
    });
    expect(calls[1].body).not.toHaveProperty("options");
    expect(calls).toHaveLength(2);
  });

  it("createFile: a Buffer takes mimeType from data and sizeBytes from its length", async () => {
    const { http, calls } = stubHttp(ticket);
    mockFetch();
    const buffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]);
    await new QRCodeClient(http).createFile({ templateId, file: { fileName: "a.png", mimeType: "image/png" } }, buffer);
    expect(calls[0].body).toEqual({ fileName: "a.png", mimeType: "image/png", sizeBytes: 7 });
    expect((calls[1].body as any).qrCodeTarget.file).not.toHaveProperty("mimeType");
  });

  it("createFile: a Buffer without mimeType is refused before any request", async () => {
    const { http, calls } = stubHttp(ticket);
    const fetchMock = mockFetch();
    await expect(new QRCodeClient(http).createFile({ templateId }, Buffer.from("x"))).rejects.toBeInstanceOf(ValidationError);
    expect(calls).toHaveLength(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("createFile: an empty file is refused before any request", async () => {
    const { http, calls } = stubHttp(ticket);
    await expect(new QRCodeClient(http).createFile({ templateId }, new Blob([], { type: "application/pdf" }))).rejects.toBeInstanceOf(ValidationError);
    expect(calls).toHaveLength(0);
  });

  it("createFile: retries the PUT once on a network error, not on an HTTP status", async () => {
    const { http, calls } = stubHttp(ticket);
    let n = 0;
    const fetchMock = mockFetch(async () => {
      if (n++ === 0) throw new TypeError("fetch failed");
      return { ok: true, status: 200, statusText: "OK" };
    });
    await new QRCodeClient(http).createFile({ templateId }, new Blob(["x"], { type: "image/png" }));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(calls).toHaveLength(2);

    const second = stubHttp(ticket);
    const failing = mockFetch(async () => ({ ok: false, status: 403, statusText: "Forbidden" }));
    await expect(new QRCodeClient(second.http).createFile({ templateId }, new Blob(["x"], { type: "image/png" }))).rejects.toThrow("403");
    expect(failing).toHaveBeenCalledTimes(1);
    expect(second.calls).toHaveLength(1);
  });

  it("createFile: an upload failing after the URL expired says so", async () => {
    const { http, calls } = stubHttp({ ...ticket, expiresInSeconds: 60 });
    const t0 = 1_000_000;
    const now = jest.spyOn(Date, "now").mockReturnValue(t0);
    mockFetch(async () => {
      now.mockReturnValue(t0 + 61_000);
      return { ok: false, status: 403, statusText: "Forbidden" };
    });
    const promise = new QRCodeClient(http).createFile({ templateId }, new Blob(["x"], { type: "image/png" }));
    await expect(promise).rejects.toBeInstanceOf(NetworkError);
    await expect(promise).rejects.toThrow(/expired/);
    expect(calls).toHaveLength(1);
  });

  it("updateFile without content keeps the stored file: no upload, no bucketFilePath", async () => {
    const { http, calls } = stubHttp({ _id: "qr1" });
    const fetchMock = mockFetch();
    await new QRCodeClient(http).updateFile("qr1", { name: "Menu", templateId, file: { fileName: "menu-2026.pdf" } }, 0);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(calls).toEqual([
      { method: "PUT", url: "/api/qr-code/file/qr1", body: { name: "Menu", templateId, qrCodeTarget: { type: "file", file: { fileName: "menu-2026.pdf" } }, ...source } },
    ]);
  });

  it("updateFile with content uploads first, then PUTs the new bucketFilePath", async () => {
    const { http, calls } = stubHttp(ticket);
    const fetchMock = mockFetch();
    await new QRCodeClient(http).updateFile("qr1", { name: "Menu", templateId }, 0, new Blob(["x"], { type: "image/webp" }));
    expect(calls[0]).toEqual({ method: "POST", url: "/api/qr-code/file/upload-url", body: { fileName: "file", mimeType: "image/webp", sizeBytes: 1 } });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(calls[1]).toEqual({
      method: "PUT",
      url: "/api/qr-code/file/qr1",
      body: { name: "Menu", templateId, qrCodeTarget: { type: "file", file: { bucketFilePath: ticket.bucketFilePath } }, ...source },
    });
  });
});
