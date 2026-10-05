jest.mock("../../posty5-mcp/src/config/limits.config", () => ({
  ...jest.requireActual("../../posty5-mcp/src/config/limits.config"),
  MCP_BULK_JOB_WAIT_MS: 30,
  MCP_BULK_JOB_POLL_MS: 5,
}));

import { AuthorizationError, Posty5BulkCreateError } from "@posty5/core";
import { unwrapBulkError } from "../../posty5-mcp/src/core/link-bulk.helper";
import { ToolInputError } from "../../posty5-mcp/src/core/tool-input.error";
import { SHORT_LINK_TOOLS } from "../../posty5-mcp/src/toolsets/short-links.tools";
import { findTool, previewTool, route, runTool } from "./mcp-test.helper";

/**
 * The batch tools of link-qr-bulk-and-webhooks (BW-D12): short_link_create_many,
 * qr_code_create_many (sync and zip job), qr_code_get_bulk_job. Offline: a
 * stub HttpClient records the requests.
 */

const BULK_RESULT = {
  created: 1,
  failed: 1,
  items: [
    { row: 1, status: "created", id: "a" },
    { row: 2, status: "failed", errors: [{ field: "url", message: "bad" }] },
  ],
};
const job = (status: string, files = {}) => ({ _id: "job1", kind: "qrCodes", status, source: { format: "json", rowCount: 2 }, progress: { processed: 2, created: 2, failed: 0 }, files, options: {}, createdAt: "" });
const SIGNED = { url: "https://r2.example/zip?sig=1", expiresAt: "2026-10-06T10:15:00Z" };

describe("mcp link batch tools", () => {
  it("short-links keeps its order with short_link_create_many after short_link_create", () => {
    expect(SHORT_LINK_TOOLS.map((tool) => tool.name)).toEqual(["short_link_list", "short_link_get", "short_link_create", "short_link_create_many", "short_link_update", "short_link_delete"]);
  });

  it("both create tools are write and quote a price; qr_code_get_bulk_job is read", () => {
    expect(findTool("short_link_create_many").access).toBe("write");
    expect(findTool("qr_code_create_many").access).toBe("write");
    expect(findTool("short_link_create_many").confirm?.costFeaturePath).toBe("urlShortener.createShortLink");
    expect(findTool("qr_code_create_many").confirm?.costFeaturePath).toBe("qrCodeGenerator.generateQrCode");
    expect(findTool("qr_code_get_bulk_job").access).toBe("read");
  });

  it("refuses 26 rows, naming the cap", () => {
    const rows = Array.from({ length: 26 }, () => ({ url: "https://a.example" }));
    const parsed = findTool("short_link_create_many").input.safeParse({ rows });
    expect(parsed.success).toBe(false);
    expect(JSON.stringify(parsed.error?.issues)).toContain("At most 25 rows");
  });

  it("the confirmation names the row count and makes no request", async () => {
    const { text, calls } = await previewTool("short_link_create_many", { rows: [{ url: "https://a.example" }, { url: "https://b.example" }] });
    expect(text).toContain("Create 2 short links");
    expect(calls).toHaveLength(0);
  });

  it("short_link_create_many posts the rows with their defaults", async () => {
    const tool = findTool("short_link_create_many");
    const { calls, value } = await runTool("short_link_create_many", { rows: [{ url: "https://a.example" }, { url: "https://b.example" }], defaults: { templateId: "tpl1" } }, BULK_RESULT);
    expect(route(calls[0])).toBe("POST /api/short-link/bulk");
    expect(calls[0].body).toMatchObject({ links: [{ url: "https://a.example" }, { url: "https://b.example" }], defaults: { templateId: "tpl1" } });
    expect(value).toEqual(BULK_RESULT);
    expect(tool.entity?.(value, {} as any)).toEqual({ entityType: "shortLink", count: 1 });
  });

  it("qr_code_create_many turns flat rows into type-tagged rows, dynamic by default, Wi-Fi static", async () => {
    const { calls } = await runTool(
      "qr_code_create_many",
      {
        rows: [
          { type: "url", url: "https://menu.example", name: "Menu" },
          { type: "wifi", wifiName: "Cafe", wifiAuthenticationType: "WPA", wifiPassword: "pw" },
        ],
        defaults: { templateId: "tpl1" },
      },
      BULK_RESULT,
    );
    expect(route(calls[0])).toBe("POST /api/qr-code/bulk");
    expect(calls[0].body.items).toEqual([
      expect.objectContaining({ type: "url", target: { url: "https://menu.example" }, mode: "dynamic", name: "Menu" }),
      expect.objectContaining({ type: "wifi", target: { name: "Cafe", authenticationType: "WPA", password: "pw" }, mode: "static" }),
    ]);
  });

  it("qr_code_create_many refuses a row missing its type's fields before any request", async () => {
    await expect(runTool("qr_code_create_many", { rows: [{ type: "email" }] })).rejects.toBeInstanceOf(ToolInputError);
  });

  it("zip: true starts a JSON bulk job and answers signed links once it finishes", async () => {
    const { calls, value } = await runTool("qr_code_create_many", { rows: [{ type: "freeText", text: "hi" }], zip: true }, undefined, [job("queued"), job("succeeded", { zip: true }), SIGNED]);
    expect(route(calls[0])).toBe("POST /api/link-bulk-jobs");
    expect(calls[0].body).toMatchObject({ kind: "qrCodes", format: "json", options: { image: { format: "png" } } });
    expect(JSON.parse(calls[0].body.content)).toEqual([expect.objectContaining({ type: "freeText", target: { text: "hi" } })]);
    expect(route(calls[1])).toBe("GET /api/link-bulk-jobs/job1");
    expect(calls[2].params).toEqual({ file: "zip" });
    expect(value).toMatchObject({ jobId: "job1", status: "succeeded", zip: SIGNED });
  });

  it("zip: true hands back the jobId when the job outlives the wait", async () => {
    const { value } = await runTool("qr_code_create_many", { rows: [{ type: "freeText", text: "hi" }], zip: true }, job("running"));
    expect(value).toMatchObject({ jobId: "job1", status: "running" });
    expect((value as any).next).toContain("qr_code_get_bulk_job");
    expect((value as any).zip).toBeUndefined();
  });

  it("qr_code_get_bulk_job reads the job and its signed links", async () => {
    const { calls, value } = await runTool("qr_code_get_bulk_job", { jobId: "job1" }, undefined, [job("partiallySucceeded", { zip: true, errors: true }), SIGNED, SIGNED]);
    expect(calls.map(route)).toEqual(["GET /api/link-bulk-jobs/job1", "GET /api/link-bulk-jobs/job1/result-url", "GET /api/link-bulk-jobs/job1/result-url"]);
    expect(value).toMatchObject({ zip: SIGNED, errors: SIGNED });
  });

  it("a whole-batch refusal surfaces the API's own error, not the bulk wrapper", async () => {
    const cause = new AuthorizationError("Upgrade your plan");
    await expect(unwrapBulkError(() => Promise.reject(new Posty5BulkCreateError(cause, { created: 0, failed: 0, items: [] })))).rejects.toBe(cause);
  });
});
