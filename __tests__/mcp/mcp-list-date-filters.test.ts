import { findTool, route, runTool } from "./mcp-test.helper";

/**
 * The created-at window on the four list tools (redesign-dashboards MCP-01):
 * `fromDate` / `toDate` reach the API as query params, a non-`YYYY-MM-DD`
 * value is refused by the schema before any call, and each tool's
 * description names the filter. Offline — a stub HttpClient records the
 * requests.
 */

const LIST_TOOLS = [
  { name: "short_link_list", route: "GET /api/short-link" },
  { name: "qr_code_list", route: "GET /api/qr-code" },
  { name: "html_page_list", route: "GET /api/html-hosting" },
  { name: "social_post_list", route: "GET /api/social-publisher-post" },
];

describe("mcp list tools — created-at date filters", () => {
  it.each(LIST_TOOLS)("$name sends fromDate and toDate with its other filters", async ({ name, route: expected }) => {
    const { calls } = await runTool(name, { tag: "spring", fromDate: "2026-10-01", toDate: "2026-10-07", page: 1 }, { items: [], pagination: {} });
    expect(route(calls[0])).toBe(expected);
    expect(calls[0].params).toEqual({ tag: "spring", fromDate: "2026-10-01", toDate: "2026-10-07", page: 1 });
  });

  it.each(LIST_TOOLS)("$name sends no date key when none is given", async ({ name }) => {
    const { calls } = await runTool(name, { tag: "spring" }, { items: [], pagination: {} });
    expect(calls[0].params).toEqual({ tag: "spring" });
  });

  it.each(LIST_TOOLS)("$name refuses a malformed date before any call", async ({ name }) => {
    await expect(runTool(name, { fromDate: "2026/10/01", toDate: "2026-10-07" })).rejects.toThrow("YYYY-MM-DD");
    await expect(runTool(name, { fromDate: "2026-10-01", toDate: "7 Oct 2026" })).rejects.toThrow("YYYY-MM-DD");
  });

  it.each(LIST_TOOLS)("$name's description names the date filter", ({ name }) => {
    expect(findTool(name).description).toContain("fromDate and toDate together");
  });
});
