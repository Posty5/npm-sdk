import { Posty5WebhookSignatureError, signWebhookPayload, verifyWebhookSignature } from "@posty5/webhooks";

/** The Standard Webhooks specification's published test vector. */
const vector = {
  secret: "whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw",
  id: "msg_p5jXN8AQM9LWM0D4loKWxJek",
  timestamp: 1614265330,
  payload: '{"test": 2432232314}',
  signature: "v1,g0hM9SsE+OTPJTGt/tmIKtSyZlE3uFJELVlNIOLJ1OE=",
};

function headersFor(signature = vector.signature, timestamp = vector.timestamp) {
  return { "webhook-id": vector.id, "webhook-timestamp": String(timestamp), "webhook-signature": signature };
}

function reasonOf(run: () => unknown): string | undefined {
  try {
    run();
  } catch (error) {
    return error instanceof Posty5WebhookSignatureError ? error.reason : "other";
  }
  return undefined;
}

describe("verifyWebhookSignature", () => {
  const base = { secret: vector.secret, nowSeconds: vector.timestamp };

  it("accepts the published test vector, as a string and as a Buffer", () => {
    expect(verifyWebhookSignature({ ...base, payload: vector.payload, headers: headersFor() })).toEqual({ test: 2432232314 });
    expect(verifyWebhookSignature({ ...base, payload: Buffer.from(vector.payload), headers: headersFor() })).toEqual({ test: 2432232314 });
  });

  it("reads header names case-insensitively", () => {
    const headers = { "Webhook-Id": vector.id, "WEBHOOK-TIMESTAMP": String(vector.timestamp), "Webhook-Signature": vector.signature };
    expect(verifyWebhookSignature({ ...base, payload: vector.payload, headers })).toEqual({ test: 2432232314 });
  });

  it("accepts a rotated double signature when either matches", () => {
    const headers = headersFor(`v1,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA= ${vector.signature}`);
    expect(verifyWebhookSignature({ ...base, payload: vector.payload, headers })).toEqual({ test: 2432232314 });
  });

  it("matches what signWebhookPayload produces", () => {
    expect(`v1,${signWebhookPayload(vector.secret, vector.id, vector.timestamp, vector.payload)}`).toBe(vector.signature);
  });

  it("rejects a tampered body", () => {
    expect(reasonOf(() => verifyWebhookSignature({ ...base, payload: '{"test": 1}', headers: headersFor() }))).toBe("noMatchingSignature");
  });

  it("rejects a stale or future timestamp", () => {
    const run = (now: number) => () => verifyWebhookSignature({ ...base, nowSeconds: now, payload: vector.payload, headers: headersFor() });
    expect(reasonOf(run(vector.timestamp + 301))).toBe("timestampOutOfRange");
    expect(reasonOf(run(vector.timestamp - 301))).toBe("timestampOutOfRange");
  });

  it("rejects a missing header", () => {
    const headers: Record<string, string> = { ...headersFor() };
    delete headers["webhook-signature"];
    expect(reasonOf(() => verifyWebhookSignature({ ...base, payload: vector.payload, headers }))).toBe("missingHeaders");
  });

  it("rejects a signed body that is not JSON", () => {
    const payload = "not json";
    const signature = `v1,${signWebhookPayload(vector.secret, vector.id, vector.timestamp, payload)}`;
    expect(reasonOf(() => verifyWebhookSignature({ ...base, payload, headers: headersFor(signature) }))).toBe("invalidJson");
  });
});
