import { WebhookEndpointClient } from "@posty5/webhooks";
import { scriptedHttp } from "./helpers/scripted-http.helper";

describe("WebhookEndpointClient (offline)", () => {
  it("calls every /api/webhook-endpoints route", async () => {
    const { http, calls } = scriptedHttp(() => ({}));
    const client = new WebhookEndpointClient(http);

    await client.list({ page: 1, pageSize: 10 });
    await client.get("e1");
    await client.create({ url: "https://hooks.example.com/p5", events: ["short_link.visited"] });
    await client.update("e1", { enabled: false });
    await client.delete("e1");
    await client.rotateSecret("e1");
    await client.sendTest("e1");
    await client.listDeliveries("e1", { status: "failed" });
    await client.redeliver("e1", "d1");
    await client.listEventTypes();

    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual([
      "GET /api/webhook-endpoints",
      "GET /api/webhook-endpoints/e1",
      "POST /api/webhook-endpoints",
      "PUT /api/webhook-endpoints/e1",
      "DELETE /api/webhook-endpoints/e1",
      "POST /api/webhook-endpoints/e1/rotate-secret",
      "POST /api/webhook-endpoints/e1/test",
      "GET /api/webhook-endpoints/e1/deliveries",
      "POST /api/webhook-endpoints/e1/deliveries/d1/redeliver",
      "GET /api/webhook-endpoints/event-types",
    ]);
    expect(calls[2].body).toEqual({ url: "https://hooks.example.com/p5", events: ["short_link.visited"], createdFrom: "npmPackage" });
    expect(calls[7].params).toEqual({ status: "failed" });
  });
});
