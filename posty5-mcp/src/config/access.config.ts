/**
 * What a connection may do (mcp-server feature, decision 4). The access level
 * is the security boundary: a tool above it is not listed AND is refused if
 * called anyway.
 */
export const ACCESS_LEVELS = ["read", "write", "full"] as const;

export type AccessLevel = (typeof ACCESS_LEVELS)[number];

/** A connection with no stated level gets this. */
export const DEFAULT_ACCESS: AccessLevel = "write";

/** Higher may use everything lower may. */
export const ACCESS_RANK: Record<AccessLevel, number> = { read: 0, write: 1, full: 2 };
