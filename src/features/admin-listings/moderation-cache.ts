import type { ModerationListing, Page } from "@/lib/api/types";

// A pure edit of one cached page of the moderation list. It never changes its input, and it leaves
// a page alone when it does not hold the row. A page edited here is read again right after, so
// this only makes the screen right in the meantime, and right if that read fails (scope #21).

/**
 * The page after the server answered for one listing: the row is replaced by the answer, which is
 * the whole moderation row after the change (`status`, `moderationReason` and the rest come from
 * the server, nothing is worked out here). A row that no longer fits a status filter leaves the
 * page when the list is read again, because that read is the truth for the filter.
 */
export function withAnswer(
  page: Page<ModerationListing>,
  answer: ModerationListing,
): Page<ModerationListing> {
  if (!page.items.some((item) => item.id === answer.id)) return page;
  return {
    ...page,
    items: page.items.map((item) => (item.id === answer.id ? answer : item)),
  };
}
