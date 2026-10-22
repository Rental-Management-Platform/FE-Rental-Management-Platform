import { isApiError } from "./errors";

// Statuses that mean "the server or the way to it is not ready right now": bad gateway,
// service unavailable, gateway timeout.
const TEMPORARY_STATUSES: readonly number[] = [502, 503, 504];

/**
 * The `retry` default for every query. Retries once, and only when trying again can help:
 * the network failed, or a gateway in front of the API did. Never for a 4xx (the request is
 * wrong), a 429 (a retry only lengthens the block), `TIMEOUT` (the server is already slow),
 * a 500 (the same request will fail the same way), or an error that is not an `ApiError`.
 * TanStack counts failures from 0, so `failureCount` is 0 after the first failure.
 */
export function shouldRetryQuery(
  failureCount: number,
  error: unknown,
): boolean {
  if (failureCount >= 1 || !isApiError(error)) return false;
  return (
    error.code === "NETWORK_ERROR" || TEMPORARY_STATUSES.includes(error.status)
  );
}
