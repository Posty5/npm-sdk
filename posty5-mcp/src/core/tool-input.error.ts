/**
 * Arguments the schema let through but the tool cannot use — a rule spanning
 * fields (exactly one of workspaceId / accountId), or the fields one `type`
 * or `section` needs. Answered as a tool error naming what to fix.
 */
export class ToolInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ToolInputError";
  }
}
