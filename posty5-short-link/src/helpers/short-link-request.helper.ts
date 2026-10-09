import { IPaginationParams } from "@posty5/core";
import { ICreateShortLinkRequest, IListParams, IUpdateShortLinkRequest } from "../interfaces";
import { ShortLinkDeprecatedRequestKeysConst, ShortLinkLegacyListKeysConst, ShortLinkTagsQuerySeparatorConst } from "../short-link.config";
import { ShortLinkDeprecatedRequestKeyType as DeprecatedKey } from "../types/type";

/** A shallow copy of `source` without the keys the API rejects. Never mutates `source`. */
function withoutDeprecatedKeys<T extends object>(source: T): Omit<T, DeprecatedKey> {
  const copy: Record<string, unknown> = { ...(source as object) };
  for (const key of ShortLinkDeprecatedRequestKeysConst) {
    delete copy[key];
  }
  return copy as Omit<T, DeprecatedKey>;
}

/**
 * The body sent for a create or an update: the caller's fields minus the
 * deprecated ones. The caller's object is left untouched.
 */
export function toShortLinkBody<T extends ICreateShortLinkRequest | IUpdateShortLinkRequest>(data: T): Omit<T, DeprecatedKey> {
  return withoutDeprecatedKeys(data);
}

/**
 * The query string sent by `list()`: filters plus pagination, deprecated keys
 * removed and legacy keys renamed to the key the API filters on (an explicit
 * new key wins over its legacy spelling).
 */
export function toShortLinkListQuery(params?: IListParams, pagination?: IPaginationParams): Record<string, unknown> {
  const query: Record<string, unknown> = withoutDeprecatedKeys({ ...params, ...pagination });
  for (const [legacyKey, key] of Object.entries(ShortLinkLegacyListKeysConst)) {
    if (!(legacyKey in query)) {
      continue;
    }
    if (query[key] === undefined) {
      query[key] = query[legacyKey];
    }
    delete query[legacyKey];
  }
  // `?tags=a,b` — the API splits on `ShortLinkTagsQuerySeparatorConst`.
  if (Array.isArray(query.tags)) {
    if (query.tags.length) query.tags = query.tags.join(ShortLinkTagsQuerySeparatorConst);
    else delete query.tags;
  }
  return query;
}
