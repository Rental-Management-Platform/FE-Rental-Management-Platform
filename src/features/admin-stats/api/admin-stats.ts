import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import type { ApiClient } from "@/lib/api/client";
import type { AdminOverview } from "@/lib/api/types";
import { rangeQuery, type DateRange } from "@/lib/date-range";

/**
 * The prefix of every overview entry (spec 0025, AC-4 and AC-17): a lock, a hide or an unhide by
 * an admin marks all of them out of date by this key.
 */
export const adminStatsKey = ["admin-stats"] as const;

/** The entry of one range. `null` for both days means the default 30 days, which sends nothing. */
export const adminStatsRangeKey = (range: DateRange | null) =>
  [
    ...adminStatsKey,
    { from: range?.from ?? null, to: range?.to ?? null },
  ] as const;

/**
 * An answer stays fresh this long. The server needs about 3 seconds when the platform has tens of
 * thousands of listings, so a window focus does not read again and no timer does either: the
 * answer is read again when its range is opened after this time, or when a write marked it out
 * of date (spec 0025, AC-4).
 */
const STALE_MS = 5 * 60_000;

/**
 * `GET /statistics/overview` (api-for-frontend.md, 6.43) for a range, or for the default 30 days
 * when the range is `null` (no `from` and no `to` are sent). The page validates the range first, so
 * a 400 here means the contract moved. An admin token already carries `statistic:manage`, which
 * includes `statistic:report`, so a 403 `PERMISSION_DENIED` is final: there is no token refresh
 * and no second read.
 */
export const getAdminStats = (
  api: ApiClient,
  range: DateRange | null,
  signal?: AbortSignal,
): Promise<AdminOverview> =>
  api.get<AdminOverview>("/statistics/overview", {
    query: rangeQuery(range),
    signal,
  });

/**
 * One entry per range, kept in memory for 5 minutes without reading on window focus. The answer
 * of the range before stays on screen as placeholder data while a new range loads
 * (`isPlaceholderData`). The rest is the project default: it reads again when the screen mounts
 * and the answer is out of date, keeps the entry for the default `gcTime`, and retries once for a
 * network error or a 5xx.
 */
export const adminStatsQuery = (api: ApiClient, range: DateRange | null) =>
  queryOptions({
    queryKey: adminStatsRangeKey(range),
    queryFn: ({ signal }) => getAdminStats(api, range, signal),
    staleTime: STALE_MS,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
