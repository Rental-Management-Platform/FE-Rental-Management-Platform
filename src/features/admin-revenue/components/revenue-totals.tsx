import { useId } from "react";
import { MetricCard } from "@/components/stats/metric-card";
import type { RevenueResponse } from "@/lib/api/types";
import { formatCount, formatMoney } from "@/lib/format";
import {
  DATE_NOTE,
  PAID_COUNT_LABEL,
  REVENUE_CARD_LABEL,
  TOTALS_TITLE,
} from "../revenue-text";

/**
 * The two totals of the range under the range bar (spec 0026, AC-5): the money of paid orders and
 * how many orders were paid, each an item card with no arrow and no previous value, because the API
 * gives none. Both numbers are fields of the answer, and the same two are shown again as the last
 * row of the plan list and of the table, so the three always match (AC-11). A zero is muted. One
 * quiet line says the totals count by paid date, so they can differ from the orders screen.
 */
export function RevenueTotals({ answer }: { answer: RevenueResponse }) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h2 id={headingId} className="text-base font-semibold">
        {TOTALS_TITLE}
      </h2>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <li className="min-w-0">
          <MetricCard
            label={REVENUE_CARD_LABEL}
            value={formatMoney(answer.paidAmount)}
            change={null}
            muted={answer.paidAmount === 0}
          />
        </li>
        <li className="min-w-0">
          <MetricCard
            label={PAID_COUNT_LABEL}
            value={formatCount(answer.paidCount)}
            change={null}
            muted={answer.paidCount === 0}
          />
        </li>
      </ul>
      <p className="text-sm text-muted-foreground">{DATE_NOTE}</p>
    </section>
  );
}
