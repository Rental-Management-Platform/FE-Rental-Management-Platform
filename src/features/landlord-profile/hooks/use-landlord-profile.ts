"use client";

import { useQuery } from "@tanstack/react-query";
import type { LandlordProfile } from "@/lib/api/types";
import { useApi, useSession } from "@/lib/session/auth-provider";
import { landlordProfileQuery } from "../api/landlord-queries";

/**
 * The profile of one landlord in the browser, under `landlordKeys.profile(id)`. The follow button,
 * the header, the numbers zone and the reviews zone (spec 0013) all call it, so one follow or one
 * review changes every one of them.
 *
 * `initial` is what the server read as a guest. The profile page passes it, and the first caller
 * to mount puts it in the cache; a caller that passes nothing reads what is there. It is marked
 * stale from the start (`initialDataUpdatedAt: 0`), so a signed in person reads the profile again
 * with the token at once, to get `isFollowing`. A guest keeps the server answer, which is what a
 * guest read gives anyway, and makes no second request. It never runs while the session is
 * `loading`.
 */
export function useLandlordProfile(
  landlordId: string,
  initial?: LandlordProfile,
) {
  const api = useApi();
  const session = useSession();

  return useQuery({
    ...landlordProfileQuery(api, landlordId),
    initialData: initial,
    initialDataUpdatedAt: 0,
    enabled: session.status === "user",
  });
}
