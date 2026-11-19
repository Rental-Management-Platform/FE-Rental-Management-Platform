import type { LandlordFilters, ListingFilters } from "../review-filter";

/**
 * The cache keys of the review moderation page (scope #36). The session clears the cache when it
 * changes, so no key needs a user id. Everything starts with `adminReviewsKey`, and each kind of
 * review has its own branch under it, because the ids of the two kinds come from different tables
 * and a route of one kind answers 404 to an id of the other. The two lists never share a key.
 */
export const adminReviewsKey = ["admin", "reviews"] as const;

/** Every page of the landlord reviews, whatever the filters. */
export const adminLandlordReviewsKey = [
  ...adminReviewsKey,
  "landlord",
] as const;

/** One page of one set of filters. `list` is the fourth part, so it never meets another read. */
export const adminLandlordReviewsListKey = (
  params: LandlordFilters & { page: number; pageSize: number },
) => [...adminLandlordReviewsKey, "list", params] as const;

/** Every page of the room reviews, whatever the filters. */
export const adminListingReviewsKey = [...adminReviewsKey, "listing"] as const;

/** One page of one set of filters of the room reviews. Same shape as the landlord one, its own branch. */
export const adminListingReviewsListKey = (
  params: ListingFilters & { page: number; pageSize: number },
) => [...adminListingReviewsKey, "list", params] as const;
