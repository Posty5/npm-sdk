# @posty5/webhooks

Manage Posty5 webhook endpoints and verify signed deliveries.

- `WebhookEndpointClient` — `/api/webhook-endpoints`: `list`, `get`, `create`
  (answers `{ endpoint, secret }` — the secret is shown once), `update`,
  `delete`, `rotateSecret`, `sendTest`, `listDeliveries`, `redeliver`,
  `listEventTypes`.
- `verifyWebhookSignature` — checks the Standard Webhooks headers
  (`webhook-id`, `webhook-timestamp`, `webhook-signature`), a 5-minute
  timestamp tolerance and every `v1,` signature (two during a secret rotation),
  then returns the parsed event. **Node only** (`node:crypto`).

## Install

```bash
npm install @posty5/core @posty5/webhooks
```

## Register an endpoint

```typescript
import { HttpClient } from "@posty5/core";
import { WebhookEndpointClient } from "@posty5/webhooks";

const webhooks = new WebhookEndpointClient(new HttpClient({ apiKey: process.env.POSTY5_API_KEY }));
const { endpoint, secret } = await webhooks.create({
  url: "https://hooks.example.com/posty5",
  events: ["short_link.visited", "qr_code.scanned"],
});
// Store `secret` now: it is never returned again.
await webhooks.sendTest(endpoint._id);
```

## Verify deliveries (Express)

The **raw** body is required: a parsed and re-serialised object will not match
the signature.

```typescript
import express from "express";
import { verifyWebhookSignature, Posty5WebhookSignatureError } from "@posty5/webhooks";

const app = express();

app.post("/posty5", express.raw({ type: "application/json" }), (req, res) => {
  try {
    const event = verifyWebhookSignature({
      payload: req.body, // Buffer
      headers: req.headers,
      secret: process.env.POSTY5_WEBHOOK_SECRET!,
    });
    switch (event.type) {
      case "short_link.visited":
        console.log(event.data.target.code, event.data.visit.country);
        break;
      case "batch":
        event.data.events.forEach((e) => console.log(e.type));
        break;
    }
    res.sendStatus(204);
  } catch (error) {
    if (error instanceof Posty5WebhookSignatureError) {
      return res.status(400).send(error.reason);
    }
    throw error;
  }
});
```

Deliveries are at-least-once: deduplicate on the `webhook-id` header (stable
across retries). Answer with any 2xx within 10 seconds; a `410` disables the
endpoint.

`reason` is one of `missingHeaders`, `timestampOutOfRange`,
`noMatchingSignature`, `invalidJson`.

## License

MIT
