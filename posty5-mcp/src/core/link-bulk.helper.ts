/**
 * Shared steps of the short-link / QR batch tools (link-qr-bulk-and-webhooks,
 * BW-D12): the idempotency key a batch is sent under, the confirmation text,
 * and the bounded wait on a QR bulk job that ends in signed links — never
 * file bytes.
 */
import { randomUUID } from "node:crypto";
import { LINK_BULK_TERMINAL_STATUSES, Posty5BulkCreateError } from "@posty5/core";
import type { ILinkBulkJob, IQrCodeBulkRow, QRCodeClient, IBulkDefaults, ILinkBulkJobImageOptions } from "@posty5/qr-code";
import { MCP_BULK_JOB_POLL_MS, MCP_BULK_JOB_WAIT_MS } from "../config/limits.config";
import type { IToolCallContext } from "../interfaces/tool.interface";
import type { IQrBulkJobAnswer } from "../interfaces/link-bulk.interface";

/** The SDK `idempotencyKey` of a batch: the assistant's key, else the host's call id, else a fresh UUID (stdio). */
export function batchIdempotencyKey(call: IToolCallContext): string {
  return call.idempotencyKey ?? call.callId ?? randomUUID();
}

/** The confirmation sentence of a batch create. */
export function describeBatch(count: number, noun: string, extra = ""): string {
  return `Create ${count} ${noun}${count === 1 ? "" : "s"}. Each one is charged as a single create (the price of one is quoted below), so the batch costs up to ${count} times that; rows the API refuses are not charged. Created items can be deleted afterwards, but deleting them does not return the credits.${extra}`;
}

/**
 * Runs an SDK `createMany`. With at most `MCP_BULK_MAX_ROWS` rows the batch is
 * one chunk, so a whole-chunk failure carries no partial result: rethrow its
 * cause so the error mapping sees the API's real 400/403.
 */
export async function unwrapBulkError<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof Posty5BulkCreateError && error.partialResult.created === 0 && error.cause) throw error.cause;
    throw error;
  }
}

export function isFinishedJob(job: ILinkBulkJob): boolean {
  return LINK_BULK_TERMINAL_STATUSES.includes(job.status);
}

/** A job as the model sees it, with signed links to its files once it has finished. */
export async function describeQrBulkJob(client: QRCodeClient, job: ILinkBulkJob): Promise<IQrBulkJobAnswer> {
  const answer: IQrBulkJobAnswer = {
    jobId: job._id,
    status: job.status,
    rowCount: job.source?.rowCount,
    processed: job.progress?.processed,
    created: job.progress?.created,
    failed: job.progress?.failed,
  };
  if (!isFinishedJob(job)) {
    answer.next = "The job is still running. Call qr_code_get_bulk_job with this jobId in a little while.";
    return answer;
  }
  if (job.files?.zip) answer.zip = await client.getBulkJobResultUrl(job._id, "zip");
  if (job.files?.result) answer.result = await client.getBulkJobResultUrl(job._id, "result");
  if (job.files?.errors) answer.errors = await client.getBulkJobResultUrl(job._id, "errors");
  if (answer.zip || answer.result || answer.errors) {
    answer.note = "The links are signed and expire at expiresAt (minutes, not days): give them to the user now. Call qr_code_get_bulk_job again for fresh links.";
  }
  return answer;
}

/** Starts a QR bulk job from the rows and waits up to `MCP_BULK_JOB_WAIT_MS` for it. */
export async function runQrZipJob(
  client: QRCodeClient,
  rows: IQrCodeBulkRow[],
  options: { defaults?: IBulkDefaults; image?: ILinkBulkJobImageOptions; idempotencyKey: string },
): Promise<IQrBulkJobAnswer> {
  const started = (await client.createBulkJob({
    content: JSON.stringify(rows),
    format: "json",
    fileName: "mcp-batch.json",
    defaults: options.defaults,
    image: options.image ?? { format: "png" },
    idempotencyKey: options.idempotencyKey,
  })) as ILinkBulkJob;
  let job = started;
  const deadline = Date.now() + MCP_BULK_JOB_WAIT_MS;
  while (!isFinishedJob(job) && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, MCP_BULK_JOB_POLL_MS));
    job = await client.getBulkJob(started._id);
  }
  return describeQrBulkJob(client, job);
}
