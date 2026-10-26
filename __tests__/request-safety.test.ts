import * as http from "http";
import { inspect } from "util";
import { HttpClient, Posty5Error, isInsecureBaseUrl, redactApiKey, transformError } from "@posty5/core";
import { ShortLinkClient } from "@posty5/short-link";
import { WebhookEndpointClient, verifyWebhookSignature } from "@posty5/webhooks";
import { stubHttp } from "./helpers/stub-http.helper";
import { scriptedHttp } from "./helpers/scripted-http.helper";

/**
 * The API key never leaves the client by accident, and an id never rewrites
 * the route it is sent to. Offline: local sockets stand in for the API.
 */

const SECRET_KEY = "sk-test-0123456789abcdef";

describe("core — the API key stays out of logs and errors", () => {
  it("is not shown by console.log / util.inspect or JSON.stringify of the client", () => {
    const client = new HttpClient({ apiKey: SECRET_KEY, baseUrl: "https://api.example.com" });
    expect(inspect(client, { depth: 10 })).not.toContain(SECRET_KEY);
    expect(JSON.stringify((client as any).config)).not.toContain(SECRET_KEY);
  });

  it("is redacted from the axios error a NetworkError keeps as details.originalError", async () => {
    // Port 1 on loopback refuses the connection: a network error, no response.
    const client = new HttpClient({ apiKey: SECRET_KEY, baseUrl: "http://127.0.0.1:1", maxRetries: 0 });
    const error = await client.get("/api/x").catch((e) => e);
    expect(error).toBeInstanceOf(Posty5Error);
    expect(error.details?.originalError).toBeDefined();
    expect(JSON.stringify(error)).not.toContain(SECRET_KEY);
    expect(inspect(error, { depth: 10 })).not.toContain(SECRET_KEY);
  });

  it("redacts the header whatever its case, on a hand-made axios error", () => {
    const error = { isAxiosError: true, message: "boom", config: { headers: { "x-api-key": SECRET_KEY } } };
    const mapped = transformError(error);
    expect(JSON.stringify(mapped.details)).not.toContain(SECRET_KEY);
    expect(redactApiKey({ config: { headers: { "X-API-Key": SECRET_KEY } } }).config.headers["X-API-Key"]).toBe("[REDACTED]");
  });
});

describe("core — redirects", () => {
  const seen: { server: string; url: string; key?: string }[] = [];
  let a: http.Server;
  let b: http.Server;
  let aUrl = "";
  let bUrl = "";

  const listen = (server: http.Server) =>
    new Promise<string>((resolve) => server.listen(0, "127.0.0.1", () => resolve(`http://127.0.0.1:${(server.address() as any).port}`)));

  beforeAll(async () => {
    b = http.createServer((req, res) => {
      seen.push({ server: "b", url: req.url || "", key: req.headers["x-api-key"] as string | undefined });
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ message: "ok", result: {} }));
    });
    bUrl = await listen(b);
    a = http.createServer((req, res) => {
      seen.push({ server: "a", url: req.url || "", key: req.headers["x-api-key"] as string | undefined });
      if (req.url === "/away") {
        res.writeHead(302, { location: `${bUrl}/landing` });
        return res.end();
      }
      if (req.url === "/home") {
        res.writeHead(302, { location: "/landing" });
        return res.end();
      }
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ message: "ok", result: {} }));
    });
    aUrl = await listen(a);
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => a.close(() => resolve()));
    await new Promise<void>((resolve) => b.close(() => resolve()));
  });
  beforeEach(() => (seen.length = 0));

  it("drops X-API-Key when a redirect leaves the base URL's origin", async () => {
    await new HttpClient({ apiKey: SECRET_KEY, baseUrl: aUrl }).get("/away");
    expect(seen.map((s) => s.server)).toEqual(["a", "b"]);
    expect(seen[0].key).toBe(SECRET_KEY);
    expect(seen[1].key).toBeUndefined();
  });

  it("keeps it on a same-origin redirect", async () => {
    await new HttpClient({ apiKey: SECRET_KEY, baseUrl: aUrl }).get("/home");
    expect(seen.map((s) => `${s.server} ${s.url}`)).toEqual(["a /home", "a /landing"]);
    expect(seen[1].key).toBe(SECRET_KEY);
  });
});

describe("core — base URL", () => {
  it("flags plain http to another machine, not https or loopback", () => {
    expect(isInsecureBaseUrl("http://api.example.com")).toBe(true);
    expect(isInsecureBaseUrl("https://api.example.com")).toBe(false);
    expect(isInsecureBaseUrl("http://localhost:4000")).toBe(false);
    expect(isInsecureBaseUrl("http://127.0.0.1:4000")).toBe(false);
  });

  it("warns when a client is built on one", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    new HttpClient({ apiKey: SECRET_KEY, baseUrl: "http://api.example.com" });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).not.toContain(SECRET_KEY);
    warn.mockRestore();
  });
});

describe("path ids are encoded and dot segments refused", () => {
  it("encodes an id so it cannot add path segments, a query or a fragment", async () => {
    const { http, calls } = stubHttp();
    await new ShortLinkClient(http).get("../../webhook-endpoints?x=1#y");
    expect(calls[0].url).toBe("/api/short-link/..%2F..%2Fwebhook-endpoints%3Fx%3D1%23y");
  });

  it("encodes both ids of a nested route", async () => {
    const { http, calls } = scriptedHttp(() => ({}));
    await new WebhookEndpointClient(http).redeliver("e/1", "d?1");
    expect(`${calls[0].method} ${calls[0].url}`).toBe("POST /api/webhook-endpoints/e%2F1/deliveries/d%3F1/redeliver");
  });

  it("refuses a '.' or '..' segment before any request is sent", async () => {
    const client = new HttpClient({ apiKey: SECRET_KEY, baseUrl: "http://127.0.0.1:1", maxRetries: 0 });
    for (const id of ["..", "."]) {
      await expect(new ShortLinkClient(client).get(id)).rejects.toMatchObject({ code: "INVALID_PATH" });
    }
    // Percent-encoded dots count too (URL parsing resolves them); an encoded id turns `%` into `%25`, so only a raw path gets here.
    await expect(client.get("/api/short-link/%2e%2E/x")).rejects.toMatchObject({ code: "INVALID_PATH" });
  });
});

describe("webhooks — unsafe configuration fails closed", () => {
  const headers = { "webhook-id": "msg_1", "webhook-timestamp": "1614265330", "webhook-signature": "v1,AAAA" };

  it("refuses an empty or too-short secret instead of signing with it", () => {
    for (const secret of ["", "whsec_", "whsec_AAAA", undefined as unknown as string]) {
      expect(() => verifyWebhookSignature({ payload: "{}", headers, secret, nowSeconds: 1614265330 })).toThrow(TypeError);
    }
  });

  it("falls back to the default window when toleranceSeconds is NaN, Infinity or negative", () => {
    const secret = "whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw";
    for (const toleranceSeconds of [NaN, Infinity, -1]) {
      let reason: string | undefined;
      try {
        verifyWebhookSignature({ payload: "{}", headers, secret, toleranceSeconds, nowSeconds: 1614265330 + 10_000 });
      } catch (error) {
        reason = (error as { reason?: string }).reason;
      }
      expect(reason).toBe("timestampOutOfRange");
    }
  });
});
