# 15 - Risky Areas

| Area | Path | Why risky |
| --- | --- | --- |
| Core transport | `posty5-core/src/http/client.ts` | Affects authentication, retries, errors, and every package. |
| Public exports/types | `posty5-*/src/index.ts` | Removing or renaming exports is a breaking change. |
| Signed uploads | `posty5-core/src/utils/upload.ts` | Runtime File/Blob support, content types, and URL leakage matter. |
| Package version parity | `posty5-*/package.json` | Peer/dependency ranges and versions must remain publishable together. |
| Live tests | `__tests__/setup.ts` | Can mutate real API data and consume credentials. |
| Generated output/logs | `dist and *test_log*.txt` | Never treat as source or publish unintentionally. |

Before editing: trace callers/consumers, identify compatibility and security impact, take the narrowest change, and run both focused and structural checks.
