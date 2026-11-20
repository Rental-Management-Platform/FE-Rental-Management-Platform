// The ward list of the admin overview (spec 0025, AC-12). Pure: it cuts the list the API sent and
// finds the largest count of the rows shown. It never adds counts: the total of the rows is the
// "Tin mới" card, and a total of the rows is never drawn.
import type { AdminOverviewWard } from "@/lib/api/types";

/** The rows drawn at first; the rest are one click away in a table. */
export const WARDS_SHOWN = 10;

export interface WardSplit {
  /** The first rows, in the API order. The rank of a row is its place in this list. */
  shown: readonly AdminOverviewWard[];
  /** How many rows are left out: a count of rows, not of listings. */
  rest: number;
}

/** The first `limit` rows and the number of rows left, with the order the API gave kept. */
export const splitWards = (
  rows: readonly AdminOverviewWard[],
  limit: number = WARDS_SHOWN,
): WardSplit => ({
  shown: rows.slice(0, limit),
  rest: Math.max(0, rows.length - limit),
});

/** The largest count among these rows: it only sets the length of a bar. */
export const largestCount = (rows: readonly AdminOverviewWard[]): number =>
  Math.max(0, ...rows.map((row) => row.count));
