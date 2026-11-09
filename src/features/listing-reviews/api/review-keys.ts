// The cache keys of the room reviews block (spec 0014, AC-19). They all start with
// "listing-reviews" and the listing, so everything of one room can be reached from `all`. No key is
// shared with the landlord reviews ("landlord-reviews"), and a room write never touches the
// landlord profile (contract trap 6).
//
// `list` carries the viewer, because `isMine` in the rows depends on the token. `mine` does not:
// the whole cache is emptied when the session ends and read again when the person changes
// (spec 0002), so a stale review of another person can never be read from it.

/** `user.id` of a signed in viewer, or `"guest"`. */
export type Viewer = string;

export const listingReviewKeys = {
  /** Everything about one room's reviews. */
  all: (listingId: string) => ["listing-reviews", listingId] as const,
  /** Every page of the public list, for `invalidateQueries`. */
  lists: (listingId: string) => ["listing-reviews", listingId, "list"] as const,
  /** One page of the public list as one viewer sees it. */
  list: (listingId: string, viewer: Viewer, page: number) =>
    ["listing-reviews", listingId, "list", viewer, page] as const,
  /** The viewer's own review and whether they may write one: `GET /listings/:id/review`. */
  mine: (listingId: string) => ["listing-reviews", listingId, "mine"] as const,
  /** The two numbers under the heading: `reviewCount` and `ratingAverage` of the detail. */
  summary: (listingId: string) =>
    ["listing-reviews", listingId, "summary"] as const,
};
