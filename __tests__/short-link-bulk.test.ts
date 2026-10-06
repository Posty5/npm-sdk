import { AuthorizationError, IBulkCreateResult, ILinkBulkJob, ServerError } from "@posty5/core";
import { IShortLinkBulkRow, Posty5BulkCreateError, ShortLinkClient } from "@posty5/short-link";
import { scriptedHttp } from "./helpers/scripted-http.helper";

/** An API answer for a chunk: every row created, numbered 1..n as the API does per chunk. */
function chunkAnswer(body: unknown): IBulkCreateResult {
  const links = (body as { links: IShortLinkBulkRow[] }).links;
  return {
    created: links.length,
    failed: 0,
    items: links.map((link, i) => ({ row: i + 1, status: "created", id: link.url, shortUrl: `https://pst5.com/_${i}` })),
  };
}

function rowsOf(count: number): IShortLinkBulkRow[] {
  return Array.from({ length: count }, (_, i) => ({ url: `https://example.com/${i}` }));
}

describe("ShortLinkClient.createMany (offline)", () => {
  it("splits 250 rows into 100/100/50, keys each chunk and renumbers rows over the whole array", async () => {
    const { http, calls } = scriptedHttp((call) => chunkAnswer(call.body));
    const progress: number[] = [];
    const result = await new ShortLinkClient(http).createMany(rowsOf(250), {
      idempotencyKey: "k",
      onProgress: (done) => progress.push(done),
    });

    expect(calls.map((c) => (c.body as { links: unknown[] }).links.length)).toEqual([100, 100, 50]);
    expect(calls.map((c) => c.url)).toEqual(Array(3).fill("/api/short-link/bulk"));
    expect(calls.map((c) => c.headers?.["Idempotency-Key"])).toEqual(["k-0", "k-1", "k-2"]);
    expect(calls[0].body).toMatchObject({ createdFrom: "npmPackage" });
    expect(calls[0].body).not.toHaveProperty("templateType");
    expect(result.created).toBe(250);
    expect(result.items.map((i) => i.row)).toEqual(Array.from({ length: 250 }, (_, i) => i + 1));
    expect(result.items[249].id).toBe("https://example.com/249");
    expect(progress).toEqual([100, 200, 250]);
  });

  it("makes 10 requests for 1,000 rows", async () => {
    const { http, calls } = scriptedHttp((call) => chunkAnswer(call.body));
    const result = await new ShortLinkClient(http).createMany(rowsOf(1000));
    expect(calls).toHaveLength(10);
    expect(result.items).toHaveLength(1000);
  });

  it("resolves an empty result without a request", async () => {
    const { http, calls } = scriptedHttp(() => ({}));
    await expect(new ShortLinkClient(http).createMany([])).resolves.toEqual({ created: 0, failed: 0, items: [] });
    expect(calls).toHaveLength(0);
  });

  it("retries a 5xx chunk with the same key", async () => {
    let failed = false;
    const { http, calls } = scriptedHttp((call) => {
      if (!failed) {
        failed = true;
        throw new ServerError("boom", 502);
      }
      return chunkAnswer(call.body);
    });
    const result = await new ShortLinkClient(http).createMany(rowsOf(3), { idempotencyKey: "same" });
    expect(calls.map((c) => c.headers?.["Idempotency-Key"])).toEqual(["same-0", "same-0"]);
    expect(result.created).toBe(3);
  });

  it("stops on a whole-request 403 and attaches the rows done so far", async () => {
    const { http, calls } = scriptedHttp((call, index) => {
      if (index === 1) {
        throw new AuthorizationError("This feature is not available on your current plan.");
      }
      return chunkAnswer(call.body);
    });
    const error = await new ShortLinkClient(http).createMany(rowsOf(250)).catch((e) => e);
    expect(error).toBeInstanceOf(Posty5BulkCreateError);
    expect(error.statusCode).toBe(403);
    expect(error.partialResult.items).toHaveLength(100);
    expect(calls).toHaveLength(2);
  });
});

describe("ShortLinkClient export and bulk jobs (offline)", () => {
  it("exports with list filters and format, returning the binary as is", async () => {
    const file = { data: new ArrayBuffer(3), contentType: "text/csv", fileName: "short-links-2026-10-06.csv" };
    const { http, calls } = scriptedHttp(() => file);
    const result = await new ShortLinkClient(http).export({ format: "csv", tag: "spring" } as never);
    expect(result).toBe(file);
    expect(calls[0]).toMatchObject({ url: "/api/short-link/export", params: { format: "csv", tag: "spring" } });
  });

  it("submits, reads, links and cancels jobs on /api/link-bulk-jobs with kind shortLinks", async () => {
    const { http, calls } = scriptedHttp(() => ({ _id: "j1", status: "queued" }));
    const client = new ShortLinkClient(http);
    await client.createBulkJob({ content: "url\nhttps://a.com", format: "csv", fetchMetadata: false, idempotencyKey: "job-1" });
    await client.getBulkJob("j1");
    await client.getBulkJobResultUrl("j1", "errors");
    await client.cancelBulkJob("j1");

    expect(calls[0]).toMatchObject({
      method: "POST",
      url: "/api/link-bulk-jobs",
      body: { kind: "shortLinks", format: "csv", options: { fetchMetadata: false } },
      headers: { "Idempotency-Key": "job-1" },
    });
    expect(calls[1]).toMatchObject({ method: "GET", url: "/api/link-bulk-jobs/j1" });
    expect(calls[2]).toMatchObject({ url: "/api/link-bulk-jobs/j1/result-url", params: { file: "errors" } });
    expect(calls[3]).toMatchObject({ method: "POST", url: "/api/link-bulk-jobs/j1/cancel" });
  });

  it("waits until a terminal status", async () => {
    const statuses: ILinkBulkJob["status"][] = ["queued", "running", "partiallySucceeded"];
    const { http, calls } = scriptedHttp((_, i) => ({ _id: "j1", status: statuses[i] }));
    const job = await new ShortLinkClient(http).waitForBulkJob("j1", { intervalMs: 1 });
    expect(job.status).toBe("partiallySucceeded");
    expect(calls).toHaveLength(3);
  });

  it("rejects on timeout without cancelling the job", async () => {
    const { http, calls } = scriptedHttp(() => ({ _id: "j1", status: "running" }));
    await expect(new ShortLinkClient(http).waitForBulkJob("j1", { intervalMs: 5, timeoutMs: 20 })).rejects.toThrow(/did not finish/);
    expect(calls.every((c) => !c.url.endsWith("/cancel"))).toBe(true);
  });
});
