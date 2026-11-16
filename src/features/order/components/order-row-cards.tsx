import Link from "next/link";
import type { Order } from "@/lib/api/types";
import { FOCUS_RING } from "@/lib/focus-ring";
import { formatDateTime, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { orderHref } from "../order-paths";
import { periodLine } from "../order-text";
import { OrderRowActions } from "./order-row-actions";
import { OrderStatusBadge } from "./order-status-badge";

/**
 * The history below `md` (spec 0022, AC-15): each order is a block that stacks, with 44 px
 * buttons. The blocks sit inside the zone and are told apart by a hairline, never by a card of
 * their own, because a card never sits inside another card. It shows the same values as the table.
 */
export function OrderRowCards({
  rows,
  onCancel,
}: {
  rows: readonly Order[];
  onCancel?: (order: Order) => void;
}) {
  return (
    <ul className="flex flex-col">
      {rows.map((order) => (
        <li
          key={order.id}
          className="flex flex-col gap-3 border-t px-(--card-spacing) py-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link
              href={orderHref(order.id)}
              className={cn(
                FOCUS_RING,
                "rounded-sm font-medium tabular-nums hover:underline",
              )}
            >
              {order.code}
            </Link>
            <OrderStatusBadge status={order.status} />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <span className="line-clamp-2 font-medium">{order.planName}</span>
            <span className="text-sm text-muted-foreground tabular-nums">
              {formatMoney(order.price)} {periodLine(order.durationDays)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Tạo ngày {formatDateTime(order.createdAt)}
            {order.status === "paid" && order.startsAt && order.endsAt
              ? ` · Kỳ gói ${formatDateTime(order.startsAt)} đến ${formatDateTime(order.endsAt)}`
              : null}
          </p>
          <OrderRowActions order={order} size="lg" onCancel={onCancel} />
        </li>
      ))}
    </ul>
  );
}
