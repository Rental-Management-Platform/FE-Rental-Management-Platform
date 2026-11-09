import { cache } from "react";
import { LISTING_PAGE_SIZE } from "@/features/listing-search/schemas/search-params";
import { serverGet } from "@/lib/api/server";
import type { Page, PublicListingSummary } from "@/lib/api/types";

/**
 * One page of the listings a landlord has visible, newest first, read on the server as a guest
 * (api-for-frontend.md, 6.36). The list takes only `page` and `pageSize`: any other parameter is a
 * 400. Every item has the same shape as an item of `GET /listings`, so the same card draws it. A
 * guest read answers `isFavorite` as `null`.
 *
 * `cache()` only de-duplicates the calls of one render. It keeps nothing between visits, so a
 * listing that was just hidden leaves the list at once.
 */
export const getLandlordListings = cache(
  (landlordId: string, page: number): Promise<Page<PublicListingSummary>> =>
    serverGet<Page<PublicListingSummary>>(`/landlords/${landlordId}/listings`, {
      page,
      pageSize: LISTING_PAGE_SIZE,
    }),
);
