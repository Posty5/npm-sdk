import type { IToolCallContext, IToolEntity } from "./tool.interface";

/** How a call ended, for a host's activity log. */
export type ToolOutcomeStatus = "ok" | "toolError" | "denied" | "rateLimited" | "failed";

/** What a host learns after each call. */
export interface IToolOutcome {
  status: ToolOutcomeStatus;
  errorCode?: string;
  errorMessage?: string;
  durationMs: number;
  entity?: IToolEntity;
  replayed?: boolean;
  /** True when a `confirm` tool only described itself. */
  awaitingConfirmation?: boolean;
}

/** A host refusing a call before it runs (limits, access). */
export interface IToolRefusal {
  status: "denied" | "rateLimited";
  message: string;
  retryAfterSeconds?: number;
}

/** A remembered result of a write, replayed when the same idempotency key comes back. */
export interface IStoredToolResult {
  result: unknown;
  storedAt: number;
}

/**
 * Where write results are remembered by idempotency key. The package ships an
 * in-process store; the hosted server plugs in Redis.
 */
export interface IIdempotencyStore {
  get(key: string): Promise<IStoredToolResult | undefined>;
  /** Claim the key for an in-flight call; false when another call holds it. */
  acquire(key: string, ttlMs: number): Promise<boolean>;
  set(key: string, result: unknown, ttlMs: number): Promise<void>;
  /** Release a claim without storing a result (the call failed). */
  release(key: string): Promise<void>;
}

/** What a host (the hosted MCP server) plugs into every call. */
export interface IPosty5McpHooks {
  /**
   * Runs before a call; a refusal is answered as a tool error and the call does
   * not run. It may set `call.callId` — `connection(call)` runs after it.
   */
  beforeToolCall?(call: IToolCallContext): Promise<IToolRefusal | void> | IToolRefusal | void;
  /** Runs after every call, whatever its outcome. Must not throw. */
  afterToolCall?(call: IToolCallContext, outcome: IToolOutcome): void;
}
