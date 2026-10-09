/**
 * Short link controls helpers for the `short-links` toolset.
 */

/**
 * A short link result without any `access.password`: the API never returns
 * the password (only `access.hasPassword`), and this keeps it that way should
 * an echo of the input ever reach a result. `hasPassword` is kept.
 */
export function withoutLinkPassword<T>(link: T): T {
  if (!link || typeof link !== "object") return link;
  const access = (link as Record<string, unknown>).access;
  if (!access || typeof access !== "object" || !("password" in (access as object))) return link;
  const { password, ...rest } = access as Record<string, unknown>;
  return { ...(link as object), access: { ...rest, hasPassword: (rest.hasPassword as boolean | undefined) ?? Boolean(password) } } as T;
}
