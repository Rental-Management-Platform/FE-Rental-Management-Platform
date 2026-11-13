/**
 * The last page that can hold a row, never below 1 (a `total` of 0 still has page 1). A list that
 * is asked for a page past it goes here (spec 0019, AC-4).
 */
export const lastPageOf = (total: number, pageSize: number): number =>
  Math.max(1, Math.ceil(total / pageSize));
