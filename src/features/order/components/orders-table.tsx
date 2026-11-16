import Link from "next/link";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Order } from "@/lib/api/types";
import { FOCUS_RING } from "@/lib/focus-ring";
import { formatDateTime, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { orderHref } from "../order-paths";
import { periodLine } from "../order-text";
import { OrderRowActions } from "./order-row-actions";
import { OrderStatusBadge } from "./order-status-badge";

/**
 * The table of the history from `md` up (spec 0022, AC-15). It runs edge to edge in its zone. Every
 * value is the order's own field, in the order the API gave: the front end sorts nothing and
 * computes no end of a period. The period shows for a paid order only.
 */
export function OrdersTable({
  rows,
  onCancel,
}: {
  rows: readonly Order[];
  onCancel?: (order: Order) => void;
}) {
  return (
    <Table>
      <TableCaption className="sr-only">
        Danh sách đơn mua gói của bạn
      </TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Mã đơn</TableHead>
          <TableHead>Gói</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead>Ngày tạo đơn</TableHead>
          <TableHead>Kỳ gói</TableHead>
          <TableHead>Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((order) => (
          <TableRow key={order.id}>
            <TableCell>
              <Link
                href={orderHref(order.id)}
                className={cn(
                  FOCUS_RING,
                  "rounded-sm font-medium tabular-nums hover:underline",
                )}
              >
                {order.code}
              </Link>
            </TableCell>
            <TableCell className="max-w-64">
              <span
                className="block truncate font-medium"
                title={order.planName}
              >
                {order.planName}
              </span>
              <span className="block text-sm text-muted-foreground tabular-nums">
                {formatMoney(order.price)} {periodLine(order.durationDays)}
              </span>
            </TableCell>
            <TableCell>
              <OrderStatusBadge status={order.status} />
            </TableCell>
            <TableCell>{formatDateTime(order.createdAt)}</TableCell>
            <TableCell className="tabular-nums">
              {order.status === "paid" && order.startsAt && order.endsAt
                ? `${formatDateTime(order.startsAt)} đến ${formatDateTime(order.endsAt)}`
                : null}
            </TableCell>
            <TableCell>
              <OrderRowActions order={order} size="sm" onCancel={onCancel} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
