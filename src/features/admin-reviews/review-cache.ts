import type { Page } from "@/lib/api/types";

// Pure edits of one cached page of a review moderation list, for either kind of review. They never
// change their input, and they leave a page alone when it does not hold the row. A page edited here
// is read again right after, so this only makes the screen right in the meantime, and right if that
// read fails (scope #36).

/**
 * The page after the server answered for one review: the row is replaced by the answer, which is
 * the whole moderation row after the change (`status` and `hiddenReason` come from the server,
 * nothing is worked out here). A row that no longer fits a status filter leaves the page when the
 * list is read again, because that read is the truth for the filter.
 */
export function withAnswer<Row extends { id: string }>(
  page: Page<Row>,
  answer: Row,
): Page<Row> {
  if (!page.items.some((item) => item.id === answer.id)) return page;
  return {
    ...page,
    items: page.items.map((item) => (item.id === answer.id ? answer : item)),
  };
}

/**
 * The page after a review turned out to be gone (the writer deleted it, 404): the row leaves and
 * the total goes down by one. The total is only a guess until the list is read again, which is
 * right after.
 */
export function withoutRow<Row extends { id: string }>(
  page: Page<Row>,
  id: string,
): Page<Row> {
  if (!page.items.some((item) => item.id === id)) return page;
  return {
    ...page,
    items: page.items.filter((item) => item.id !== id),
    total: Math.max(0, page.total - 1),
  };
}
