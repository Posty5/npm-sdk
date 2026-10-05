import { MEMORY_IDEMPOTENCY_MAX_ENTRIES } from "../config/limits.config";
import type { IIdempotencyStore, IStoredToolResult } from "../interfaces/hooks.interface";

/**
 * The in-process idempotency store the stdio server uses. Results live as
 * long as the process (bounded by TTL and entry count); the hosted server
 * replaces it with Redis so retries that land on another process are caught.
 */
export class MemoryIdempotencyStore implements IIdempotencyStore {
  private readonly results = new Map<string, IStoredToolResult & { expiresAt: number }>();
  private readonly locks = new Map<string, number>();

  async get(key: string): Promise<IStoredToolResult | undefined> {
    const entry = this.results.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) {
      this.results.delete(key);
      return undefined;
    }
    return { result: entry.result, storedAt: entry.storedAt };
  }

  async acquire(key: string, ttlMs: number): Promise<boolean> {
    const heldUntil = this.locks.get(key);
    if (heldUntil && heldUntil > Date.now()) return false;
    this.locks.set(key, Date.now() + ttlMs);
    return true;
  }

  async set(key: string, result: unknown, ttlMs: number): Promise<void> {
    if (this.results.size >= MEMORY_IDEMPOTENCY_MAX_ENTRIES) {
      const oldest = this.results.keys().next().value;
      if (oldest !== undefined) this.results.delete(oldest);
    }
    this.results.set(key, { result, storedAt: Date.now(), expiresAt: Date.now() + ttlMs });
    this.locks.delete(key);
  }

  async release(key: string): Promise<void> {
    this.locks.delete(key);
  }
}
