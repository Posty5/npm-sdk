/**
 * What a tool looks like on the wire: its input schema with the arguments the
 * catalogue adds, and its MCP annotations.
 */
import { z } from "zod";
import { IDEMPOTENCY_KEY_MAX_LENGTH, IDEMPOTENCY_KEY_MIN_LENGTH } from "../config/limits.config";
import { AI_MODEL_FIELD_DESCRIPTION, CONFIRM_FIELD_DESCRIPTION, IDEMPOTENCY_KEY_FIELD_DESCRIPTION } from "../config/instructions.config";
import type { IToolDefinition, IToolDescriptor } from "../interfaces/tool.interface";

/** Arguments the catalogue owns; a toolset declaring one of them is a bug the catalogue test catches. */
export const RESERVED_ARGUMENTS = ["aiModel", "idempotencyKey", "confirm"] as const;

/** True for tools that create, change or remove something. */
export function isWriteTool(tool: IToolDefinition): boolean {
  return tool.access !== "read";
}

/** The tool's own input plus `aiModel` + `idempotencyKey` (writes) and `confirm` (tools with a confirm rule). */
export function buildInputSchema(tool: IToolDefinition): z.ZodObject<any> {
  let schema: z.ZodObject<any> = tool.input;
  if (isWriteTool(tool)) {
    schema = schema.extend({
      aiModel: z.string().describe(AI_MODEL_FIELD_DESCRIPTION),
      idempotencyKey: z.string().min(IDEMPOTENCY_KEY_MIN_LENGTH).max(IDEMPOTENCY_KEY_MAX_LENGTH).optional().describe(IDEMPOTENCY_KEY_FIELD_DESCRIPTION),
    });
  }
  if (tool.confirm) {
    schema = schema.extend({ confirm: z.boolean().optional().describe(CONFIRM_FIELD_DESCRIPTION) });
  }
  return schema;
}

/** MCP annotations, every hint explicit — the protocol's defaults (destructive, open world) are wrong for most tools here. */
export function toAnnotations(tool: IToolDefinition): IToolDescriptor["annotations"] {
  const readOnly = tool.access === "read";
  return {
    readOnlyHint: readOnly,
    destructiveHint: !readOnly && !!tool.annotations?.destructive,
    idempotentHint: readOnly || !!tool.annotations?.idempotent,
    openWorldHint: !!tool.annotations?.openWorld,
  };
}

export function toDescriptor(tool: IToolDefinition): IToolDescriptor {
  return {
    name: tool.name,
    toolset: tool.toolset,
    access: tool.access,
    title: tool.title,
    description: tool.description,
    requiresConfirm: !!tool.confirm,
    annotations: toAnnotations(tool),
  };
}
