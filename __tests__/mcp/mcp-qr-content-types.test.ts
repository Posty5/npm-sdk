import { QR_MCP_FILE_MAX_BYTES } from "../../posty5-mcp/src/config/limits.config";
import { decodeQrFileBase64 } from "../../posty5-mcp/src/core/qr-codes.helper";
import { ToolInputError } from "../../posty5-mcp/src/core/tool-input.error";
import { QR_CODE_TOOLS } from "../../posty5-mcp/src/toolsets/qr-codes.tools";
import { findTool, route, runTool } from "./mcp-test.helper";

/**
 * qr-content-types-mcp-tools (QT-D11, QT-D12): the content types on
 * `qr_code_create` / `qr_code_update` — schema, dispatch to the SDK method,
 * mode defaults and the `file` branch (cap, data-URL prefix, upload).
 * Offline: a stub HttpClient records the API requests, a fake `fetch` the PUT.
 */

const QR_CODE = { _id: "qr1", name: "Card", templateId: "tpl1", qrCodeTarget: { type: "vcard" } };
const TICKET = { uploadFileURL: "https://r2.example/put", bucketFilePath: "qr-files/u1/menu.pdf", expiresInSeconds: 60 };
const PDF_BASE64 = Buffer.from("%PDF-1.4 test").toString("base64");

type Upload = { url: string; init: any };
const realFetch = (globalThis as any).fetch;
let uploads: Upload[] = [];

beforeEach(() => {
  uploads = [];
  (globalThis as any).fetch = jest.fn(async (url: string, init: any) => {
    uploads.push({ url, init });
    return { ok: true, status: 200, statusText: "OK" };
  });
});

afterEach(() => {
  (globalThis as any).fetch = realFetch;
});

const BRANCHES: Array<{ type: string; args: Record<string, unknown>; route: string; target: Record<string, unknown> }> = [
  { type: "vcard", args: { vcard: { firstName: "Sara", phones: [{ number: "+20 100 123 4567" }] } }, route: "/api/qr-code/vcard", target: { firstName: "Sara", phones: [{ number: "+20 100 123 4567" }] } },
  { type: "event", args: { event: { title: "Launch", startsAt: "2026-11-01T18:00:00", timezone: "Africa/Cairo" } }, route: "/api/qr-code/event", target: { title: "Launch", timezone: "Africa/Cairo" } },
  { type: "whatsapp", args: { whatsapp: { phoneNumber: "+201001234567", message: "Hi" } }, route: "/api/qr-code/whatsapp", target: { phoneNumber: "+201001234567", message: "Hi" } },
  { type: "review", args: { review: { platform: "google", placeId: "ChIJ123" } }, route: "/api/qr-code/review", target: { platform: "google", placeId: "ChIJ123" } },
  { type: "social", args: { social: { profiles: [{ platform: "instagram", handle: "posty5" }] } }, route: "/api/qr-code/social", target: { profiles: [{ platform: "instagram", handle: "posty5" }] } },
  { type: "appStore", args: { appStore: { iosUrl: "https://apps.apple.com/app/id1", fallbackUrl: "https://example.com/app" } }, route: "/api/qr-code/appStore", target: { fallbackUrl: "https://example.com/app" } },
];

describe("mcp qr-codes — content types", () => {
  it("adds no tool: the toolset keeps its eight tools in order", () => {
    expect(QR_CODE_TOOLS.map((tool) => tool.name)).toEqual(["qr_code_list", "qr_code_get", "qr_code_list_templates", "qr_code_create", "qr_code_create_many", "qr_code_get_bulk_job", "qr_code_update", "qr_code_delete"]);
  });

  it.each(BRANCHES)("qr_code_create type $type round-trips its schema and dispatches to its SDK route", async ({ type, args, route: path, target }) => {
    const { calls } = await runTool("qr_code_create", { type, templateId: "tpl1", ...args }, QR_CODE);
    expect(route(calls[0])).toBe(`POST ${path}`);
    expect(calls[0].body.qrCodeTarget).toMatchObject({ type, [type]: target });
    expect(calls[0].body.options).toBeUndefined();
  });

  it.each(BRANCHES)("qr_code_update type $type dispatches to its SDK update route", async ({ type, args, route: path }) => {
    const { calls } = await runTool("qr_code_update", { version: 1, id: "qr1", type, ...args }, undefined, [QR_CODE, QR_CODE]);
    expect(calls.map(route)).toEqual(["GET /api/qr-code/qr1", `PUT ${path}/qr1`]);
  });

  it("vcard defaults to static; event, whatsapp, review and social to dynamic; an explicit mode wins", async () => {
    const card = await runTool("qr_code_create", { type: "vcard", templateId: "tpl1", vcard: { organization: "Acme" } }, QR_CODE);
    expect(card.calls[0].body.mode).toBe("static");
    const dynamicCard = await runTool("qr_code_create", { type: "vcard", templateId: "tpl1", vcard: { organization: "Acme" }, mode: "dynamic" }, QR_CODE);
    expect(dynamicCard.calls[0].body.mode).toBe("dynamic");
    for (const branch of BRANCHES.filter((b) => ["event", "whatsapp", "review", "social"].includes(b.type))) {
      const { calls } = await runTool("qr_code_create", { type: branch.type, templateId: "tpl1", ...branch.args }, QR_CODE);
      expect(calls[0].body.mode).toBe("dynamic");
    }
  });

  it("appStore sends no mode and refuses mode static before any request", async () => {
    const { calls } = await runTool("qr_code_create", { type: "appStore", templateId: "tpl1", appStore: { fallbackUrl: "https://example.com" } }, QR_CODE);
    expect(JSON.stringify(calls[0].body)).not.toContain('"mode"');
    await expect(runTool("qr_code_create", { type: "appStore", templateId: "tpl1", appStore: { fallbackUrl: "https://example.com" }, mode: "static" })).rejects.toThrow(/cannot be static/);
  });

  it("social takes up to 12 profiles, refuses 13 in the schema and several on a static code", async () => {
    const profiles = Array.from({ length: 12 }, (_, i) => ({ platform: "other", url: `https://example.com/${i}` }));
    const { calls } = await runTool("qr_code_create", { type: "social", templateId: "tpl1", social: { profiles } }, QR_CODE);
    expect(calls[0].body.qrCodeTarget.social.profiles).toHaveLength(12);
    await expect(runTool("qr_code_create", { type: "social", templateId: "tpl1", social: { profiles: [...profiles, profiles[0]] } })).rejects.toThrow();
    await expect(runTool("qr_code_create", { type: "social", templateId: "tpl1", mode: "static", social: { profiles: profiles.slice(0, 2) } })).rejects.toBeInstanceOf(ToolInputError);
  });

  it("schemas refuse a vcard without firstName or organization and a non-Google review without url", async () => {
    await expect(runTool("qr_code_create", { type: "vcard", templateId: "tpl1", vcard: { jobTitle: "CEO" } })).rejects.toThrow(/firstName or organization/);
    await expect(runTool("qr_code_create", { type: "review", templateId: "tpl1", review: { platform: "yelp", placeId: "x" } })).rejects.toThrow(/url/);
    await expect(runTool("qr_code_create", { type: "event", templateId: "tpl1" })).rejects.toBeInstanceOf(ToolInputError);
  });

  it("strips options.text: an agent's unknown key never reaches the API", async () => {
    const { calls } = await runTool("qr_code_create", { type: "whatsapp", templateId: "tpl1", whatsapp: { phoneNumber: "+201001234567" }, options: { text: "x" } }, QR_CODE);
    expect(calls[0].body.options).toBeUndefined();
  });

  it("file: asks for an upload URL, PUTs the decoded bytes, then creates with bucketFilePath — always dynamic", async () => {
    const { calls } = await runTool("qr_code_create", { type: "file", templateId: "tpl1", fileBase64: `data:application/pdf;base64,${PDF_BASE64}`, fileName: "menu.pdf", mimeType: "application/pdf" }, undefined, [TICKET, QR_CODE]);
    expect(calls.map(route)).toEqual(["POST /api/qr-code/file/upload-url", "POST /api/qr-code/file"]);
    expect(calls[0].body).toMatchObject({ fileName: "menu.pdf", mimeType: "application/pdf", sizeBytes: Buffer.from(PDF_BASE64, "base64").byteLength });
    expect(uploads).toHaveLength(1);
    expect(uploads[0].url).toBe(TICKET.uploadFileURL);
    expect(calls[1].body.qrCodeTarget).toEqual({ type: "file", file: { fileName: "menu.pdf", bucketFilePath: TICKET.bucketFilePath } });
    expect(JSON.stringify(calls[1].body)).not.toContain('"mode"');
    await expect(runTool("qr_code_create", { type: "file", templateId: "tpl1", fileBase64: PDF_BASE64, mimeType: "application/pdf", mode: "static" })).rejects.toThrow(/cannot be static/);
  });

  it("file: create needs fileBase64 and mimeType; update without fileBase64 keeps the stored file", async () => {
    await expect(runTool("qr_code_create", { type: "file", templateId: "tpl1", fileBase64: PDF_BASE64 })).rejects.toThrow(/mimeType/);
    const { calls } = await runTool("qr_code_update", { version: 1, id: "qr1", type: "file", fileName: "menu-2026.pdf" }, undefined, [QR_CODE, QR_CODE]);
    expect(calls.map(route)).toEqual(["GET /api/qr-code/qr1", "PUT /api/qr-code/file/qr1"]);
    expect(uploads).toHaveLength(0);
  });

  it("file: strips the data-URL prefix and refuses content over the cap or malformed base64", () => {
    expect(Buffer.from(decodeQrFileBase64(`data:image/png;base64,${PDF_BASE64}`)).toString()).toBe("%PDF-1.4 test");
    const tooBig = Buffer.alloc(QR_MCP_FILE_MAX_BYTES + 1).toString("base64");
    expect(() => decodeQrFileBase64(tooBig)).toThrow(/dashboard/);
    expect(() => decodeQrFileBase64("not base64!!")).toThrow(ToolInputError);
  });

  it("qr_code_create_many rows keep the bulk route's seven types", () => {
    const parsed = findTool("qr_code_create_many").input.safeParse({ rows: [{ type: "vcard", vcard: { firstName: "Sara" } }] });
    expect(parsed.success).toBe(false);
  });
});
