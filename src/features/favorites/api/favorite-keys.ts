import type { Query } from "@/lib/api/http";
import type { Uuid } from "@/lib/api/types";

/**
 * The keys of the favorite queries in the browser. Two families, so a write can reach all of one
 * kind at once:
 * - `saved`: the pages of the saved page (`GET /me/favorites`), one key per page number.
 * - `flags`: the flags of a public list read again with the token (the overlay of spec 0001),
 *   one key per person and list. The id of the person is in the key, because these reads are
 *   `optional` and an expired token turns them into a guest answer that must not be reused.
 * The heart of the detail page has no key here: it reads `["listing-detail", code]` (spec 0010).
 */
export const favoriteKeys = {
  saved: () => ["favorites", "saved"] as const,
  savedPage: (page: number) => ["favorites", "saved", page] as const,
  flags: () => ["favorites", "flags"] as const,
  listFlags: (userId: Uuid, path: string, query: Query) =>
    ["favorites", "flags", userId, path, query] as const,
};
