// Every day or month of a range, with its numbers or 0 (spec 0026, AC-8). The API's `series` is
// sparse: a day or month with no paid order has no entry. This is the only thing the page does to
// the answer, and it adds nothing: it places each entry where its `period` is and puts 0 elsewhere.
// Pure: no React and no clock.
import type { DateOnly, RevenueResponse } from "@/lib/api/types";
import { addDays, daysInRange } from "@/lib/date-range";
import type { GroupBy } from "./revenue-view";

/** One day, or one month, of the chart and the table. */
export interface FilledPeriod {
  /** The day, or the first day of the month (`2026-11-01`), which the chart and the table read. */
  date: DateOnly;
  paidCount: number;
  paidAmount: number;
}

type Entry = RevenueResponse["series"][number];

// "2026-10-03" becomes [2026, 10].
const yearAndMonth = (date: DateOnly): [number, number] => [
  Number(date.slice(0, 4)),
  Number(date.slice(5, 7)),
];

// Every `YYYY-MM` from the month of `from` to the month of `to`, both counted.
function monthsBetween(from: DateOnly, to: DateOnly): string[] {
  const [fromYear, fromMonth] = yearAndMonth(from);
  const [toYear, toMonth] = yearAndMonth(to);
  const count = (toYear - fromYear) * 12 + (toMonth - fromMonth) + 1;
  return Array.from({ length: Math.max(0, count) }, (_, step) => {
    const index = fromMonth - 1 + step;
    const year = fromYear + Math.floor(index / 12);
    const month = (index % 12) + 1;
    return `${year}-${String(month).padStart(2, "0")}`;
  });
}

// Every day from `from` to `to`, both counted.
const daysBetween = (from: DateOnly, to: DateOnly): DateOnly[] =>
  Array.from({ length: Math.max(0, daysInRange(from, to)) }, (_, step) =>
    addDays(from, step),
  );

/**
 * Every day from `from` to `to` (by day) or every month from the month of `from` to that of `to`
 * (by month), each with the entry of `series` whose `period` is it, or 0 and 0. A month point is
 * dated the first of the month, so the chart can label it `MM/yyyy`.
 */
export function fillSeries(
  series: readonly Entry[],
  from: DateOnly,
  to: DateOnly,
  groupBy: GroupBy,
): FilledPeriod[] {
  const byPeriod = new Map(series.map((entry) => [entry.period, entry]));
  const periods =
    groupBy === "month" ? monthsBetween(from, to) : daysBetween(from, to);
  return periods.map((period) => {
    const entry = byPeriod.get(period);
    return {
      date: groupBy === "month" ? `${period}-01` : period,
      paidCount: entry?.paidCount ?? 0,
      paidAmount: entry?.paidAmount ?? 0,
    };
  });
}
