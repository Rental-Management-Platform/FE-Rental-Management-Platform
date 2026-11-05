import { queryOptions } from "@tanstack/react-query";
import type { ApiClient } from "@/lib/api/client";
import type { ListingDetail } from "@/lib/api/types";

// The key of the browser read of one listing. #14 reads `isFavorite` from the same key, so a
// signed in person never makes a second read for it.
export const listingDetailKey = (code: string) =>
  ["listing-detail", code] as const;

/**
 * The browser read of one listing for a signed in person (spec 0010, AC-8). The server already
 * read the same listing as a guest, so this exists only to get what depends on the viewer: the
 * landlord's phone number, which the contract gives only with a valid token. `optional` sends
 * the token when there is one. Kept 5 minutes and not read again when the window gets focus.
 * The caller decides when it runs, with `enabled`.
 */
export const listingDetailQuery = (api: ApiClient, code: string) =>
  queryOptions({
    queryKey: listingDetailKey(code),
    queryFn: ({ signal }) =>
      api.get<ListingDetail>(`/listings/${code}`, { auth: "optional", signal }),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
