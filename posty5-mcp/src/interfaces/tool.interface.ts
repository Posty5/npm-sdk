import type { z } from "zod";
import type { AccessLevel } from "../config/access.config";
import type { ToolsetName } from "../config/toolsets.config";
import type { IPosty5Clients } from "./clients.interface";

/** Where the model name of a call came from (mcp-server feature, decision 8). */
export type AgentModelSource = "agent" | "connection" | "unknown";

/** One tool call, as hooks and the HTTP client factory see it. */
export interface IToolCallContext {
  tool: string;
  toolset: ToolsetName;
  access: AccessLevel;
  /** The MCP client, from the protocol (`clientInfo`). */
  client: { name: string; version?: string };
  /** The model id after precedence (argument → connection → "unknown") and normalisation. */
  model: string;
  modelSource: AgentModelSource;
  /** The assistant's idempotency key, when it sent one. */
  idempotencyKey?: string;
  /** Set by a host (the hosted server) to tie the call to its log row. */
  callId?: string;
  /** The raw tool arguments — a host's logger must redact them before storing. */
  args: Record<string, unknown>;
  startedAt: number;
}

/** Behaviour hints for clients (MCP tool annotations); `readOnlyHint` follows from `access: "read"`. */
export interface IToolAnnotations {
  destructive?: boolean;
  idempotent?: boolean;
  /** True when the result contains text other people wrote (form submissions, orders, captions…). */
  openWorld?: boolean;
}

/** A confirmation with data the user decides on: a quote, an import preview. */
export interface IConfirmationDescription {
  /** One or two sentences for the user: what the call would do and whether it can be undone. */
  action: string;
  /** Returned beside `action` unchanged, e.g. the SDK's quote or preview result. */
  details?: unknown;
}

/** What a tool needing `confirm: true` says it would do, without doing it. Reads only. */
export interface IToolConfirmation {
  /** One or two sentences (or a sentence plus details) for the user: what the call would do and whether it can be undone. */
  describe(args: any, ctx: IToolRunContext): string | IConfirmationDescription | Promise<string | IConfirmationDescription>;
  /** Operation whose live credit price is quoted alongside, e.g. "socialMediaPublisher.removePost". */
  costFeaturePath?: string;
}

/** What a call created or touched, for a host's activity log. */
export interface IToolEntity {
  entityType: string;
  entityId?: string;
  count?: number;
}

/** What a tool's `run` receives besides its arguments. */
export interface IToolRunContext {
  clients: IPosty5Clients;
  call: IToolCallContext;
}

/**
 * One MCP tool. `input` holds the tool's own fields only: `aiModel` and
 * `idempotencyKey` are added to every write/full tool, and `confirm` to every
 * tool with a `confirm` rule, by the catalogue — never declare them here.
 */
export interface IToolDefinition<TInput extends z.ZodObject<any> = z.ZodObject<any>> {
  /** `<resource>_<verb>`, snake_case, ≤ 64 chars. Stable forever once published. */
  name: string;
  toolset: ToolsetName;
  access: AccessLevel;
  title: string;
  /** What it does, what it needs (and where to get it), side effects. Never a price. */
  description: string;
  input: TInput;
  annotations?: IToolAnnotations;
  confirm?: IToolConfirmation;
  run(args: z.infer<TInput>, ctx: IToolRunContext): Promise<unknown>;
  /** What the call created, for the activity log. */
  entity?(result: any, args: z.infer<TInput>): IToolEntity | undefined;
}

/** A tool as `listTools()` describes it — no handler. */
export interface IToolDescriptor {
  name: string;
  toolset: ToolsetName;
  access: AccessLevel;
  title: string;
  description: string;
  requiresConfirm: boolean;
  annotations: { readOnlyHint: boolean; destructiveHint: boolean; idempotentHint: boolean; openWorldHint: boolean };
}
