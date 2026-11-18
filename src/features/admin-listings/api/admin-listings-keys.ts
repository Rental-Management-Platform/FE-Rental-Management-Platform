import type { ModerationFilters } from "../moderation-filter";

/**
 * The cache keys of the listing moderation page (scope #21). The session clears the cache when it
 * changes, so no key needs a user id. Everything starts with `adminListingsKey`, so one call can
 * mark every page of every filter out of date together.
 */
export const adminListingsKey = ["admin", "listings"] as const;

/** One page of one set of filters. `list` is the third part, so it never meets another read. */
export const adminListingsListKey = (
  params: ModerationFilters & { page: number; pageSize: number },
) => [...adminListingsKey, "list", params] as const;
