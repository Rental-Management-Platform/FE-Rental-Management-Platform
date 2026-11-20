import {
  DetailItem,
  DetailList,
  RowDetail,
} from "@/components/detail/row-detail";
import type { AdminOrder, Order } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import {
  CODE_LABEL,
  CREATED_LABEL,
  DETAIL_CANCELLED_LABEL,
  DETAIL_LANDLORD_LABEL,
  DETAIL_LIMIT_LABEL,
  DETAIL_PAID_LABEL,
  DETAIL_PERIOD_LABEL,
  DETAIL_PLAN_LABEL,
  DETAIL_PRICE_LABEL,
  DETAIL_STATUS_LABEL,
  ORDER_DETAIL_TITLE,
  limitLine,
  periodSpan,
  priceLine,
} from "../order-text";
import { OrderStatusBadge } from "./order-status-badge";

/**
 * "Xem chi tiết" of one order of a history (spec 0022): everything the row leaves out. Every value
 * is the order's own field. The order keeps a fixed copy of the plan as it was when it was made, so
 * nothing is read again from `GET /plans`, and no end of a period is worked out: `startsAt` and
 * `endsAt` come from the API and show for a paid order only. An admin passes the landlord too.
 */
export function OrderDetail({
  order,
  landlord,
  size,
}: {
  order: Order;
  landlord?: AdminOrder["landlord"];
  size: "sm" | "lg";
}) {
  return (
    <RowDetail
      name={`đơn ${order.code}`}
      title={ORDER_DETAIL_TITLE}
      size={size}
    >
      <DetailList>
        <DetailItem label={CODE_LABEL}>{order.code}</DetailItem>
        {landlord !== undefined && (
          <DetailItem label={DETAIL_LANDLORD_LABEL}>
            {landlord.name?.trim() ? `${landlord.name.trim()}\n` : ""}
            {landlord.email}
          </DetailItem>
        )}
        <DetailItem label={DETAIL_PLAN_LABEL}>{order.planName}</DetailItem>
        <DetailItem label={DETAIL_PRICE_LABEL}>{priceLine(order)}</DetailItem>
        <DetailItem label={DETAIL_LIMIT_LABEL}>
          {limitLine(order.maxListings)}
        </DetailItem>
        <DetailItem label={DETAIL_STATUS_LABEL}>
          <OrderStatusBadge status={order.status} />
        </DetailItem>
        <DetailItem label={CREATED_LABEL}>
          {formatDateTime(order.createdAt)}
        </DetailItem>
        {order.paidAt !== null && (
          <DetailItem label={DETAIL_PAID_LABEL}>
            {formatDateTime(order.paidAt)}
          </DetailItem>
        )}
        {order.cancelledAt !== null && (
          <DetailItem label={DETAIL_CANCELLED_LABEL}>
            {formatDateTime(order.cancelledAt)}
          </DetailItem>
        )}
        {order.status === "paid" && order.startsAt && order.endsAt && (
          <DetailItem label={DETAIL_PERIOD_LABEL}>
            {periodSpan(order.startsAt, order.endsAt)}
          </DetailItem>
        )}
      </DetailList>
    </RowDetail>
  );
}
