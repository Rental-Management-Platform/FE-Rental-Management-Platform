import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { abortError } from "@/lib/api/abort";
import type { ApiClient } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import type { Statistics } from "@/lib/api/types";
import { rangeQuery, type DateRange } from "@/lib/date-range";

/**
 * The prefix of every statistics entry (spec 0024, AC-4 and AC-20): a listing write or a plan
 * purchase marks all of them out of date by this key.
 */
export const landlordStatsKey = ["landlord-stats"] as const;

/** The entry of one range. `null` for both days means the default 30 days, which sends nothing. */
export const landlordStatsRangeKey = (range: DateRange | null) =>
  [
    ...landlordStatsKey,
    { from: range?.from ?? null, to: range?.to ?? null },
  ] as const;

/** A landlord's answer stays fresh this long, so a window focus reads again only after it. */
const STALE_MS = 60_000;

const isPermissionDenied = (error: unknown) =>
  isApiError(error) &&
  error.status === 403 &&
  error.code === "PERMISSION_DENIED";

/**
 * `GET /me/statistics` (api-for-frontend.md, 6.42) for a range, or for the default 30 days when
 * the range is `null` (no `from` and no `to` are sent). The page validates the range first, so a
 * 400 here means the contract moved.
 *
 * A token issued before `statistic:read` was granted answers 403 `PERMISSION_DENIED` until it is
 * renewed. The first 403 therefore asks for a new token and reads once more (AC-17): at most once
 * per call, and not at all when the caller left meanwhile. A failed renewal throws its own
 * `ApiError`, so the screen shows the matching state (a 429 wait, a 5xx, a network error). A
 * second 403 is thrown as it is, and the screen shows the forbidden state.
 */
export async function getLandlordStats(
  api: ApiClient,
  refreshToken: () => Promise<void>,
  range: DateRange | null,
  signal?: AbortSignal,
): Promise<Statistics> {
  const read = () =>
    api.get<Statistics>("/me/statistics", {
      query: rangeQuery(range),
      signal,
    });
  try {
    return await read();
  } catch (error) {
    if (!isPermissionDenied(error)) throw error;
    await refreshToken();
    if (signal?.aborted) throw abortError();
    return read();
  }
}

/**
 * One entry per range, kept in memory for 60 seconds. The answer of the range before stays on
 * screen as placeholder data while a new range loads (`isPlaceholderData`), and is dropped when
 * the new read fails, so no old numbers stay under a new range.
 */
export const landlordStatsQuery = (
  api: ApiClient,
  refreshToken: () => Promise<void>,
  range: DateRange | null,
) =>
  queryOptions({
    queryKey: landlordStatsRangeKey(range),
    queryFn: ({ signal }) => getLandlordStats(api, refreshToken, range, signal),
    staleTime: STALE_MS,
    placeholderData: keepPreviousData,
  });
