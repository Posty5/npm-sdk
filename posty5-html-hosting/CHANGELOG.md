# Changelog

## 5.0.0

Optimistic concurrency. Released in lockstep with every `@posty5/*` package
that writes (all at 5.0.0). Needs the API's versioned-writes release.

### Breaking changes

- **Versioned writes.** Every update, delete and state-change method takes the document's version (`__v`) as a required argument and sends it as `If-Match: "<v>"` (bulk methods send a `versions` map). Omitting it is a compile error in TypeScript and a `TypeError` at runtime.
- **New return types.** Methods that returned `void`, a boolean or a rebuilt subset now return the server's result with `__v` set to the new version (at least `{ _id, __v }`). Deletes still return nothing: no successor document exists.
- **Two typed errors** (from `@posty5/core`): `ConflictError` (409 `VERSION_CONFLICT`, carries `currentVersion` and `resourceId`) and `VersionRequiredError` (428 `VERSION_REQUIRED`). Any other 409 stays a generic `Posty5Error`.
- **No automatic retry** of a versioned write (any request carrying `If-Match`), nor of a 409 or 428: a lost response retried with the old version would report a false conflict. The caller decides.
- Every entity model declares `__v: number`.
- In this package: `updateWithNewFile(id, data, file, version)` and `updateWithGithubFile(id, data, version)` now return the full page (`IHtmlPageResponse`) with `__v`, not the `{ _id, shorterLink, fileUrl | githubInfo }` subset; `delete(id, version)`.

### Migration

```ts
const page = await client.get(id);
await client.updateWithGithubFile(id, { name, githubURL }, page.__v);
```

