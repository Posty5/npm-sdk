import { AuthorizationError, HttpClient, NotFoundError } from "@posty5/core";
import { QrPrintPresets } from "@posty5/qr-design";
import { listTools } from "../../posty5-mcp/src/catalogue";
import { createClients } from "../../posty5-mcp/src/core/clients.factory";
import { mapToolError } from "../../posty5-mcp/src/core/errors.helper";
import { ToolInputError } from "../../posty5-mcp/src/core/tool-input.error";
import { QR_CODE_TOOLS } from "../../posty5-mcp/src/toolsets/qr-codes.tools";
import { fakeCall, findTool, previewTool, route, runTool } from "./mcp-test.helper";

/**
 * The qr-codes toolset (mcp-tool-catalogue-package): every tool pinned to the
 * SDK route it calls and the body it sends. Offline — a stub HttpClient
 * records the requests.
 */

const QR_CODE = {
  _id: "qr1",
  qrCodeId: "abc",
  name: "Menu",
  templateId: "tpl1",
  status: "approved",
  numberOfVisitors: 12,
  qrCodeLandingPageURL: "https://posty5.com/q/abc",
  qrCodeTarget: { type: "url", url: { url: "https://menu.example" } },
};

describe("mcp qr-codes toolset", () => {
  it("holds the catalogue's eleven tools, in its order", () => {
    expect(QR_CODE_TOOLS.map((tool) => tool.name)).toEqual(["qr_code_list", "qr_code_get", "qr_code_render", "qr_code_check_scannability", "qr_code_get_analytics", "qr_code_list_templates", "qr_code_create", "qr_code_create_many", "qr_code_get_bulk_job", "qr_code_update", "qr_code_delete"]);
  });

  it("qr_code_list sends its filters and paging as query params", async () => {
    const { calls } = await runTool("qr_code_list", { tag: "menu", status: "approved", page: 2, pageSize: 5 });
    expect(route(calls[0])).toBe("GET /api/qr-code");
    expect(calls[0].params).toEqual({ tag: "menu", status: "approved", page: 2, pageSize: 5 });
  });

  it("qr_code_get reads one QR code by id", async () => {
    const { calls } = await runTool("qr_code_get", { id: "qr1" }, QR_CODE);
    expect(route(calls[0])).toBe("GET /api/qr-code/qr1");
  });

  it("qr_code_list_templates lists the account's templates by default and Posty5's with scope public", async () => {
    const own = await runTool("qr_code_list_templates", { term: "logo", page: 1 });
    expect(route(own.calls[0])).toBe("GET /api/qr-code-template/user-lookup");
    expect(own.calls[0].params).toEqual({ term: "logo", page: 1 });

    const shared = await runTool("qr_code_list_templates", { scope: "public" });
    expect(route(shared.calls[0])).toBe("GET /api/qr-code-template/public-lookup");
  });

  it("qr_code_create dispatches on type and sends the type's target block", async () => {
    const { calls, value } = await runTool("qr_code_create", { type: "url", url: "https://menu.example", templateId: "tpl1", name: "Menu", tag: "food" }, QR_CODE);
    expect(route(calls[0])).toBe("POST /api/qr-code/url");
    expect(calls[0].body).toMatchObject({
      name: "Menu",
      templateId: "tpl1",
      tag: "food",
      qrCodeTarget: { type: "url", url: { url: "https://menu.example" } },
      createdFrom: "mcp",
    });
    // The API builds the encoded text from qrCodeTarget (D07): structured types send no options.text.
    expect(calls[0].body.options).toBeUndefined();
    expect(findTool("qr_code_create").entity?.(value, {})).toEqual({ entityType: "qrCode", entityId: "qr1" });
  });

  it("qr_code_create makes a dynamic code by default and passes an explicit static through (DQ-D3)", async () => {
    const dynamic = await runTool("qr_code_create", { type: "url", url: "https://menu.example", templateId: "tpl1" }, QR_CODE);
    expect(dynamic.calls[0].body.mode).toBe("dynamic");

    const fixed = await runTool("qr_code_create", { type: "url", url: "https://menu.example", templateId: "tpl1", mode: "static" }, QR_CODE);
    expect(fixed.calls[0].body.mode).toBe("static");
  });

  it("qr_code_create keeps Wi-Fi static and refuses a dynamic Wi-Fi code before any request", async () => {
    const { calls } = await runTool("qr_code_create", { type: "wifi", wifiName: "Cafe", wifiAuthenticationType: "nopass", templateId: "tpl1" });
    expect(calls[0].body.mode).toBe("static");
    await expect(runTool("qr_code_create", { type: "wifi", wifiName: "Cafe", wifiAuthenticationType: "nopass", templateId: "tpl1", mode: "dynamic" })).rejects.toBeInstanceOf(ToolInputError);
  });

  it("qr_code_update without mode sends no mode, and passes a given mode", async () => {
    const kept = await runTool("qr_code_update", { version: 1, id: "qr1", type: "url", url: "https://new.example" }, undefined, [QR_CODE, QR_CODE]);
    expect(kept.calls[1].body.mode).toBeUndefined();
    expect(JSON.stringify(kept.calls[1].body)).not.toContain('"mode"');

    const switched = await runTool("qr_code_update", { version: 1, id: "qr1", type: "url", url: "https://new.example", mode: "static" }, undefined, [QR_CODE, QR_CODE]);
    expect(switched.calls[1].body.mode).toBe("static");
  });

  it("qr_code_create/update pass access through, null clears, and omitted sends none (DQ Part B)", async () => {
    const access = { expiresAt: "2026-12-01T00:00:00.000Z", maxVisits: 10, fallbackUrl: "https://example.com/closed" };
    const created = await runTool("qr_code_create", { type: "url", url: "https://menu.example", templateId: "tpl1", access }, QR_CODE);
    expect(created.calls[0].body.access).toEqual(access);

    const cleared = await runTool("qr_code_update", { version: 1, id: "qr1", type: "url", url: "https://new.example", access: null }, undefined, [QR_CODE, QR_CODE]);
    expect(cleared.calls[1].body.access).toBeNull();

    const kept = await runTool("qr_code_update", { version: 1, id: "qr1", type: "url", url: "https://new.example" }, undefined, [QR_CODE, QR_CODE]);
    expect(JSON.stringify(kept.calls[1].body)).not.toContain('"access"');
  });

  it("access is refused before any request on Wi-Fi or an explicitly static code (DQ Part B)", async () => {
    await expect(runTool("qr_code_create", { type: "wifi", wifiName: "Cafe", wifiAuthenticationType: "nopass", templateId: "tpl1", access: { maxVisits: 1 } })).rejects.toBeInstanceOf(ToolInputError);
    await expect(runTool("qr_code_create", { type: "url", url: "https://menu.example", templateId: "tpl1", mode: "static", access: { maxVisits: 1 } })).rejects.toBeInstanceOf(ToolInputError);
  });

  it("qr_code_list sends the mode filter", async () => {
    const { calls } = await runTool("qr_code_list", { mode: "dynamic" });
    expect(calls[0].params).toEqual({ mode: "dynamic" });
  });

  it("qr_code_create sends a missing optional part as empty, never as 'undefined'", async () => {
    const { calls } = await runTool("qr_code_create", { type: "wifi", wifiName: "Cafe", wifiAuthenticationType: "nopass", templateId: "tpl1" });
    expect(route(calls[0])).toBe("POST /api/qr-code/wifi");
    expect(calls[0].body.qrCodeTarget).toEqual({ type: "wifi", wifi: { name: "Cafe", authenticationType: "nopass", password: "" } });
    expect(JSON.stringify(calls[0].body)).not.toContain("undefined");
  });

  it("qr_code_create refuses a type whose required field is missing, before any request", async () => {
    await expect(runTool("qr_code_create", { type: "email", templateId: "tpl1" })).rejects.toBeInstanceOf(ToolInputError);
    await expect(runTool("qr_code_create", { type: "geolocation", latitude: 30, templateId: "tpl1" })).rejects.toThrow(/longitude/);
  });

  it("qr_code_update keeps the current name and template and replaces the target", async () => {
    const { calls } = await runTool("qr_code_update", { version: 1, id: "qr1", type: "email", email: "hi@menu.example", emailSubject: "Table" }, undefined, [QR_CODE, QR_CODE]);
    expect(calls.map(route)).toEqual(["GET /api/qr-code/qr1", "PUT /api/qr-code/email/qr1"]);
    expect(calls[1].body).toMatchObject({
      name: "Menu",
      templateId: "tpl1",
      qrCodeTarget: { type: "email", email: { email: "hi@menu.example", subject: "Table", body: "" } },
    });
  });

  it("qr_code_delete deletes by id", async () => {
    const { calls, value } = await runTool("qr_code_delete", { version: 1, id: "qr1" });
    expect(route(calls[0])).toBe("DELETE /api/qr-code/qr1");
    expect(value).toEqual({ deleted: true, id: "qr1" });
  });

  it("qr_code_delete's confirmation only reads, names the code and quotes the delete price", async () => {
    const { text, calls } = await previewTool("qr_code_delete", { version: 1, id: "qr1" }, QR_CODE);
    expect(calls.every((call) => call.method === "GET")).toBe(true);
    expect(text).toContain("Menu");
    expect(text).toContain("cannot be undone");
    expect(findTool("qr_code_delete").confirm?.costFeaturePath).toBe("qrCodeGenerator.deleteQrCode");
  });
});

describe("mcp qr-codes render and scannability (QD)", () => {
  const LINK = { url: "https://api.posty5.com/api/qr-code/build-qr/abc?format=pdf&sig=s", expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() };

  it("both are read tools: read-only, idempotent, not destructive", () => {
    const tools = listTools().filter((tool) => ["qr_code_render", "qr_code_check_scannability"].includes(tool.name));
    expect(tools).toHaveLength(2);
    for (const tool of tools) {
      expect(tool).toMatchObject({ toolset: "qr-codes", access: "read", requiresConfirm: false });
      expect(tool.annotations).toEqual({ readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false });
    }
  });

  it("qr_code_render mints an export link and answers it with its print size and lifetime, no bytes", async () => {
    const { calls, value } = await runTool("qr_code_render", { qrCodeId: "qr1", format: "pdf" }, LINK);
    expect(route(calls[0])).toBe("GET /api/qr-code/qr1/export-url");
    expect(calls[0].params).toEqual({ format: "pdf" });
    expect(value).toMatchObject({ url: LINK.url, expiresAt: LINK.expiresAt, format: "pdf", presetId: "flyer-5cm", sizeMm: 50 });
    expect((value as { expiresInMinutes: number }).expiresInMinutes).toBeGreaterThanOrEqual(59);
    expect(value).not.toHaveProperty("sizePx");
  });

  it("qr_code_render gives a PNG's pixel width at a preset and DPI", async () => {
    const { calls, value } = await runTool("qr_code_render", { qrCodeId: "qr1", format: "png", presetId: "business-card", dpi: 600 }, LINK);
    expect(calls[0].params).toEqual({ format: "png", presetId: "business-card", dpi: 600 });
    expect(value).toMatchObject({ sizeMm: 25, sizePx: 591 });
  });

  it("qr_code_render takes the preset list from @posty5/qr-design and refuses mismatched sizes before any call", async () => {
    const presetIds = (QR_CODE_TOOLS.find((tool) => tool.name === "qr_code_render")!.input.shape as any).presetId.unwrap().options;
    expect(presetIds).toEqual(QrPrintPresets.map((preset) => preset.id));
    await expect(runTool("qr_code_render", { qrCodeId: "qr1", format: "png", dpi: 300 })).rejects.toThrow(ToolInputError);
    await expect(runTool("qr_code_render", { qrCodeId: "qr1", format: "svg", presetId: "flyer-5cm", dpi: 300 })).rejects.toThrow(ToolInputError);
    await expect(runTool("qr_code_render", { qrCodeId: "qr1", format: "pdf", presetId: "custom" })).rejects.toThrow(ToolInputError);
    await expect(runTool("qr_code_render", { qrCodeId: "qr1", format: "pdf", customMm: 40 })).rejects.toThrow(ToolInputError);
    expect(() => findTool("qr_code_render").input.parse({ qrCodeId: "qr1", format: "png", dpi: 200 })).toThrow();
  });

  it("qr_code_render relays a plan refusal with the plain-PNG hint; a missing code maps to notFound", async () => {
    const gate = "This feature is not available on your current plan.";
    const throwing = (error: Error) => ({ createdFrom: "mcp", get: async () => { throw error; } }) as unknown as HttpClient;
    const tool = findTool("qr_code_render");
    const run = (http: HttpClient, args: Record<string, unknown>) => tool.run(tool.input.parse(args) as any, { clients: createClients(http), call: fakeCall(tool, args) });

    const refused = (await run(throwing(new AuthorizationError(gate)), { qrCodeId: "qr1", format: "svg" }).catch((error) => error)) as AuthorizationError;
    expect(refused).toBeInstanceOf(AuthorizationError);
    expect(mapToolError(refused, false)).toMatchObject({ code: "forbidden", message: expect.stringContaining(gate) });
    expect(refused.message).toContain('format "png"');

    const missing = await run(throwing(new NotFoundError("QR Code not found")), { qrCodeId: "nope", format: "png" }).catch((error) => error);
    expect(mapToolError(missing, false).code).toBe("notFound");
  });

  it("qr_code_check_scannability takes exactly one of qrCodeId or templateId", async () => {
    const report = { verdict: "warning", checks: [{ code: "contrast", status: "warning", value: 4, thresholds: { warning: 4.5, poor: 3 }, messageKey: "qrScannability.contrast.warning", message: "Low contrast" }], symbol: { version: 3, size: 29, ecLevel: "M", quietZoneModules: 4 } };
    const byQr = await runTool("qr_code_check_scannability", { qrCodeId: "qr1", presetId: "business-card" }, report);
    expect(route(byQr.calls[0])).toBe("POST /api/qr-code/scannability-check");
    expect(byQr.calls[0].body).toEqual({ qrCodeId: "qr1", presetId: "business-card" });
    expect(byQr.value).toEqual(report);

    const byTemplate = await runTool("qr_code_check_scannability", { templateId: "tpl1" }, report);
    expect(byTemplate.calls[0].body).toEqual({ templateId: "tpl1" });

    await expect(runTool("qr_code_check_scannability", {})).rejects.toThrow(ToolInputError);
    await expect(runTool("qr_code_check_scannability", { qrCodeId: "qr1", templateId: "tpl1" })).rejects.toThrow(ToolInputError);
  });
});
