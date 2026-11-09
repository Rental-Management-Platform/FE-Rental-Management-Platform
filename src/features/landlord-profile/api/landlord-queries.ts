import { queryOptions } from "@tanstack/react-query";
import type { ApiClient } from "@/lib/api/client";
import type { LandlordProfile } from "@/lib/api/types";
import { landlordKeys } from "./landlord-keys";

/**
 * The browser read of a landlord's profile (api-for-frontend.md, 6.31). The server already read
 * the same profile as a guest, so this exists to get what depends on the viewer: `isFollowing`,
 * which the contract gives only with a valid token. `optional` sends the token when there is one.
 * The caller decides when it runs, with `enabled`, and never while the session is `loading`.
 *
 * Kept a minute and not read again when the window gets focus: a follow writes the answer of the
 * server straight into this key, and a review does the same for the two numbers it changes.
 */
export const landlordProfileQuery = (api: ApiClient, landlordId: string) =>
  queryOptions({
    queryKey: landlordKeys.profile(landlordId),
    queryFn: ({ signal }) =>
      api.get<LandlordProfile>(`/landlords/${landlordId}`, {
        auth: "optional",
        signal,
      }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
