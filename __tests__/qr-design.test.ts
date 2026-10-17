import { readFileSync } from "fs";
import { join } from "path";
import { AuthorizationError, HttpClient, NotFoundError, ValidationError, decodeBinaryErrorBody } from "@posty5/core";
import { QRCodeClient, QRCodeTemplateClient } from "@posty5/qr-code";
import { scriptedHttp } from "./helpers/scripted-http.helper";
import { TEST_CONFIG } from "./setup";

const PLAN_GATE = "This feature is not available on your current plan.";
const bytes = (text: string) => ({ data: new TextEncoder().encode(text).buffer, contentType: "application/octet-stream" });
const head = (data: ArrayBuffer, n = 5) => Buffer.from(new Uint8Array(data).slice(0, n)).toString("latin1");

describe("QR render, export and scannability (offline)", () => {
  it("render sends only the options given, download as a flag", async () => {
    const { http, calls } = scriptedHttp(() => bytes("%PDF-"));
    const qr = new QRCodeClient(http);
    await qr.render("q1");
    await qr.render("q1", { format: "pdf", presetId: "custom", customMm: 40, download: true });
    await qr.render("q1", { presetId: "business-card", dpi: 300, sizePx: undefined, download: false });

    expect(calls[0]).toMatchObject({ method: "GET", url: "/api/qr-code/q1/render", params: {} });
    expect(calls[1].params).toEqual({ format: "pdf", presetId: "custom", customMm: 40, download: "1" });
    expect(calls[2].params).toEqual({ presetId: "business-card", dpi: 300 });
  });

  it("getExportUrl never sends download and returns the link", async () => {
    const { http, calls } = scriptedHttp(() => ({ url: "https://x/build-qr/l?sig=s", expiresAt: "2026-10-17T00:00:00Z" }));
    const link = await new QRCodeClient(http).getExportUrl("q1", { format: "svg", download: true } as never);
    expect(calls[0]).toMatchObject({ method: "GET", url: "/api/qr-code/q1/export-url", params: { format: "svg" } });
    expect(link.url).toContain("sig=");
  });

  it("checkScannability posts the input unchanged", async () => {
    const { http, calls } = scriptedHttp(() => ({ verdict: "good", checks: [], symbol: { version: 2, size: 25, ecLevel: "M", quietZoneModules: 4 } }));
    const qr = new QRCodeClient(http);
    await qr.checkScannability({ templateId: "t1", presetId: "sticker-3cm" });
    await qr.checkScannability({ options: { colorDark: "#000" }, text: "https://posty5.com", sizePx: 300 });
    expect(calls[0]).toMatchObject({ method: "POST", url: "/api/qr-code/scannability-check", body: { templateId: "t1", presetId: "sticker-3cm" } });
    expect(calls[1].body).toEqual({ options: { colorDark: "#000" }, text: "https://posty5.com", sizePx: 300 });
  });

  it("surfaces a plan gate and a missing code as the core error types", async () => {
    const { http } = scriptedHttp((call) => {
      throw call.url.includes("missing") ? new NotFoundError("QR Code not found") : new AuthorizationError(PLAN_GATE);
    });
    const qr = new QRCodeClient(http);
    await expect(qr.render("q1", { format: "svg" })).rejects.toThrow(new AuthorizationError(PLAN_GATE));
    await expect(qr.getExportUrl("missing")).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("QRCodeTemplateClient design methods (offline)", () => {
  it("create posts name and options without source fields", async () => {
    const { http, calls } = scriptedHttp(() => ({ _id: "t1", __v: 0 }));
    await new QRCodeTemplateClient(http).create({ name: "Menu", options: { dotShape: "rounded" } });
    expect(calls[0]).toEqual({ method: "POST", url: "/api/qr-code-template", body: { name: "Menu", options: { dotShape: "rounded" } } });
  });

  it("update puts _id in the body and the version as If-Match", async () => {
    const { http, calls } = scriptedHttp(() => ({ _id: "t1", __v: 4 }));
    const tpl = new QRCodeTemplateClient(http);
    const result = await tpl.update("t1", { name: "Menu", options: { frame: { id: "banner-bottom", text: "Scan me" } } }, 3);
    expect(calls[0]).toMatchObject({ method: "PUT", url: "/api/qr-code-template", version: 3 });
    expect(calls[0].body).toEqual({ _id: "t1", name: "Menu", options: { frame: { id: "banner-bottom", text: "Scan me" } } });
    expect(result.__v).toBe(4);
    await expect(tpl.update("t1", { name: "x", options: {} }, undefined as never)).rejects.toBeInstanceOf(TypeError);
  });

  it("get, list, delete, catalogue and render use their routes", async () => {
    const { http, calls } = scriptedHttp((call) => (call.url.endsWith("/render") ? bytes("<svg") : {}));
    const tpl = new QRCodeTemplateClient(http);
    await tpl.get("t1");
    await tpl.list({ name: "menu" }, { page: 2, pageSize: 5 });
    await tpl.delete("t1", 7);
    await tpl.getDesignCatalogue();
    await tpl.render("t1", { format: "svg", sizePx: 512 });
    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual([
      "GET /api/qr-code-template/t1",
      "GET /api/qr-code-template",
      "DELETE /api/qr-code-template/t1",
      "GET /api/qr-code-template/design-catalogue",
      "GET /api/qr-code-template/t1/render",
    ]);
    expect(calls[1].params).toEqual({ name: "menu", page: 2, pageSize: 5 });
    expect(calls[2].version).toBe(7);
    expect(calls[4].params).toEqual({ format: "svg", sizePx: 512 });
  });

  it("uploadLogo asks for a URL with the type and size, PUTs the file, returns fileURL", async () => {
    const fetchMock = jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 200 }));
    try {
      const { http, calls } = scriptedHttp(() => ({ uploadFileURL: "https://r2/put?sig", fileURL: "https://cdn/qr-logos/u/1.png" }));
      const url = await new QRCodeTemplateClient(http).uploadLogo(new Uint8Array([1, 2, 3]), "image/png");
      expect(calls[0]).toMatchObject({ method: "POST", url: "/api/qr-code-template/logo-upload-url", body: { fileType: "image/png", fileSize: 3 } });
      expect(fetchMock).toHaveBeenCalledWith("https://r2/put?sig", expect.objectContaining({ method: "PUT", headers: { "Content-Type": "image/png" } }));
      expect(url).toBe("https://cdn/qr-logos/u/1.png");
    } finally {
      fetchMock.mockRestore();
    }
  });

  it("uploadLogo refuses bytes without a type before any request", async () => {
    const { http, calls } = scriptedHttp(() => ({}));
    await expect(new QRCodeTemplateClient(http).uploadLogo(new Uint8Array([1]))).rejects.toBeInstanceOf(ValidationError);
    expect(calls).toHaveLength(0);
  });
});

describe("decodeBinaryErrorBody (offline)", () => {
  it("turns a JSON error body sent as bytes into an object, leaves anything else", () => {
    const json = { response: { data: new TextEncoder().encode(JSON.stringify({ message: PLAN_GATE })).buffer } };
    expect(decodeBinaryErrorBody(json).response.data).toEqual({ message: PLAN_GATE });
    const html = { response: { data: new TextEncoder().encode("<!doctype html>") } };
    expect(decodeBinaryErrorBody(html).response.data).toBeInstanceOf(Uint8Array);
    const plain = { response: { data: { message: "x" } } };
    expect(decodeBinaryErrorBody(plain).response.data).toEqual({ message: "x" });
  });
});

// Live, on an account whose plan has vector export and logo upload (POSTY5_API_KEY).
// Creates two templates and one QR code (a template creation costs credits) and deletes them.
const live = TEST_CONFIG.apiKey ? describe : describe.skip;
live("QR design (live)", () => {
  const http = new HttpClient({ apiKey: TEST_CONFIG.apiKey, baseUrl: TEST_CONFIG.baseUrl });
  const qr = new QRCodeClient(http);
  const tpl = new QRCodeTemplateClient(http);
  const created: { templates: string[]; qrCodes: string[] } = { templates: [], qrCodes: [] };

  afterAll(async () => {
    for (const id of created.qrCodes) await qr.get(id).then((x) => qr.delete(id, x.__v)).catch(() => undefined);
    for (const id of created.templates) await tpl.get(id).then((x) => tpl.delete(id, x.__v)).catch(() => undefined);
  });

  it("template CRUD, renders and scannability", async () => {
    const t = await tpl.create({
      name: `sdk-qd-${Date.now()}`,
      options: { correctLevel: 2, dotShape: "rounded", eyeFrameShape: "leaf", fill: { type: "linear", stops: [{ offset: 0, color: "#0059F7" }, { offset: 1, color: "#1d2b64" }] }, frame: { id: "banner-bottom", text: "Scan me" } },
    });
    created.templates.push(t._id);
    const got = await tpl.get(t._id);
    expect(got.options.designVersion).toBe(2);
    const updated = await tpl.update(t._id, { name: got.name!, options: { ...got.options, dotShape: "dots" } }, got.__v);
    expect(updated.__v).toBe(got.__v + 1);
    expect((await tpl.list({ name: got.name })).items.map((x) => x._id)).toContain(t._id);

    expect(head((await tpl.render(t._id)).data, 4)).toBe("\x89PNG");
    expect(head((await tpl.render(t._id, { format: "svg" })).data, 4)).toBe("<svg");
    expect(head((await tpl.render(t._id, { format: "pdf", presetId: "flyer-5cm" })).data)).toBe("%PDF-");
    await expect(tpl.render("000000000000000000000000")).rejects.toBeInstanceOf(NotFoundError);

    const report = await qr.checkScannability({ templateId: t._id, presetId: "business-card" });
    expect(["good", "warning", "poor"]).toContain(report.verdict);
    expect((await tpl.getDesignCatalogue()).printPresets.map((p) => p.id)).toContain("flyer-5cm");
  });

  it("QR code render, export link and logo upload", async () => {
    const q = await qr.createURL({ name: "sdk-qd", templateId: created.templates[0], url: { url: "https://posty5.com" } });
    created.qrCodes.push(q._id);
    expect(head((await qr.render(q._id, { format: "pdf", presetId: "sticker-3cm" })).data)).toBe("%PDF-");
    const link = await qr.getExportUrl(q._id, { format: "svg" });
    expect(head(await (await fetch(link.url)).arrayBuffer(), 4)).toBe("<svg");
    await expect(qr.render("000000000000000000000000")).rejects.toThrow("QR Code not found");

    const logo = await tpl.uploadLogo(readFileSync(join(__dirname, "assets/logo.png")), "image/png");
    expect(logo).toContain("/qr-logos/");
    const t2 = await tpl.create({ name: `sdk-qd-logo-${Date.now()}`, options: { correctLevel: 2, logo, logoSource: "upload" } });
    created.templates.push(t2._id);
  });
});
