// What the list of reviews shows, decided from the answer of the API (spec 0013, AC-11 and AC-12).
// Pure: no React.

import type { Page, PublicReview } from "@/lib/api/types";

/** How many reviews one page holds. The contract allows 1 to 50; the zone asks for 10. */
export const REVIEWS_PAGE_SIZE = 10;

/**
 * The items without the viewer's own. The viewer's visible review comes from `GET /review` and is
 * pinned at the top of the zone, so it must not show twice. `total`, the page count and the count
 * in the heading are never changed for it.
 */
export const withoutMine = (
  items: readonly PublicReview[],
): readonly PublicReview[] => items.filter((item) => item.isMine !== true);

/**
 * How many pages there are, from the `total` of the list. It still counts the viewer's own visible
 * review, so a page can hold fewer than 10 rows.
 */
export const pageCount = (total: number): number =>
  Math.ceil(total / REVIEWS_PAGE_SIZE);

/** What the list area draws. */
export type ListView =
  /** `total` is 0: nobody has reviewed. */
  | { kind: "empty" }
  /** At least one row is left after the viewer's own is dropped. */
  | { kind: "rows"; rows: readonly PublicReview[] }
  /** Items came back but only the viewer's own, which is already pinned. */
  | { kind: "only-mine" }
  /** No items although `total` is above 0: a page past the last one. */
  | { kind: "past-end" };

/** Turns one answer of the list into what to draw, in the order of AC-12. */
export function listView({
  items,
  total,
}: Pick<Page<PublicReview>, "items" | "total">): ListView {
  if (total === 0) return { kind: "empty" };
  if (items.length === 0) return { kind: "past-end" };
  const rows = withoutMine(items);
  return rows.length === 0 ? { kind: "only-mine" } : { kind: "rows", rows };
}
