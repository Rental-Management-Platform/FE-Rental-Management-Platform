import { OrderDetail } from "@/features/order/components/order-detail";
import { OrderStatusBadge } from "@/features/order/components/order-status-badge";
import { priceLine } from "@/features/order/order-text";
import type { AdminOrder } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import { LandlordCell } from "./landlord-cell";

/**
 * The list below `md` (scope #25): each order is a block that stacks. The blocks sit inside the
 * zone and are told apart by a hairline, never by a card of their own, because a card never sits
 * inside another card. It shows the same values as the table, and "Xem chi tiết" holds the rest.
 */
export function AdminOrderCards({
  rows,
  landlordHref,
}: {
  rows: readonly AdminOrder[];
  /** The address of the list filtered to one landlord. */
  landlordHref: (landlordId: string) => string;
}) {
  return (
    <ul className="flex flex-col">
      {rows.map((order) => (
        <li
          key={order.id}
          className="flex flex-col gap-3 border-t px-(--card-spacing) py-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium tabular-nums">{order.code}</span>
            <OrderStatusBadge status={order.status} />
          </div>
          <LandlordCell
            landlord={order.landlord}
            href={landlordHref(order.landlord.id)}
          />
          <div className="flex min-w-0 flex-col gap-1">
            <span className="line-clamp-2 font-medium">{order.planName}</span>
            <span className="text-sm text-muted-foreground tabular-nums">
              {priceLine(order)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Tạo ngày {formatDateTime(order.createdAt)}
          </p>
          <div>
            <OrderDetail order={order} landlord={order.landlord} size="lg" />
          </div>
        </li>
      ))}
    </ul>
  );
}
