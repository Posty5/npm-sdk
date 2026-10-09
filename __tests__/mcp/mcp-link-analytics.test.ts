import { findTool, route, runTool } from "./mcp-test.helper";

/**
 * Visit analytics tools of link-qr-visit-analytics (roadmap C2):
 * short_link_get_analytics, qr_code_get_analytics. Offline: a stub HttpClient
 * records the requests.
 */

const ANSWER = {
  totals: { visits: 4, uniqueVisitors: 3, botVisits: 1 },
  series: [],
  breakdowns: { device: [{ key: "mobile", visits: 4 }] },
  meta: { locked: [{ breakdown: "country", requiredPlan: "starter" }], maxHistoryDays: 30, timezone: "UTC", analyticsStartedAt: "2026-10-05" },
};

describe("mcp link analytics tools", () => {
  it.each([
    ["short_link_get_analytics", "short-links", "/api/short-link/l1/analytics"],
    ["qr_code_get_analytics", "qr-codes", "/api/qr-code/l1/analytics"],
  ])("%s is a read tool that maps to GET <base>/:id/analytics", async (name, toolset, url) => {
    const tool = findTool(name);
    expect(tool.toolset).toBe(toolset);
    expect(tool.access).toBe("read");
    expect(tool.confirm).toBeUndefined();

    const { value, calls } = await runTool(name, { id: "l1", from: "2026-10-01", to: "2026-10-07", interval: "week", breakdown: ["device", "country"], limit: 5 }, ANSWER);
    expect(calls.map(route)).toEqual([`GET ${url}`]);
    expect(calls[0].params).toMatchObject({ from: "2026-10-01", to: "2026-10-07", interval: "week", breakdown: "device,country", limit: 5 });
    expect(calls[0].params).not.toHaveProperty("id");
    // meta.locked passes through unchanged, so the agent can name the plan.
    expect(value).toEqual(ANSWER);
  });

  it('accepts "all" and refuses an unknown breakdown or a limit over 50', () => {
    const input = findTool("short_link_get_analytics").input;
    expect(input.safeParse({ id: "l1", breakdown: "all" }).success).toBe(true);
    expect(input.safeParse({ id: "l1", breakdown: ["ip"] }).success).toBe(false);
    expect(input.safeParse({ id: "l1", limit: 51 }).success).toBe(false);
  });
});
