import * as http from "http";
import { readFileSync } from "fs";
import * as path from "path";
import { CLIENT_HEADER_NAME, CORE_VERSION, HttpClient, shouldRetryRequest } from "@posty5/core";
import { AccountClient } from "@posty5/account";
import { StoreClient, StoreStoresClient, StoreOrdersClient } from "@posty5/store";
import { SocialPublisherAccountClient } from "@posty5/social-publisher-workspace";
import { QRCodeTemplateClient } from "@posty5/qr-code";
import { SocialPublisherPostClient } from "@posty5/social-publisher-post";
import { ShortLinkClient } from "@posty5/short-link";

/**
 * The gaps an AI agent hit (mcp-server feature, npm-sdk/sdk-agent-gaps):
 * who am I, credits, prices, stores, social accounts, QR templates, text and
 * story posts — and a core client that no longer repeats a POST the server
 * already acted on, names itself, and lets a caller set `createdFrom`.
 *
 * Offline throughout: a stub stands in for `HttpClient` to pin routes, and a
 * local socket server stands in for the API where the real client's retry and
 * header behaviour is the thing under test.
 */

type Call = { method: string; url: string; body?: any; params?: Record<string, unknown> };

function stubHttp(result: unknown = {}, createdFrom = "npmPackage") {
  const calls: Call[] = [];
  const answer = async () => ({ result, message: "" });
  const stub = {
    createdFrom,
    get: async (url: string, config?: { params?: Record<string, unknown> }) => (calls.push({ method: "GET", url, params: config?.params }), answer()),
    post: async (url: string, body?: unknown) => (calls.push({ method: "POST", url, body }), answer()),
    put: async (url: string, body?: unknown) => (calls.push({ method: "PUT", url, body }), answer()),
    delete: async (url: string) => (calls.push({ method: "DELETE", url }), answer()),
  };
  return { http: stub as unknown as HttpClient, calls };
}

const route = (call: Call) => `${call.method} ${call.url}`;

describe("core — the retry policy", () => {
  const error = (method: string, over: Record<string, unknown> = {}) => ({ config: { method }, ...over });

  it("never repeats a POST or PATCH the server answered", () => {
    expect(shouldRetryRequest(error("post", { response: { status: 500 } }))).toBe(false);
    expect(shouldRetryRequest(error("patch", { response: { status: 503 } }))).toBe(false);
    expect(shouldRetryRequest(error("post", { response: { status: 429 } }))).toBe(false);
  });

  it("repeats a POST only when the connection was never made", () => {
    expect(shouldRetryRequest(error("post", { code: "ECONNREFUSED" }))).toBe(true);
    expect(shouldRetryRequest(error("post", { code: "ECONNRESET" }))).toBe(false);
    expect(shouldRetryRequest(error("post", { code: "ECONNABORTED" }))).toBe(false);
  });

  it("repeats idempotent methods on a 5xx or a network error, as before", () => {
    expect(shouldRetryRequest(error("put", { response: { status: 500 } }))).toBe(true);
    expect(shouldRetryRequest(error("get", { response: { status: 502 } }))).toBe(true);
    expect(shouldRetryRequest(error("delete", { response: { status: 404 } }))).toBe(false);
    expect(shouldRetryRequest(error("get", { code: "ECONNRESET" }))).toBe(true);
  });
});

describe("core — against a real socket", () => {
  let server: http.Server;
  let baseUrl = "";
  const seen: { method: string; headers: http.IncomingHttpHeaders }[] = [];

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      seen.push({ method: req.method || "", headers: req.headers });
      const status = req.url?.startsWith("/fail") ? 500 : 200;
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify({ message: status === 200 ? "ok" : "boom", result: {} }));
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    baseUrl = `http://127.0.0.1:${(server.address() as any).port}`;
  });

  afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));
  beforeEach(() => (seen.length = 0));

  const client = (over: Record<string, unknown> = {}) => new HttpClient({ baseUrl, apiKey: "k1", retryDelay: 1, ...over } as any);

  it("sends a POST that answered 500 exactly once", async () => {
    await expect(client().post("/fail", {})).rejects.toBeDefined();

    expect(seen.filter((r) => r.method === "POST")).toHaveLength(1);
  });

  it("still retries a PUT that answered 500, and maxRetries 0 means none", async () => {
    await expect(client().put("/fail", {})).rejects.toBeDefined();
    expect(seen).toHaveLength(4);

    seen.length = 0;
    await expect(client({ maxRetries: 0 }).put("/fail", {})).rejects.toBeDefined();
    expect(seen).toHaveLength(1);
  });

  it("names itself on every request; a caller may rename it but never replace the key", async () => {
    await client().get("/ok");
    await client({ headers: { [CLIENT_HEADER_NAME]: "mcp/1.0.0", "X-API-Key": "stolen" } }).get("/ok");

    expect(seen[0].headers["x-posty5-client"]).toBe(`posty5-npm/${CORE_VERSION}`);
    expect(seen[1].headers["x-posty5-client"]).toBe("mcp/1.0.0");
    expect(seen[1].headers["x-api-key"]).toBe("k1");
  });

  it("reports the configured createdFrom, npmPackage by default", () => {
    expect(client().createdFrom).toBe("npmPackage");
    expect(client({ createdFrom: "mcp" }).createdFrom).toBe("mcp");
  });

  it("keeps CORE_VERSION equal to the package version", () => {
    const pkg = JSON.parse(readFileSync(path.join(__dirname, "../posty5-core/package.json"), "utf8"));
    expect(CORE_VERSION).toBe(pkg.version);
  });
});

describe("@posty5/account — routes", () => {
  it("reads who the key is, credits, history, totals and the price list", async () => {
    const { http: stub, calls } = stubHttp({});
    const account = new AccountClient(stub);

    await account.getCurrent();
    await account.getCredits();
    await account.getCreditUsage({ module: "socialMediaPublisher", settled: false }, { pageSize: 20 });
    await account.getCreditUsageSummary({ fromDate: "2026-10-01", toDate: "2026-10-04" });
    await account.getOperationCosts();

    expect(calls.map(route)).toEqual([
      "GET /api/api-key/current",
      "GET /api/user/current/credits",
      "GET /api/user/current/credit-usage",
      "GET /api/user/current/credit-usage/summary",
      "GET /api/plans/operation-costs",
    ]);
    expect(calls[2].params).toEqual({ module: "socialMediaPublisher", settled: false, pageSize: 20 });
    expect(calls[4].params).toEqual({ activeOnly: "true" });
  });
});

describe("@posty5/store — stores and the order origin", () => {
  it("lists the stores the key can manage, from the facade too", async () => {
    const { http: stub, calls } = stubHttp([{ _id: "s1", name: "shop - Shop" }]);

    expect(await new StoreClient(stub).listStores("shop")).toEqual([{ _id: "s1", name: "shop - Shop" }]);
    expect(new StoreClient(stub).stores).toBeInstanceOf(StoreStoresClient);
    expect(calls[0]).toEqual({ method: "GET", url: "/api/store/lookup", params: { term: "shop" } });
  });

  it("answers an empty list rather than undefined", async () => {
    const { http: stub } = stubHttp(null);

    expect(await new StoreStoresClient(stub).lookup()).toEqual([]);
  });

  it("tags a manual order with the client's createdFrom when the API accepts it, else npmPackage", async () => {
    const order = { items: [] } as any;
    const sent = async (createdFrom: string) => {
      const { http: stub, calls } = stubHttp({}, createdFrom);
      await new StoreOrdersClient(stub).create("s1", order);
      return calls[0].body.createdFrom;
    };

    expect(await sent("npmPackage")).toBe("npmPackage");
    expect(await sent("mcp")).toBe("mcp");
    expect(await sent("my-integration")).toBe("npmPackage");
  });
});

describe("social accounts and QR templates — routes", () => {
  it("lists, looks up and reads connected accounts", async () => {
    const { http: stub, calls } = stubHttp({});
    const accounts = new SocialPublisherAccountClient(stub);

    await accounts.list({ platform: "instagram" }, { page: 1, pageSize: 10 } as any);
    await accounts.lookup("brand", "threads");
    await accounts.get("a1");

    expect(calls.map(route)).toEqual(["GET /api/social-publisher-account", "GET /api/social-publisher-account/lookup", "GET /api/social-publisher-account/a1"]);
    expect(calls[0].params).toMatchObject({ platform: "instagram", page: 1, pageSize: 10 });
    expect(calls[1].params).toEqual({ term: "brand", platform: "threads" });
  });

  it("lists your QR templates and Posty5's public ones", async () => {
    const { http: stub, calls } = stubHttp({});
    const templates = new QRCodeTemplateClient(stub);

    await templates.listUserTemplates({ term: "blue" });
    await templates.listPublicTemplates({ schemeType: "classic" });

    expect(calls.map(route)).toEqual(["GET /api/qr-code-template/user-lookup", "GET /api/qr-code-template/public-lookup"]);
    expect(calls[1].params).toEqual({ schemeType: "classic" });
  });
});

describe("text and story posts — routes and origin", () => {
  it("posts text and stories to the four routes, stamped with the client's createdFrom", async () => {
    const { http: stub, calls } = stubHttp({ _id: "p1" }, "mcp");
    const posts = new SocialPublisherPostClient(stub);

    const created = await posts.createTextPostToWorkspace({ workspaceId: "w1", caption: "Hello" });
    await posts.createTextPostToAccount({ accountId: "a1", caption: "Hello" });
    await posts.createStoryPostToWorkspace({ workspaceId: "w1", kind: "image", image: { source: "image-url", externalUrl: "https://x.test/a.png" } });
    await posts.createStoryPostToAccount({ accountId: "a1", platform: "instagram", kind: "video", source: "video-url", videoURL: "https://x.test/a.mp4" });

    expect(created).toEqual({ _id: "p1" });
    expect(calls.map(route)).toEqual([
      "POST /api/social-publisher-post/text/workspace",
      "POST /api/social-publisher-post/text/account",
      "POST /api/social-publisher-post/story/workspace",
      "POST /api/social-publisher-post/story/account",
    ]);
    expect(calls.every((call) => call.body.createdFrom === "mcp")).toBe(true);
    expect(calls[3].body).toMatchObject({ platform: "instagram", source: "video-url" });
  });

  it("stamps createdFrom from the client on the older create methods too", async () => {
    const { http: stub, calls } = stubHttp({}, "mcp");

    await new ShortLinkClient(stub).create({ baseUrl: "https://posty5.com", name: "QA" } as any);

    expect(calls[0].body.createdFrom).toBe("mcp");
  });
});
