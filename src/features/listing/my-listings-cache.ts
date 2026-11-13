import type {
  OwnerListingDetail,
  OwnerListingSummary,
  Page,
} from "@/lib/api/types";
import { matchesFilter, type ListingFilter } from "./listing-filter";

// Pure edits of one cached page of "Tin của tôi". They never change their input, and they leave
// a page alone when it does not hold the row. A page edited here is read again right after, so
// these only make the screen right in the meantime (spec 0019, AC-5).

/** The page without the row. `total` follows, so the heading and the page links stay honest. */
export function withoutListing(
  page: Page<OwnerListingSummary>,
  id: string,
): Page<OwnerListingSummary> {
  const items = page.items.filter((item) => item.id !== id);
  return items.length === page.items.length
    ? page
    : { ...page, items, total: Math.max(0, page.total - 1) };
}

/**
 * The page after the server answered for one listing: the row takes `status`, `isPublic` and
 * `moderationReason` from the answer, never worked out here. A row that no longer belongs to the
 * filter leaves the page.
 */
export function withAnswer(
  page: Page<OwnerListingSummary>,
  answer: OwnerListingDetail,
  filter: ListingFilter,
): Page<OwnerListingSummary> {
  if (!page.items.some((item) => item.id === answer.id)) return page;
  if (!matchesFilter(filter, answer.status)) {
    return withoutListing(page, answer.id);
  }
  return {
    ...page,
    items: page.items.map((item) =>
      item.id === answer.id
        ? {
            ...item,
            status: answer.status,
            isPublic: answer.isPublic,
            moderationReason: answer.moderationReason,
          }
        : item,
    ),
  };
}
