import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Order } from "@/lib/api/types";
import { formatDateTime, formatMoney } from "@/lib/format";
import {
  CODE_LABEL,
  CREATED_LABEL,
  limitLine,
  periodLine,
  SUMMARY_TITLE,
} from "../order-text";

/**
 * The plan of an order, drawn on every status (spec 0022, AC-3). Every value is the order's own
 * field: the order keeps a fixed copy of the plan as it was when it was made, so nothing here is
 * read again from `GET /plans` and a plan that changed since does not change this page.
 */
export function OrderSummary({ order }: { order: Order }) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>
          <h2 className="text-base">{SUMMARY_TITLE}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="gap-5">
        <div className="flex flex-col gap-1">
          <h3 className="break-words">{order.planName}</h3>
          <p className="text-2xl font-semibold">
            {formatMoney(order.price)}{" "}
            <span className="text-base font-normal text-muted-foreground">
              {periodLine(order.durationDays)}
            </span>
          </p>
          <p className="text-base">{limitLine(order.maxListings)}</p>
        </div>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-1">
            <dt className="text-sm text-muted-foreground">{CODE_LABEL}</dt>
            <dd className="text-base font-medium break-all tabular-nums">
              {order.code}
            </dd>
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <dt className="text-sm text-muted-foreground">{CREATED_LABEL}</dt>
            <dd className="text-base font-medium">
              {formatDateTime(order.createdAt)}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
