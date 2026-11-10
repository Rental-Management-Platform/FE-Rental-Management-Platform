// Pure edits of what the browser keeps about saved listings. No React, no query client: the cache
// code in `favorite-cache.ts` hands these a value and stores what they return.

import type { Page, SavedListing, Uuid } from "@/lib/api/types";

/**
 * The flags of one list read with the token, by listing `id`. `null` is a row the API answered as
 * a guest (a token that ran out without a 401, api-for-frontend.md section 4).
 */
export type FlagMap = Record<Uuid, boolean | null>;

/** The part of a list row the flags need. Every list that carries `isFavorite` has these two. */
export type FlaggedRow = { id: Uuid; isFavorite: boolean | null };

export const flagMapOf = (rows: readonly FlaggedRow[]): FlagMap =>
  Object.fromEntries(rows.map((row) => [row.id, row.isFavorite]));

/**
 * The map with one listing's flag replaced, or the same map when it does not hold that listing,
 * so a list that never showed the row is left alone.
 */
export const withFlag = <T extends FlagMap | undefined>(
  map: T,
  id: Uuid,
  flag: boolean,
): T => (map !== undefined && id in map ? { ...map, [id]: flag } : map);

/** A saved page without one listing, and a total that is one lower when the listing was on it. */
export const withoutListing = (
  page: Page<SavedListing>,
  id: Uuid,
): Page<SavedListing> => {
  const items = page.items.filter((item) => item.id !== id);
  return items.length === page.items.length
    ? page
    : { ...page, items, total: Math.max(0, page.total - 1) };
};
