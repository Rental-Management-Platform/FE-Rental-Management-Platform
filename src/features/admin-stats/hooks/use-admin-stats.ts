"use client";

import {
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { useRangeInAddress } from "@/components/stats/use-range-in-address";
import { useShownAnswer } from "@/components/stats/use-shown-answer";
import type { AdminOverview } from "@/lib/api/types";
import { useApi, useSession } from "@/lib/session/auth-provider";
import { can } from "@/lib/session/can";
import { adminStatsKey, adminStatsQuery } from "../api/admin-stats";

// The newest answer of any range still in memory. The strip and the three state zones ignore the
// range, so when a range fails they stay on screen from the answer read before it: a read that
// has been drawn once is not taken away by the next one that fails (spec 0025, AC-13).
function keptAnswer(queryClient: QueryClient): AdminOverview | undefined {
  const newest = queryClient
    .getQueriesData<AdminOverview>({ queryKey: adminStatsKey })
    .flatMap(([key, data]) =>
      data === undefined
        ? []
        : [
            {
              data,
              at:
                queryClient.getQueryState<AdminOverview>(key)?.dataUpdatedAt ??
                0,
            },
          ],
    )
    .sort((a, b) => b.at - a.at)[0];
  return newest?.data;
}

/**
 * The overview of the platform for the range in the address (spec 0025, AC-1, AC-2 and AC-4).
 * The range comes from `useRangeInAddress`: no params, or anything that breaks the contract, is
 * the default 30 days, and the request then carries neither day. `allowed` is the permission
 * check on the current permissions of `GET /auth/me`: with it off no request is made.
 *
 * - `shown` is the answer to draw under the range bar: the kept answer of the range before while a
 *   new range loads, and nothing once that range has failed.
 * - `kept` is what the strip and the state zones above the bar draw: `shown`, or the newest answer
 *   still in memory when the range failed, so the page does not jump.
 * - `busy` is true while a read runs and an answer is drawn: a range change, or an entry that a
 *   write marked out of date and that is read again on return.
 *
 * `useSearchParams` needs a `<Suspense>` boundary above the screen that calls this hook.
 */
export function useAdminStats() {
  const api = useApi();
  const session = useSession();
  const queryClient = useQueryClient();
  const { range, setRange } = useRangeInAddress();

  const allowed =
    can(session, "statistic:report") || can(session, "statistic:manage");
  const query = useQuery({ ...adminStatsQuery(api, range), enabled: allowed });
  const { data: shown } = useShownAnswer(query);

  return {
    range,
    setRange,
    query,
    allowed,
    shown,
    kept: shown ?? keptAnswer(queryClient),
    busy: query.isFetching && shown !== undefined,
  };
}
