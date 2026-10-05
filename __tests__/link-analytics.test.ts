import {
  ILinkAnalyticsQuery,
  toIsoDateString,
  toLinkAnalyticsPath,
  toLinkAnalyticsQuery,
  toLinkStatisticsPath,
  toLinkStatisticsQuery,
} from "@posty5/core";

/**
 * `@posty5/core` analytics query serialization, shared by
 * `ShortLinkClient.getAnalytics()` and `QRCodeClient.getAnalytics()`.
 * Offline only; the clients' routes are pinned in `short-link.test.ts` and
 * `qr-code.test.ts`.
 */
describe("Link analytics query (offline)", () => {
  it("sends nothing when there is no query, so the API defaults apply (every breakdown the plan allows)", () => {
    expect(toLinkAnalyticsQuery()).toEqual({});
    expect(toLinkAnalyticsQuery({})).toEqual({});
  });

  it("joins an explicit breakdown list with commas", () => {
    expect(toLinkAnalyticsQuery({ breakdown: ["country", "device", "os"] })).toEqual({ breakdown: "country,device,os" });
  });

  it('passes "all" through and omits an empty list (the API then returns every allowed breakdown)', () => {
    expect(toLinkAnalyticsQuery({ breakdown: "all" })).toEqual({ breakdown: "all" });
    expect(toLinkAnalyticsQuery({ breakdown: [] })).toEqual({});
  });

  it("sends a Date as its UTC calendar day and a string as given", () => {
    const query: ILinkAnalyticsQuery = { from: new Date("2026-10-01T23:30:00.000Z"), to: "2026-10-31" };

    expect(toLinkAnalyticsQuery(query)).toEqual({ from: "2026-10-01", to: "2026-10-31" });
    expect(toIsoDateString("2026-10-05T10:00:00+03:00")).toBe("2026-10-05T10:00:00+03:00");
  });

  it("passes interval, tz and limit through unvalidated (the API answers 400)", () => {
    expect(toLinkAnalyticsQuery({ interval: "week", tz: "Not/AZone", limit: 50 })).toEqual({
      interval: "week",
      tz: "Not/AZone",
      limit: 50,
    });
  });

  it("does not modify the caller's query", () => {
    const query: ILinkAnalyticsQuery = { from: new Date("2026-10-01T00:00:00.000Z"), breakdown: ["channel", "device"] };

    toLinkAnalyticsQuery(query);

    expect(query.from).toBeInstanceOf(Date);
    expect(query.breakdown).toEqual(["channel", "device"]);
  });

  it("rejects unknown breakdown names and intervals at compile time", () => {
    // Never called: the assertions are the `@ts-expect-error` lines, which
    // fail the type check of this file if the unions ever widen to string.
    const compileOnly = () => {
      // @ts-expect-error "city" is not a C2 breakdown
      toLinkAnalyticsQuery({ breakdown: ["city"] });
      // @ts-expect-error "year" is not an interval
      toLinkAnalyticsQuery({ interval: "year" });
    };
    expect(typeof compileOnly).toBe("function");
  });

  it("builds <basePath>/<id>/analytics", () => {
    expect(toLinkAnalyticsPath("/api/short-link", "sl1")).toBe("/api/short-link/sl1/analytics");
  });
});

describe("Link statistics query (offline)", () => {
  it("sends nothing when there is no query, so the API's 30-day default applies", () => {
    expect(toLinkStatisticsQuery()).toEqual({});
    expect(toLinkStatisticsQuery({})).toEqual({});
  });

  it("sends period as given and dates as YYYY-MM-DD", () => {
    expect(toLinkStatisticsQuery({ period: "7d" })).toEqual({ period: "7d" });
    expect(toLinkStatisticsQuery({ from: new Date("2026-10-01T23:30:00.000Z"), to: "2026-10-31" })).toEqual({ from: "2026-10-01", to: "2026-10-31" });
  });

  it("rejects an unknown period at compile time", () => {
    const compileOnly = () => {
      // @ts-expect-error "year" is not a statistics period
      toLinkStatisticsQuery({ period: "year" });
    };
    expect(typeof compileOnly).toBe("function");
  });

  it("builds <basePath>/statistics", () => {
    expect(toLinkStatisticsPath("/api/qr-code")).toBe("/api/qr-code/statistics");
  });
});
