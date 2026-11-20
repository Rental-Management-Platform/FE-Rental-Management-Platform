import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import type { ApiClient } from "@/lib/api/client";
import type { RevenueResponse } from "@/lib/api/types";
import type { RevenueRequest } from "../revenue-view";

/** The prefix of every revenue entry (spec 0026, AC-4). */
export const adminRevenueKey = ["admin-revenue"] as const;

/** The entry of one view: all three parts are always set, so each view is its own entry. */
export const adminRevenueRangeKey = ({ from, to, groupBy }: RevenueRequest) =>
  [...adminRevenueKey, { from, to, groupBy }] as const;

/**
 * An answer stays fresh this long. The server answers in about 50 ms and a payment can arrive at
 * any time, so the project default of reading again on window focus is kept: a return to the tab
 * after this minute reads once more (spec 0026, AC-4).
 */
const STALE_MS = 60_000;

/**
 * `GET /orders/revenue` (api-for-frontend.md, 6.38) for a view. It always carries `from`, `to` and
 * `groupBy`: this API reads no days as all time and no `groupBy` as `month`. The page validates the
 * range first, so a 400 here means the contract moved. An admin token already carries
 * `order:report`, so a 403 `PERMISSION_DENIED` is final: no token refresh and no second read.
 */
export const getAdminRevenue = (
  api: ApiClient,
  { from, to, groupBy }: RevenueRequest,
  signal?: AbortSignal,
): Promise<RevenueResponse> =>
  api.get<RevenueResponse>("/orders/revenue", {
    query: { from, to, groupBy },
    signal,
  });

/**
 * One entry per view, fresh for 1 minute. The answer of the view before stays on screen as
 * placeholder data while a new view loads (`isPlaceholderData`). The rest is the project default:
 * it reads again on window focus once the answer is stale, keeps the entry for the default
 * `gcTime`, and retries once for a network error or a gateway error (502, 503, 504), as
 * `shouldRetryQuery` decides. A plain 500 is not retried.
 */
export const adminRevenueQuery = (api: ApiClient, request: RevenueRequest) =>
  queryOptions({
    queryKey: adminRevenueRangeKey(request),
    queryFn: ({ signal }) => getAdminRevenue(api, request, signal),
    staleTime: STALE_MS,
    placeholderData: keepPreviousData,
  });
