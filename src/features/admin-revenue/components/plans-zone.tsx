import { StatBar } from "@/components/stats/stat-bar";
import { StatRow } from "@/components/stats/stat-row";
import { StatsZone } from "@/components/stats/stats-zone";
import type { RevenueResponse } from "@/lib/api/types";
import { formatMoney } from "@/lib/format";
import {
  PLANS_EMPTY_TEXT,
  PLANS_ZONE_TITLE,
  TOTAL_ROW_LABEL,
  ordersLine,
} from "../revenue-text";

/**
 * The zone "Doanh thu theo gói" (spec 0026, AC-10 and AC-11): every plan with a paid order in the
 * range, in the order the API gave (amount falling), each with its name, its money, a quiet line
 * with its orders and a thin bar against the plan that sold most. The last row "Tổng" shows
 * `paidAmount` and `paidCount` of the answer, the same two numbers as the cards and the table,
 * never the rows added here. With no plan, the zone says so and has no total row. The name is the
 * plan's current name, as the API gives it.
 */
export function PlansZone({ answer }: { answer: RevenueResponse }) {
  const { byPlan } = answer;
  // A width only: the bars compare the rows with each other, and are hidden from a screen reader.
  const largest = Math.max(0, ...byPlan.map((plan) => plan.paidAmount));
  return (
    <StatsZone title={PLANS_ZONE_TITLE}>
      {byPlan.length === 0 ? (
        <p className="text-sm text-muted-foreground">{PLANS_EMPTY_TEXT}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {byPlan.map((plan) => (
            <li key={plan.planId} className="flex flex-col gap-1.5">
              <StatRow
                label={plan.planName}
                value={formatMoney(plan.paidAmount)}
                note={ordersLine(plan.paidCount)}
                muted={plan.paidAmount === 0}
              />
              <StatBar value={plan.paidAmount} largest={largest} />
            </li>
          ))}
          <li className="border-t pt-3">
            <StatRow
              label={TOTAL_ROW_LABEL}
              value={formatMoney(answer.paidAmount)}
              note={ordersLine(answer.paidCount)}
              muted={answer.paidAmount === 0}
            />
          </li>
        </ul>
      )}
    </StatsZone>
  );
}
