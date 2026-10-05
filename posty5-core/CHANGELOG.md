# Changelog

## 4.3.0

### Changed — behaviour fix

- **POST and PATCH are no longer retried after the server answered.** Until
  now every 5xx was retried up to three times whatever the method, so a POST
  that failed after the server had acted on it (a post published, credits
  charged) could be repeated. Idempotent methods (GET, HEAD, OPTIONS, PUT,
  DELETE) are still retried on a network error or a 5xx; POST and PATCH are
  retried only when the connection was never made (`ECONNREFUSED`,
  `ENOTFOUND`, …). The rule is `shouldRetryRequest`, exported.
- `maxRetries: 0` now disables retries (it used to fall back to 3).

### Added

- Every request sends `X-Posty5-Client: posty5-npm/<version>`. A caller may
  rename itself through `headers`; `X-API-Key` cannot be overridden that way.
- Public config options: `headers`, `createdFrom` (the label stamped on
  records the SDK creates, default `"npmPackage"`), `maxRetries`, `timeout`.
- `HttpClient.createdFrom` — read by every package's create methods.
- Exported constants: `CLIENT_HEADER_NAME`, `SDK_CLIENT_ID`, `CORE_VERSION`,
  `DEFAULT_CREATED_FROM` and the other client defaults.
