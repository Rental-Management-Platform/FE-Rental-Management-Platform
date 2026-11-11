import "server-only";
import { serverEnv } from "@/lib/env.server";
import { isApiError, networkError, timeoutError } from "./errors";
import { buildUrl, parseResponse, type Query } from "./http";

// A server render waits for this read, so it gives up sooner than the browser client (20 s).
const SERVER_TIMEOUT_MS = 10_000;

/**
 * A public read made on the server, as a guest (spec 0001, spec 0009). It sends no
 * `Authorization` header and no cookie, so the answer is the same for everyone and the server
 * never holds a token. It is never cached by `fetch` itself, so a listing that was just hidden
 * leaves the page at once (a caller may still wrap it in `use cache`). Every failure is an
 * `ApiError`: a 4xx or 5xx answer, `TIMEOUT` after 10 seconds (or `timeoutMs`), `NETWORK_ERROR`
 * when no answer came, `INVALID_RESPONSE` when the body is not JSON. `timeoutMs` lets a read that
 * must not hold a page back, such as the ward catalog, give up sooner (spec 0016, AC-10).
 */
export async function serverGet<T>(
  path: string,
  query?: Query,
  { timeoutMs = SERVER_TIMEOUT_MS }: { timeoutMs?: number } = {},
): Promise<T> {
  const timeout = AbortSignal.timeout(timeoutMs);
  try {
    const response = await fetch(buildUrl(serverEnv.API_URL, path, query), {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: timeout,
    });
    return await parseResponse<T>(response, { method: "GET", path });
  } catch (error) {
    if (isApiError(error)) throw error;
    throw timeout.aborted ? timeoutError() : networkError();
  }
}
