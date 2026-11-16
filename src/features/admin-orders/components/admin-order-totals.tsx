import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminOrderPage } from "@/lib/api/types";
import { formatCount, formatMoney } from "@/lib/format";
import {
  PAID_AMOUNT_LABEL,
  PAID_COUNT_LABEL,
  TEST_PAYMENT_BADGE,
  TOTALS_LOADING,
  TOTALS_NOTE,
  TOTALS_TITLE,
} from "../admin-orders-text";

const TITLE_ID = "admin-orders-totals-title";

/**
 * The two totals of the whole filtered set (api-for-frontend.md, 6.37): the count of paid orders
 * and the money they paid. They are `summary` of the answer as it came, never added up from the
 * rows, because the rows are one page. The money is a test payment, so the zone wears that label
 * and says it again in its note. With no `summary` yet it draws the shape of the two facts.
 */
export function AdminOrderTotals({
  summary,
}: {
  summary: AdminOrderPage["summary"] | undefined;
}) {
  return (
    <Card role="group" aria-labelledby={TITLE_ID}>
      <CardHeader className="border-b">
        <CardTitle>
          <h2 id={TITLE_ID} className="text-base">
            {TOTALS_TITLE}
          </h2>
        </CardTitle>
        <CardAction>
          <Badge variant="info">{TEST_PAYMENT_BADGE}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {summary === undefined ? (
          <div role="status" aria-busy="true">
            <span className="sr-only">{TOTALS_LOADING}</span>
            <div className="grid gap-4 sm:grid-cols-2">
              {[0, 1].map((i) => (
                <div key={i} className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-7 w-24" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <dl className="grid gap-4 sm:grid-cols-2">
            <Fact
              label={PAID_COUNT_LABEL}
              value={formatCount(summary.paidCount)}
            />
            <Fact
              label={PAID_AMOUNT_LABEL}
              value={formatMoney(summary.paidAmount)}
            />
          </dl>
        )}
        <p className="text-sm text-muted-foreground">{TOTALS_NOTE}</p>
      </CardContent>
    </Card>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-xl font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
