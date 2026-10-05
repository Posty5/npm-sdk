import { ToolInputError } from "../../posty5-mcp/src/core/tool-input.error";
import { QR_CODE_TOOLS } from "../../posty5-mcp/src/toolsets/qr-codes.tools";
import { findTool, previewTool, route, runTool } from "./mcp-test.helper";

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
  it("holds the catalogue's six tools, in its order", () => {
    expect(QR_CODE_TOOLS.map((tool) => tool.name)).toEqual(["qr_code_list", "qr_code_get", "qr_code_list_templates", "qr_code_create", "qr_code_update", "qr_code_delete"]);
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
      options: { text: "https://menu.example" },
      createdFrom: "mcp",
    });
    expect(findTool("qr_code_create").entity?.(value, {})).toEqual({ entityType: "qrCode", entityId: "qr1" });
  });

  it("qr_code_create encodes a missing optional part as empty, never as 'undefined'", async () => {
    const { calls } = await runTool("qr_code_create", { type: "wifi", wifiName: "Cafe", wifiAuthenticationType: "nopass", templateId: "tpl1" });
    expect(route(calls[0])).toBe("POST /api/qr-code/wifi");
    expect(calls[0].body.qrCodeTarget).toEqual({ type: "wifi", wifi: { name: "Cafe", authenticationType: "nopass", password: "" } });
    expect(calls[0].body.options.text).not.toContain("undefined");
  });

  it("qr_code_create refuses a type whose required field is missing, before any request", async () => {
    await expect(runTool("qr_code_create", { type: "email", templateId: "tpl1" })).rejects.toBeInstanceOf(ToolInputError);
    await expect(runTool("qr_code_create", { type: "geolocation", latitude: 30, templateId: "tpl1" })).rejects.toThrow(/longitude/);
  });

  it("qr_code_update keeps the current name and template and replaces the target", async () => {
    const { calls } = await runTool("qr_code_update", { id: "qr1", type: "email", email: "hi@menu.example", emailSubject: "Table" }, undefined, [QR_CODE, QR_CODE]);
    expect(calls.map(route)).toEqual(["GET /api/qr-code/qr1", "PUT /api/qr-code/email/qr1"]);
    expect(calls[1].body).toMatchObject({
      name: "Menu",
      templateId: "tpl1",
      qrCodeTarget: { type: "email", email: { email: "hi@menu.example", subject: "Table", body: "" } },
    });
  });

  it("qr_code_delete deletes by id", async () => {
    const { calls, value } = await runTool("qr_code_delete", { id: "qr1" });
    expect(route(calls[0])).toBe("DELETE /api/qr-code/qr1");
    expect(value).toEqual({ deleted: true, id: "qr1" });
  });

  it("qr_code_delete's confirmation only reads, names the code and quotes the delete price", async () => {
    const { text, calls } = await previewTool("qr_code_delete", { id: "qr1" }, QR_CODE);
    expect(calls.every((call) => call.method === "GET")).toBe(true);
    expect(text).toContain("Menu");
    expect(text).toContain("cannot be undone");
    expect(findTool("qr_code_delete").confirm?.costFeaturePath).toBe("qrCodeGenerator.deleteQrCode");
  });
});
