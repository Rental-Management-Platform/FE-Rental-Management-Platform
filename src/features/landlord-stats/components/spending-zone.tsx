import Link from "next/link";
import { describeChange } from "@/components/stats/describe-change";
import { StatRow } from "@/components/stats/stat-row";
import { StatsZone } from "@/components/stats/stats-zone";
import { Button } from "@/components/ui/button";
import { ORDERS_PATH } from "@/features/order/order-paths";
import type { Statistics } from "@/lib/api/types";
import { formatCount, formatMoney } from "@/lib/format";
import {
  ORDER_HISTORY_LABEL,
  PAID_ORDERS_LABEL,
  SPENDING_ZONE_TITLE,
  SPENT_LABEL,
  totalLine,
} from "../landlord-stats-text";

/**
 * The zone "Chi tiêu (thanh toán thử)" (spec 0024, AC-14). The words "thanh toán thử" are in the
 * heading, so every money figure sits under them. Spending more is neither good nor bad, so the
 * changes keep their arrow and sign in the muted colour. The total since the start has no arrow.
 */
export function SpendingZone({ statistics }: { statistics: Statistics }) {
  const { spending } = statistics;
  return (
    <StatsZone title={SPENDING_ZONE_TITLE}>
      <div className="flex flex-col gap-4">
        <StatRow
          label={SPENT_LABEL}
          value={formatMoney(spending.spent.value)}
          change={describeChange(spending.spent, { neutral: true })}
        />
        <StatRow
          label={PAID_ORDERS_LABEL}
          value={formatCount(spending.paidOrders.value)}
          change={describeChange(spending.paidOrders, { neutral: true })}
        />
        <p className="text-sm text-muted-foreground">
          {totalLine(formatMoney(spending.spentAllTime))}
        </p>
      </div>
      <div>
        <Button asChild variant="outline" className="max-md:h-11">
          <Link href={ORDERS_PATH}>{ORDER_HISTORY_LABEL}</Link>
        </Button>
      </div>
    </StatsZone>
  );
}
