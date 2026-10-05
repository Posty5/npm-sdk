# @posty5/account

Who a Posty5 API key is, what its owner can spend, and what every paid
operation costs. The first call an integration — or an AI assistant connected
through Posty5's MCP server — makes.

**Learn more:** [https://posty5.com](https://posty5.com)

---

## 📥 Installation

```bash
npm install @posty5/core @posty5/account
```

## 🚀 Usage

```ts
import { HttpClient } from "@posty5/core";
import { AccountClient } from "@posty5/account";

const account = new AccountClient(new HttpClient({ apiKey: process.env.POSTY5_API_KEY }));

const me = await account.getCurrent();
console.log(me.apiKey.name, me.user.userName, me.plan?.key, me.credits.spendable);

const prices = await account.getOperationCosts();
```

`getCurrent()` is the cheapest way to validate a key: a revoked or unknown key
throws `AuthenticationError` (401). It carries no email, phone or address.

## 📚 API

| Method | Route | Returns |
| --- | --- | --- |
| `getCurrent()` | `GET /api/api-key/current` | The key (`recordScope`), its owner, plan, credits and MCP settings |
| `getCredits()` | `GET /api/user/current/credits` | Balance (`spendable` is what can be spent now) and usage counters |
| `getCreditUsage(filters?, paging?)` | `GET /api/user/current/credit-usage` | The credit history, newest first, cursor-paged |
| `getCreditUsageSummary(filters?)` | `GET /api/user/current/credit-usage/summary` | Totals: operations, spent, owed, added |
| `getOperationCosts(activeOnly = true)` | `GET /api/plans/operation-costs` | The live price list by module — public, needs no key |

**Record scope.** `me.apiKey.recordScope` says what the key's lists show:
`key` — only records created with this key; `account` — every record of the
owner. It is set per key in Account settings → API keys.

Prices change; read them from `getOperationCosts()` rather than hard-coding them.

## 📄 License

MIT
