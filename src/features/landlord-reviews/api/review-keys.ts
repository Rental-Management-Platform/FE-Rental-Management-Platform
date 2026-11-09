// The cache keys of the reviews zone (spec 0013, AC-16). They all start with "landlord-reviews" and
// the landlord, so everything of one landlord can be reached from `all`.
//
// `list` carries the viewer, because `isMine` in the rows depends on the token. `mine` does not:
// the whole cache is emptied when the session ends and read again when the person changes
// (spec 0002), so a stale review of another person can never be read from it.

/** `user.id` of a signed in viewer, or `"guest"`. */
export type Viewer = string;

export const reviewKeys = {
  /** Everything about one landlord's reviews. */
  all: (landlordId: string) => ["landlord-reviews", landlordId] as const,
  /** Every page of the public list, for `invalidateQueries`. */
  lists: (landlordId: string) =>
    ["landlord-reviews", landlordId, "list"] as const,
  /** One page of the public list as one viewer sees it. */
  list: (landlordId: string, viewer: Viewer, page: number) =>
    ["landlord-reviews", landlordId, "list", viewer, page] as const,
  /** The viewer's own review and whether they may write one: `GET /landlords/:id/review`. */
  mine: (landlordId: string) =>
    ["landlord-reviews", landlordId, "mine"] as const,
};
