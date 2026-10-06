import { IBulkCreateResult, NetworkError } from "@posty5/core";
import { IQrCodeBulkRow, QRCodeClient } from "@posty5/qr-code";
import { scriptedHttp } from "./helpers/scripted-http.helper";

function chunkAnswer(body: unknown): IBulkCreateResult {
  const items = (body as { items: IQrCodeBulkRow[] }).items;
  return {
    created: items.length,
    failed: 0,
    items: items.map((_, i) => ({ row: i + 1, status: "created", qrCodeDownloadURL: `https://pst5.com/qr/${i}` })),
  };
}

describe("QRCodeClient bulk (offline)", () => {
  it("sends typed rows under items to /api/qr-code/bulk in chunks and renumbers rows", async () => {
    const rows: IQrCodeBulkRow[] = Array.from({ length: 150 }, (_, i) =>
      i % 2 ? { type: "url", target: { url: `https://example.com/${i}` } } : { type: "freeText", target: { text: `t${i}` }, fileName: `f${i}` },
    );
    const { http, calls } = scriptedHttp((call) => chunkAnswer(call.body));
    const result = await new QRCodeClient(http).createMany(rows, { idempotencyKey: "q", defaults: { templateId: "t1" } });

    expect(calls).toHaveLength(2);
    expect(calls[0]).toMatchObject({ url: "/api/qr-code/bulk", headers: { "Idempotency-Key": "q-0" } });
    expect(calls[0].body).toMatchObject({ defaults: { templateId: "t1" }, createdFrom: "npmPackage" });
    expect(calls[0].body).not.toHaveProperty("templateType");
    expect((calls[1].body as { items: unknown[] }).items).toHaveLength(50);
    expect(result.items[149].row).toBe(150);
  });

  it("retries a network error with the same key", async () => {
    let first = true;
    const { http, calls } = scriptedHttp((call) => {
      if (first) {
        first = false;
        throw new NetworkError();
      }
      return chunkAnswer(call.body);
    });
    await new QRCodeClient(http).createMany([{ type: "call", target: { phoneNumber: "1" } }], { idempotencyKey: "n" });
    expect(calls.map((c) => c.headers?.["Idempotency-Key"])).toEqual(["n-0", "n-0"]);
  });

  it("submits a qrCodes job with image options and asks for the zip", async () => {
    const { http, calls } = scriptedHttp(() => ({ _id: "j2", status: "queued" }));
    const client = new QRCodeClient(http);
    await client.createBulkJob({ content: "[]", format: "json", image: { format: "png", sizePx: 512 }, dryRun: true });
    await client.getBulkJobResultUrl("j2", "zip");
    expect(calls[0].body).toMatchObject({ kind: "qrCodes", dryRun: true, options: { image: { format: "png", sizePx: 512 } } });
    expect(calls[1]).toMatchObject({ url: "/api/link-bulk-jobs/j2/result-url", params: { file: "zip" } });
  });

  it("exports through /api/qr-code/export", async () => {
    const file = { data: new ArrayBuffer(1), contentType: "application/json", fileName: "qr-codes.json" };
    const { http, calls } = scriptedHttp(() => file);
    await expect(new QRCodeClient(http).export({ format: "json" })).resolves.toBe(file);
    expect(calls[0]).toMatchObject({ url: "/api/qr-code/export", params: { format: "json" } });
  });
});
