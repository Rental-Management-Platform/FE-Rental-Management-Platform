"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRangeInAddress } from "@/components/stats/use-range-in-address";
import { useShownAnswer } from "@/components/stats/use-shown-answer";
import { todayInVietnam, type DateRange } from "@/lib/date-range";
import { useApi, useSession } from "@/lib/session/auth-provider";
import { can } from "@/lib/session/can";
import { adminRevenueQuery } from "../api/admin-revenue";
import {
  answeredView,
  effectiveRange,
  parseGroupBy,
  revenueHref,
  type GroupBy,
  type RevenueRequest,
  type ShownRevenue,
} from "../revenue-view";

/**
 * The revenue of the view in the address (spec 0026, AC-1, AC-2 and AC-4). The range comes from
 * `useRangeInAddress` (no params, or anything that breaks the contract, is the last 30 days) and the
 * request always carries two real days and the grouping, because this API reads no days as all
 * time. `allowed` is the permission check on the current permissions of `GET /auth/me`: with it off
 * no request is made.
 *
 * - `shown` is the answer to draw, with the view it is the answer of: the one of the view before
 *   while a new view loads, and nothing once that view has failed.
 * - `busy` is true while a read runs and an answer is drawn: a new view, or a return to the tab
 *   after the answer went stale.
 *
 * `useSearchParams` needs a `<Suspense>` boundary above the screen that calls this hook.
 */
export function useAdminRevenue() {
  const api = useApi();
  const session = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { range } = useRangeInAddress();
  const groupBy = parseGroupBy(searchParams.get("groupBy"));

  const request: RevenueRequest = {
    ...effectiveRange(range, todayInVietnam(new Date())),
    groupBy,
  };
  const allowed = can(session, "order:report");
  const query = useQuery({
    ...adminRevenueQuery(api, request),
    enabled: allowed,
  });
  const { data } = useShownAnswer(query);
  const shown: ShownRevenue | undefined =
    data === undefined
      ? undefined
      : { answer: data, view: answeredView(data, request) };

  // A new view replaces the address and stays where the page is, keeping the other part of the
  // view: a change of range keeps the grouping and a change of grouping keeps the range.
  const setRange = (next: DateRange | null) =>
    router.replace(revenueHref(pathname, next, groupBy), { scroll: false });
  const setGroupBy = (next: GroupBy) =>
    router.replace(revenueHref(pathname, range, next), { scroll: false });

  return {
    range,
    groupBy,
    setRange,
    setGroupBy,
    query,
    allowed,
    shown,
    busy: query.isFetching && shown !== undefined,
  };
}
