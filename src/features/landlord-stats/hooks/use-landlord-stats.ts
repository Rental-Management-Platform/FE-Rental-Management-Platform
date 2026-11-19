"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { parseRange, todayInVietnam } from "@/lib/date-range";
import {
  useApi,
  useSession,
  useSessionActions,
} from "@/lib/session/auth-provider";
import { can } from "@/lib/session/can";
import { landlordStatsQuery } from "../api/landlord-stats";

/**
 * The statistics of the landlord for the range in the address (spec 0024, AC-1, AC-2 and AC-4).
 * The address holds `?from=&to=`; anything that breaks the contract, or no params, is the default
 * 30 days, and the request then carries neither day. `allowed` is the permission check on the
 * current permissions of `GET /auth/me`: with it off no request is made. "Today" is read on each
 * render, never kept from mount, so a pair that was the default yesterday is not taken for it.
 *
 * `useSearchParams` needs a `<Suspense>` boundary above the screen that calls this hook.
 */
export function useLandlordStats() {
  const api = useApi();
  const session = useSession();
  const { refreshToken } = useSessionActions();
  const searchParams = useSearchParams();

  const allowed =
    can(session, "statistic:read") || can(session, "statistic:manage");
  const range = parseRange(
    searchParams.get("from"),
    searchParams.get("to"),
    todayInVietnam(new Date()),
  );
  const query = useQuery({
    ...landlordStatsQuery(api, refreshToken, range),
    enabled: allowed,
  });

  return { range, query, allowed };
}
