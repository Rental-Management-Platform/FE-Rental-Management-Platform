import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderStatusBadge } from "@/features/order/components/order-status-badge";
import { priceLine } from "@/features/order/order-text";
import type { AdminOrder } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import {
  COLUMN_CODE,
  COLUMN_CREATED,
  COLUMN_LANDLORD,
  COLUMN_PERIOD,
  COLUMN_PLAN,
  COLUMN_STATUS,
  TABLE_CAPTION,
} from "../admin-orders-text";
import { LandlordCell } from "./landlord-cell";

/**
 * The table of every landlord's orders from `md` up (scope #25). It runs edge to edge in its zone.
 * Every value is the order's own field, in the order the API gave: the front end sorts nothing and
 * computes no end of a period. The period shows for a paid order only. An admin has no page for an
 * order of another landlord (the API answers 403 to it), so the code is text and there are no row
 * buttons: the list is read only.
 */
export function AdminOrdersTable({
  rows,
  landlordHref,
}: {
  rows: readonly AdminOrder[];
  /** The address of the list filtered to one landlord. */
  landlordHref: (landlordId: string) => string;
}) {
  return (
    <Table>
      <TableCaption className="sr-only">{TABLE_CAPTION}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>{COLUMN_CODE}</TableHead>
          <TableHead>{COLUMN_LANDLORD}</TableHead>
          <TableHead>{COLUMN_PLAN}</TableHead>
          <TableHead>{COLUMN_STATUS}</TableHead>
          <TableHead>{COLUMN_CREATED}</TableHead>
          <TableHead>{COLUMN_PERIOD}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((order) => (
          <TableRow key={order.id}>
            <TableCell className="font-medium tabular-nums">
              {order.code}
            </TableCell>
            <TableCell className="max-w-64">
              <LandlordCell
                landlord={order.landlord}
                href={landlordHref(order.landlord.id)}
              />
            </TableCell>
            <TableCell className="max-w-56">
              <span
                className="block truncate font-medium"
                title={order.planName}
              >
                {order.planName}
              </span>
              <span className="block text-sm text-muted-foreground tabular-nums">
                {priceLine(order)}
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
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
