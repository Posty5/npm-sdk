/**
 * What the model reads when the host's own code fails during a call. Fixed
 * text: a host error may carry tokens or internal URLs, so its message goes to
 * `afterToolCall` (`outcome.errorMessage`) only, never into the transcript.
 */

/** `beforeToolCall` threw. */
export const HOOK_FAILED_MESSAGE = "The call was refused.";

/** `connection()` or building the SDK client threw. */
export const CLIENT_FAILED_MESSAGE = "Could not prepare the Posty5 client.";
