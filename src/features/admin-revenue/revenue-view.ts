// The view of the revenue page (spec 0026, AC-2 and AC-3): a range of days and a grouping, both kept
// in the address. Pure: no React, no clock of its own (every function takes the day it needs).
import type { DateOnly, RevenueResponse } from "@/lib/api/types";
import { defaultRange, type DateRange } from "@/lib/date-range";

export type GroupBy = RevenueResponse["groupBy"];

/** `?groupBy=month` means by month; anything else, or nothing, means by day. */
export const parseGroupBy = (value: string | null): GroupBy =>
  value === "month" ? "month" : "day";

/**
 * The range the request carries. This API reads no days as all time, so unlike the overviews the
 * page always sends two real days: the range of the address, or the last 30 days ending `today`.
 */
export const effectiveRange = (
  range: DateRange | null,
  today: DateOnly,
): DateRange => range ?? defaultRange(today);

/** What one request asks for: both days and the grouping, always all three. */
export interface RevenueRequest extends DateRange {
  groupBy: GroupBy;
}

/**
 * The address of a view: `/admin/revenue`, `/admin/revenue?from=…&to=…`, `…?groupBy=month` or both.
 * A change of range keeps the grouping and the reverse, so each is one argument here. By day and
 * the default 30 days write nothing, which keeps the address clean.
 */
export function revenueHref(
  pathname: string,
  range: DateRange | null,
  groupBy: GroupBy,
): string {
  const params = [
    ...(range === null ? [] : [`from=${range.from}`, `to=${range.to}`]),
    ...(groupBy === "month" ? ["groupBy=month"] : []),
  ];
  return params.length === 0 ? pathname : `${pathname}?${params.join("&")}`;
}

/**
 * The view an answer holds. The API gives back the days and the grouping that were sent, and a
 * placeholder answer (the view before, kept while a new one loads) is the one drawn, so the chart
 * and the table read the view from the answer and not from the address. `from` and `to` are `null`
 * in the type only because the API allows no range; this page always sends both, so `sent` is a
 * fallback that is never reached with a real answer.
 */
export const answeredView = (
  answer: RevenueResponse,
  sent: RevenueRequest,
): RevenueRequest => ({
  from: answer.from ?? sent.from,
  to: answer.to ?? sent.to,
  groupBy: answer.groupBy,
});

/** The answer to draw, with the view it is the answer of. */
export interface ShownRevenue {
  answer: RevenueResponse;
  view: RevenueRequest;
}
