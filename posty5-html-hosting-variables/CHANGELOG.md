# Changelog

## 5.0.1

### Security

- Ids are percent-encoded (`encodeURIComponent`) before they go into a request path. An id such as `../webhook-endpoints` or `x?y=1` used to rewrite the route (axios resolves `..`), so a caller passing user input as an id could reach a different API endpoint with its own API key. Valid ids are unchanged on the wire.

## 5.0.0

Optimistic concurrency. Released in lockstep with every `@posty5/*` package
that writes (all at 5.0.0). Needs the API's versioned-writes release.

### Breaking changes

- **Versioned writes.** Every update, delete and state-change method takes the document's version (`__v`) as a required argument and sends it as `If-Match: "<v>"` (bulk methods send a `versions` map). Omitting it is a compile error in TypeScript and a `TypeError` at runtime.
- **New return types.** Methods that returned `void`, a boolean or a rebuilt subset now return the server's result with `__v` set to the new version (at least `{ _id, __v }`). Deletes still return nothing: no successor document exists.
- **Two typed errors** (from `@posty5/core`): `ConflictError` (409 `VERSION_CONFLICT`, carries `currentVersion` and `resourceId`) and `VersionRequiredError` (428 `VERSION_REQUIRED`). Any other 409 stays a generic `Posty5Error`.
- **No automatic retry** of a versioned write (any request carrying `If-Match`), nor of a 409 or 428: a lost response retried with the old version would report a false conflict. The caller decides.
- Every entity model declares `__v: number`.
- In this package: `update(id, data, version)` now returns `{ _id, __v }` instead of `void`; `delete(id, version)`.

### Migration

```ts
const variable = await client.get(id);
const { __v } = await client.update(id, { name, key, value }, variable.__v);
```

