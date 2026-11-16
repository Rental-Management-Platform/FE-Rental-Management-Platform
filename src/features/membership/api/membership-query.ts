import { queryOptions } from "@tanstack/react-query";
import type { ApiClient } from "@/lib/api/client";
import type { Membership } from "@/lib/api/types";

/**
 * The one cache entry for `GET /me/membership` (spec 0020, AC-6). The status strip, the reason
 * line of a listing that guests cannot see, and the landlord dashboard cards all read it, so one
 * request and one entry serve them and they cannot disagree. It holds the plain `Membership`
 * answer, and the dashboard turns it into its own shape with `select`. The session clears the
 * cache when it changes, so the key needs no user id.
 */
export const membershipKey = ["membership"] as const;

/** `GET /me/membership` (api-for-frontend.md, 6.25): the trial or the plan, the limit and what is left. */
export const getMembership = (api: ApiClient, signal?: AbortSignal) =>
  api.get<Membership>("/me/membership", { signal });

/**
 * The default `staleTime` of 0 is on purpose: the answer gates posting and showing, so one more
 * small read when the page opens or the window gets focus is better than an older answer.
 */
export const membershipQuery = (api: ApiClient) =>
  queryOptions({
    queryKey: membershipKey,
    queryFn: ({ signal }) => getMembership(api, signal),
  });
