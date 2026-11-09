// The rules of asking again (spec 0012, AC-10), shared by the conversation (4 seconds), the inbox
// (10 seconds) and the unread count (20 seconds). Pure: no React, no clock of its own.

import { isApiError } from "@/lib/api/errors";

/** The longest wait between two asks after errors, in milliseconds. */
const MAX_BACKOFF_MS = 30_000;
/** A 429 that came without a wait: the contract's own default for the chat reads. */
const FALLBACK_RETRY_SECONDS = 60;

const isRateLimited = (error: unknown) =>
  isApiError(error) && error.status === 429;

const waitOf = (error: unknown): number =>
  (isApiError(error) ? error.retryAfterSeconds : null) ??
  FALLBACK_RETRY_SECONDS;

/**
 * How long to wait before asking again, in milliseconds.
 *
 * * No error: `base`.
 * * A 429: the wait the server named (60 seconds when it named none), and then back to `base`.
 * * Any other error (network, 5xx): `base` doubled once for each failure in a row, never more
 *   than 30 seconds. One success sets `failures` back to 0.
 *
 * `failures` is how many asks in a row have failed. It is counted by the caller, because
 * TanStack's own count starts again from 0 at every fetch.
 */
export function nextPollDelay({
  base,
  error,
  failures,
}: {
  base: number;
  error: unknown;
  failures: number;
}): number {
  if (error === null || error === undefined) return base;
  if (isRateLimited(error)) return waitOf(error) * 1000;
  return Math.min(base * 2 ** Math.max(failures, 1), MAX_BACKOFF_MS);
}

/**
 * True while a 429 wait is still running. A tab shown again asks at once, except in this case:
 * "try again now" would break the wait the contract asked for.
 */
export function rateLimitStillRunning({
  error,
  errorUpdatedAt,
  now,
}: {
  error: unknown;
  /** When the error arrived, in milliseconds since the epoch. */
  errorUpdatedAt: number;
  now: number;
}): boolean {
  return isRateLimited(error) && now < errorUpdatedAt + waitOf(error) * 1000;
}

/** Two asks in a row failed: time to say so, once, in a small line (a lone failure stays quiet). */
export const SHOWS_FAILURE_NOTICE_AT = 2;
