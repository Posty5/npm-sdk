#!/usr/bin/env node
/**
 * `npx -y @posty5/mcp` — the Posty5 MCP server over stdio, for clients that
 * launch local servers. stdout carries the protocol only; everything else goes
 * to stderr, and the API key is never printed.
 */
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { ACCESS_LEVELS, DEFAULT_ACCESS, type AccessLevel } from "../config/access.config";
import { STDIO_ENV, STDIO_MISSING_KEY_MESSAGE } from "../config/stdio-env.config";
import { TOOLSET_NAMES } from "../config/toolsets.config";
import { MemoryIdempotencyStore } from "../core/memory-idempotency.store";
import { createPosty5McpServer } from "../server";

function readAccess(value: string | undefined): AccessLevel {
  const level = value?.trim().toLowerCase();
  if (!level) return DEFAULT_ACCESS;
  if ((ACCESS_LEVELS as readonly string[]).includes(level)) return level as AccessLevel;
  process.stderr.write(`posty5-mcp: ${STDIO_ENV.access}="${value}" is not one of ${ACCESS_LEVELS.join(", ")}; using ${DEFAULT_ACCESS}.\n`);
  return DEFAULT_ACCESS;
}

function readToolsets(value: string | undefined): string[] | undefined {
  const items = value?.split(",").map((item) => item.trim()).filter(Boolean);
  const unknown = items?.filter((item) => !(TOOLSET_NAMES as readonly string[]).includes(item)) ?? [];
  if (unknown.length) process.stderr.write(`posty5-mcp: ignoring unknown toolsets in ${STDIO_ENV.toolsets}: ${unknown.join(", ")}. Known: ${TOOLSET_NAMES.join(", ")}.\n`);
  return items && items.length ? items : undefined;
}

const apiKey = process.env[STDIO_ENV.apiKey]?.trim();
if (!apiKey) {
  process.stderr.write(`${STDIO_MISSING_KEY_MESSAGE}\n`);
  process.exit(1);
}

// One store for the process: the stdio connection may be served by more than one instance (one per protocol era).
const idempotencyStore = new MemoryIdempotencyStore();
const options = {
  apiKey,
  baseUrl: process.env[STDIO_ENV.baseUrl]?.trim() || undefined,
  access: readAccess(process.env[STDIO_ENV.access]),
  toolsets: readToolsets(process.env[STDIO_ENV.toolsets]),
  connectionModel: process.env[STDIO_ENV.model]?.trim() || undefined,
  idempotencyStore,
};

serveStdio(() => createPosty5McpServer(options), {
  onerror: (error) => process.stderr.write(`posty5-mcp: ${error.message}\n`),
});
