import * as http from "http";
import {
  CLIENT_HEADER_NAME,
  ConflictError,
  HttpClient,
  Posty5Error,
  SDK_CLIENT_ID,
  VersionRequiredError,
  assertVersion,
  ifMatchHeader,
  resetMissingVersionWarning,
  shouldRetryRequest,
  transformError,
  withVersion,
} from "@posty5/core";

/**
 * Versioned writes (optimistic-concurrency, npm-sdk 5.0.0). Offline: the error
 * mapping is unit-tested on hand-made axios errors, and a local socket server
 * stands in for the API where the real client's headers and retries matter.
 */

const axiosError = (status: number, data: unknown) => ({ isAxiosError: true, message: "x", response: { status, data, headers: {} } });

describe("core — version errors", () => {
  it("maps a 409 VERSION_CONFLICT to ConflictError with currentVersion and resourceId", () => {
    const error = transformError(axiosError(409, { message: "changed", code: "VERSION_CONFLICT", result: { _id: "a1", currentVersion: 8 } }));
    expect(error).toBeInstanceOf(ConflictError);
    expect((error as ConflictError).currentVersion).toBe(8);
    expect((error as ConflictError).resourceId).toBe("a1");
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe("VERSION_CONFLICT");
  });

  it("keeps any other 409 (the tus offset re-sync) a generic Posty5Error", () => {
    const error = transformError(axiosError(409, { message: "offset mismatch" }));
    expect(error).toBeInstanceOf(Posty5Error);
    expect(error).not.toBeInstanceOf(ConflictError);
    expect(error.statusCode).toBe(409);
  });

  it("maps a 428 to VersionRequiredError", () => {
    const error = transformError(axiosError(428, { message: "need version", code: "VERSION_REQUIRED" }));
    expect(error).toBeInstanceOf(VersionRequiredError);
    expect(error.code).toBe("VERSION_REQUIRED");
  });
});

describe("core — version helpers", () => {
  it("formats If-Match as a strong ETag and refuses a bad version", () => {
    expect(ifMatchHeader(4)).toBe('"4"');
    expect(() => assertVersion(-1)).toThrow(TypeError);
    expect(() => assertVersion(1.5)).toThrow(TypeError);
    expect(() => assertVersion(undefined)).toThrow(TypeError);
    expect(() => assertVersion("3")).toThrow(TypeError);
  });

  it("sets __v from the envelope's version", () => {
    expect(withVersion({ message: "", result: { _id: "a", name: "n", __v: 1 }, version: 2 })).toEqual({ _id: "a", name: "n", __v: 2 });
    expect(withVersion({ message: "", version: 5 }, "b")).toEqual({ _id: "b", __v: 5 });
  });

  it("never retries an If-Match request, a 409 or a 428", () => {
    const withIfMatch = { config: { method: "put", headers: { "If-Match": '"3"' } } };
    expect(shouldRetryRequest({ ...withIfMatch, response: { status: 500 } })).toBe(false);
    expect(shouldRetryRequest({ ...withIfMatch, code: "ECONNRESET", isAxiosError: true })).toBe(false);
    expect(shouldRetryRequest({ config: { method: "put" }, response: { status: 409 } })).toBe(false);
    expect(shouldRetryRequest({ config: { method: "delete" }, response: { status: 428 } })).toBe(false);
  });
});

describe("core — versioned writes against a real socket", () => {
  let server: http.Server;
  let baseUrl = "";
  const seen: { method: string; url: string; headers: http.IncomingHttpHeaders }[] = [];

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      seen.push({ method: req.method || "", url: req.url || "", headers: req.headers });
      const headers: Record<string, string> = { "content-type": "application/json" };
      if (req.url?.startsWith("/report")) headers["x-posty5-concurrency"] = "missing-version";
      const status = req.url?.startsWith("/fail") ? 500 : 200;
      res.writeHead(status, headers);
      res.end(JSON.stringify({ message: "ok", result: { _id: "a" }, version: 5 }));
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    baseUrl = `http://127.0.0.1:${(server.address() as any).port}`;
  });

  afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));
  beforeEach(() => (seen.length = 0));

  const client = () => new HttpClient({ baseUrl, apiKey: "k1", retryDelay: 1 } as any);

  it("sends If-Match from config.version, the client header, and reads the envelope version", async () => {
    const response = await client().put("/ok", {}, { version: 4 });
    expect(seen[0].headers["if-match"]).toBe('"4"');
    expect(seen[0].headers[CLIENT_HEADER_NAME.toLowerCase()]).toBe(SDK_CLIENT_ID);
    expect(response.version).toBe(5);
  });

  it("sends a versioned PUT that answered 500 exactly once", async () => {
    await expect(client().put("/fail", {}, { version: 1 })).rejects.toBeDefined();
    expect(seen).toHaveLength(1);
  });

  it("warns once per process on X-Posty5-Concurrency: missing-version", async () => {
    resetMissingVersionWarning();
    const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    await client().put("/report", {});
    await client().delete("/report");
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain("/report");
    warn.mockRestore();
  });
});
