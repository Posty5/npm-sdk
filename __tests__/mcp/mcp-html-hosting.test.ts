import { INLINE_HTML_MAX_BYTES } from "../../posty5-mcp/src/config/limits.config";
import { ToolInputError } from "../../posty5-mcp/src/core/tool-input.error";
import { HTML_HOSTING_TOOLS } from "../../posty5-mcp/src/toolsets/html-hosting.tools";
import { findTool, previewTool, route, runTool } from "./mcp-test.helper";

/**
 * The html-hosting toolset (mcp-tool-catalogue-package): pages, variables and
 * form submissions, every tool pinned to the SDK route it calls. Offline — a
 * stub HttpClient records the API requests and a fake `fetch` records the
 * file upload the SDK makes to the signed URL.
 */

const PAGE = {
  _id: "p1",
  htmlHostingId: "abc",
  name: "Landing",
  shorterLink: "https://posty5.com/h/abc",
  numberOfVisitors: 3,
  autoSaveInGoogleSheet: true,
  formSubmission: { numberOfFormSubmission: 4 },
};
const UPLOAD_URL = "https://upload.example/p1/index.html?signature=1";
const FILE_SAVED = { details: { _id: "p1", shorterLink: PAGE.shorterLink, fileUrl: "https://files.example/p1/index.html" }, uploadFileConfig: { uploadUrl: UPLOAD_URL } };
const GITHUB_SAVED = { details: { _id: "p1", shorterLink: PAGE.shorterLink, githubInfo: { fileURL: "https://github.com/acme/site/blob/main/index.html" } } };
const GITHUB_URL = "https://github.com/acme/site/blob/main/index.html";
const VARIABLE = { _id: "v1", name: "API base", key: "pst5_api", value: "https://api.example", tag: "prod", refId: "r1" };
const SUBMISSION = { _id: "s1", numbering: "0007", createdAt: "2026-10-01T10:00:00Z", htmlHosting: { _id: "p1", name: "Landing" }, data: { email: "visitor@example.com" } };

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

describe("mcp html-hosting toolset — pages", () => {
  it("holds the catalogue's twenty tools, in its order", () => {
    expect(HTML_HOSTING_TOOLS.map((tool) => tool.name)).toEqual([
      "html_page_list",
      "html_page_get",
      "html_page_lookup",
      "html_page_list_forms",
      "html_page_create_from_html",
      "html_page_create_from_github",
      "html_page_update_from_html",
      "html_page_update_from_github",
      "html_page_clean_cache",
      "html_page_delete",
      "html_variable_list",
      "html_variable_get",
      "html_variable_create",
      "html_variable_update",
      "html_variable_delete",
      "form_submission_list",
      "form_submission_get",
      "form_submission_get_adjacent",
      "form_submission_change_status",
      "form_submission_delete",
    ]);
  });

  it("html_page_list sends its filters and paging as query params", async () => {
    const { calls } = await runTool("html_page_list", { name: "Land", status: "approved", sourceType: "github", page: 1, pageSize: 10 });
    expect(route(calls[0])).toBe("GET /api/html-hosting");
    expect(calls[0].params).toEqual({ name: "Land", status: "approved", sourceType: "github", page: 1, pageSize: 10 });
  });

  it("html_page_get reads one page by id", async () => {
    const { calls } = await runTool("html_page_get", { id: "p1" }, PAGE);
    expect(route(calls[0])).toBe("GET /api/html-hosting/p1");
  });

  it("html_page_lookup reads the light page list", async () => {
    const { calls } = await runTool("html_page_lookup", {}, []);
    expect(route(calls[0])).toBe("GET /api/html-hosting/lookup");
  });

  it("html_page_list_forms reads a page's forms", async () => {
    const { calls } = await runTool("html_page_list_forms", { id: "p1" }, []);
    expect(route(calls[0])).toBe("GET /api/html-hosting/lookup-froms/p1");
  });

  it("html_page_create_from_html creates the page and uploads the HTML as index.html", async () => {
    const html = "<!doctype html><title>Hi</title><p>Hello</p>";
    const { calls, value } = await runTool("html_page_create_from_html", { html, name: "Landing", tag: "launch" }, FILE_SAVED);
    expect(route(calls[0])).toBe("POST /api/html-hosting/file");
    expect(calls[0].body).toMatchObject({ name: "Landing", tag: "launch", fileName: "index.html", createdFrom: "mcp" });
    expect(uploads).toHaveLength(1);
    expect(uploads[0].url).toBe(UPLOAD_URL);
    expect(uploads[0].init.method).toBe("PUT");
    expect(uploads[0].init.headers["Content-Type"]).toBe("text/html");
    expect(uploads[0].init.body).toBeInstanceOf(Blob);
    expect(uploads[0].init.body.size).toBe(Buffer.byteLength(html, "utf8"));
    expect(value).toEqual({ _id: "p1", shorterLink: PAGE.shorterLink, fileUrl: FILE_SAVED.details.fileUrl });
  });

  it("html_page_create_from_html refuses HTML over the inline cap, counting bytes, before any request", async () => {
    await expect(runTool("html_page_create_from_html", { html: "a".repeat(INLINE_HTML_MAX_BYTES + 1), name: "Big" }, FILE_SAVED)).rejects.toBeInstanceOf(ToolInputError);
    // Under the cap in characters, over it in UTF-8 bytes.
    await expect(runTool("html_page_create_from_html", { html: "é".repeat(INLINE_HTML_MAX_BYTES / 2 + 1), name: "Big" }, FILE_SAVED)).rejects.toThrow(/html_page_create_from_github/);
    expect(uploads).toHaveLength(0);
  });

  it("html_page_create_from_github sends the GitHub file URL", async () => {
    const { calls } = await runTool("html_page_create_from_github", { githubFileUrl: GITHUB_URL, name: "Landing" }, GITHUB_SAVED);
    expect(route(calls[0])).toBe("POST /api/html-hosting/github");
    expect(calls[0].body).toMatchObject({ name: "Landing", githubInfo: { fileURL: GITHUB_URL }, createdFrom: "mcp" });
  });

  it("html_page_update_from_html keeps the current name and sheet setting and uploads the new file", async () => {
    const { calls } = await runTool("html_page_update_from_html", { version: 1, id: "p1", html: "<p>v2</p>" }, undefined, [PAGE, FILE_SAVED]);
    expect(calls.map(route)).toEqual(["GET /api/html-hosting/p1", "PUT /api/html-hosting/p1/file"]);
    expect(calls[1].body).toEqual({ name: "Landing", autoSaveInGoogleSheet: true, fileName: "index.html", isNewFile: true });
    expect(uploads.map((upload) => upload.url)).toEqual([UPLOAD_URL]);
  });

  it("html_page_update_from_html refuses HTML over the inline cap before any request", async () => {
    await expect(runTool("html_page_update_from_html", { version: 1, id: "p1", html: "a".repeat(INLINE_HTML_MAX_BYTES + 1) }, undefined, [PAGE, FILE_SAVED])).rejects.toThrow(
      /html_page_update_from_github/,
    );
    expect(uploads).toHaveLength(0);
  });

  it("html_page_update_from_github sends the new name and the GitHub file URL", async () => {
    const { calls } = await runTool("html_page_update_from_github", { version: 1, id: "p1", githubFileUrl: GITHUB_URL, name: "Landing v2" }, undefined, [PAGE, GITHUB_SAVED]);
    expect(calls.map(route)).toEqual(["GET /api/html-hosting/p1", "PUT /api/html-hosting/p1/github"]);
    expect(calls[1].body).toEqual({ name: "Landing v2", autoSaveInGoogleSheet: true, githubInfo: { fileURL: GITHUB_URL } });
  });

  it("html_page_clean_cache clears one page's cache", async () => {
    const { calls, value } = await runTool("html_page_clean_cache", { id: "p1" });
    expect(route(calls[0])).toBe("PUT /api/html-hosting/p1/clean-cache");
    expect(value).toEqual({ cacheCleaned: true, id: "p1" });
  });

  it("html_page_delete deletes by id", async () => {
    const { calls } = await runTool("html_page_delete", { version: 1, id: "p1" });
    expect(route(calls[0])).toBe("DELETE /api/html-hosting/p1");
  });

  it("html_page_delete's confirmation only reads, names the page and quotes the delete price", async () => {
    const { text, calls } = await previewTool("html_page_delete", { version: 1, id: "p1" }, PAGE);
    expect(calls.every((call) => call.method === "GET")).toBe(true);
    expect(text).toContain("Landing");
    expect(text).toContain("4 form submissions");
    expect(text).toContain("cannot be undone");
    expect(findTool("html_page_delete").confirm?.costFeaturePath).toBe("htmlHosting.deleteHtmlPage");
  });
});

describe("mcp html-hosting toolset — variables", () => {
  it("html_variable_list sends its filters and paging as query params", async () => {
    const { calls } = await runTool("html_variable_list", { key: "pst5_api", page: 1 });
    expect(route(calls[0])).toBe("GET /api/html-hosting-variables");
    expect(calls[0].params).toEqual({ key: "pst5_api", page: 1 });
  });

  it("html_variable_get reads one variable by id", async () => {
    const { calls } = await runTool("html_variable_get", { id: "v1" }, VARIABLE);
    expect(route(calls[0])).toBe("GET /api/html-hosting-variables/v1");
  });

  it("html_variable_create sends the variable, and its schema refuses a key without the pst5_ prefix", async () => {
    const { calls, value } = await runTool("html_variable_create", { name: "API base", key: "pst5_api", value: "https://api.example" });
    expect(route(calls[0])).toBe("POST /api/html-hosting-variables");
    expect(calls[0].body).toMatchObject({ name: "API base", key: "pst5_api", value: "https://api.example", createdFrom: "mcp" });
    expect(value).toEqual({ created: true, key: "pst5_api" });

    await expect(runTool("html_variable_create", { name: "API base", key: "api", value: "x" })).rejects.toThrow();
  });

  it("html_variable_update keeps the fields left out", async () => {
    const { calls } = await runTool("html_variable_update", { version: 1, id: "v1", value: "https://api2.example" }, undefined, [VARIABLE, {}]);
    expect(calls.map(route)).toEqual(["GET /api/html-hosting-variables/v1", "PUT /api/html-hosting-variables/v1"]);
    expect(calls[1].body).toEqual({ name: "API base", key: "pst5_api", value: "https://api2.example", refId: "r1", tag: "prod" });
  });

  it("html_variable_delete deletes by id", async () => {
    const { calls } = await runTool("html_variable_delete", { version: 1, id: "v1" });
    expect(route(calls[0])).toBe("DELETE /api/html-hosting-variables/v1");
  });

  it("html_variable_delete's confirmation only reads, names the key and quotes the delete price", async () => {
    const { text, calls } = await previewTool("html_variable_delete", { version: 1, id: "v1" }, VARIABLE);
    expect(calls.every((call) => call.method === "GET")).toBe(true);
    expect(text).toContain("pst5_api");
    expect(findTool("html_variable_delete").confirm?.costFeaturePath).toBe("htmlHosting.deleteVariable");
  });
});

describe("mcp html-hosting toolset — form submissions", () => {
  it("form_submission_list needs the page id, passes the filters and is marked open-world", async () => {
    const { calls } = await runTool("form_submission_list", { htmlHostingId: "p1", formId: "contact", status: "new", page: 1, pageSize: 20 });
    expect(route(calls[0])).toBe("GET /api/html-hosting-form-submission");
    expect(calls[0].params).toEqual({ htmlHostingId: "p1", formId: "contact", status: "new", page: 1, pageSize: 20 });
    expect(findTool("form_submission_list").annotations?.openWorld).toBe(true);
    await expect(runTool("form_submission_list", {})).rejects.toThrow();
  });

  it("form_submission_get reads one submission and is marked open-world", async () => {
    const { calls } = await runTool("form_submission_get", { id: "s1" }, SUBMISSION);
    expect(route(calls[0])).toBe("GET /api/html-hosting-form-submission/s1");
    expect(findTool("form_submission_get").annotations?.openWorld).toBe(true);
  });

  it("form_submission_get_adjacent reads the neighbours", async () => {
    const { calls } = await runTool("form_submission_get_adjacent", { id: "s1" });
    expect(route(calls[0])).toBe("GET /api/html-hosting-form-submission/s1/next-previous");
  });

  it("form_submission_change_status sends the status, reason and note", async () => {
    const { calls } = await runTool("form_submission_change_status", { version: 1, id: "s1", status: "rejected", rejectedReason: "spam", notes: "bot" });
    expect(route(calls[0])).toBe("PUT /api/html-hosting-form-submission/s1/status");
    expect(calls[0].body).toEqual({ status: "rejected", rejectedReason: "spam", notes: "bot" });
  });

  it("form_submission_delete deletes by id", async () => {
    const { calls } = await runTool("form_submission_delete", { version: 1, id: "s1" });
    expect(route(calls[0])).toBe("DELETE /api/html-hosting-form-submission/s1");
  });

  it("form_submission_delete's confirmation only reads and names the submission; the route is not charged", async () => {
    const { text, calls } = await previewTool("form_submission_delete", { version: 1, id: "s1" }, SUBMISSION);
    expect(calls.every((call) => call.method === "GET")).toBe(true);
    expect(text).toContain("#0007");
    expect(text).toContain("Landing");
    expect(findTool("form_submission_delete").confirm?.costFeaturePath).toBeUndefined();
  });
});
