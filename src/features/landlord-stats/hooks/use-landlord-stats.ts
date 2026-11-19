"use client";

import { useQuery } from "@tanstack/react-query";
import { useRangeInAddress } from "@/components/stats/use-range-in-address";
import {
  useApi,
  useSession,
  useSessionActions,
} from "@/lib/session/auth-provider";
import { can } from "@/lib/session/can";
import { landlordStatsQuery } from "../api/landlord-stats";

/**
 * The statistics of the landlord for the range in the address (spec 0024, AC-1, AC-2 and AC-4).
 * The range comes from `useRangeInAddress`: no params, or anything that breaks the contract, is
 * the default 30 days, and the request then carries neither day. `allowed` is the permission check
 * on the current permissions of `GET /auth/me`: with it off no request is made.
 *
 * `useSearchParams` needs a `<Suspense>` boundary above the screen that calls this hook.
 */
export function useLandlordStats() {
  const api = useApi();
  const session = useSession();
  const { refreshToken } = useSessionActions();
  const { range, setRange } = useRangeInAddress();

  const allowed =
    can(session, "statistic:read") || can(session, "statistic:manage");
  const query = useQuery({
    ...landlordStatsQuery(api, refreshToken, range),
    enabled: allowed,
  });

  return { range, setRange, query, allowed };
}
