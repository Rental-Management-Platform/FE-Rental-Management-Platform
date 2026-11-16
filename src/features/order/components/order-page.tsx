"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { BreadcrumbTrail } from "@/components/layout/breadcrumb-trail";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorState } from "@/components/states/error-state";
import { ForbiddenState } from "@/components/states/forbidden-state";
import { NotFoundState } from "@/components/states/not-found-state";
import { Card } from "@/components/ui/card";
import type { Order } from "@/lib/api/types";
import { useOrder } from "../hooks/use-order";
import { orderBlock } from "../order-block";
import { ORDERS_PATH } from "../order-paths";
import {
  BACK_TO_ORDERS,
  ORDER_DESCRIPTION,
  ORDER_FORBIDDEN_MESSAGE,
  ORDER_HEADING,
  ORDER_LOAD_FAILED_TITLE,
  ORDER_NOT_FOUND_TITLE,
  ORDER_PAGE_TITLE,
  ORDERS_CRUMB,
} from "../order-text";
import { CancelledResult, PaidResult } from "./order-results";
import { OrderSkeleton } from "./order-skeleton";
import { OrderStatusBadge } from "./order-status-badge";
import { OrderSummary } from "./order-summary";
import { PaymentZone } from "./payment-zone";

// The one view of an order, by its status (spec 0022): confirmation, paid result or cancelled
// result. A pending order shows its plan and then the payment; a finished one shows the result
// first, because that is the news, and the plan under it.
function OrderView({ order }: { order: Order }) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      {order.status === "pending" && (
        <>
          <OrderSummary order={order} />
          <PaymentZone order={order} />
        </>
      )}
      {order.status === "paid" && (
        <>
          <PaidResult order={order} />
          <OrderSummary order={order} />
        </>
      )}
      {order.status === "cancelled" && (
        <>
          <CancelledResult order={order} />
          <OrderSummary order={order} />
        </>
      )}
    </div>
  );
}

/**
 * The order page, `/landlord/orders/[id]` (scope #19, spec 0022). It runs in the browser behind
 * the route gate, because an order needs a login, and reads the id with `useParams`, so its route
 * keeps it inside a `<Suspense>` boundary.
 *
 * The page shows the order whenever there is data: an order stored by a press on "Mua" shows at
 * once and is read again behind it, and a later failed read never replaces what is on screen.
 * Someone else's order and an id that does not exist give the same not found state. When the
 * status changes (a payment here, or a payment made in another tab that a focus read brings in),
 * the view changes and focus moves to the new `h1`, because the control that had it is gone.
 */
export function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const { query, allowed, validId } = useOrder(id);
  const order = query.data;
  const status = order?.status;

  const titleRef = useRef<HTMLHeadingElement>(null);
  // The status of the last render, to tell a change of view from the first one. A status that
  // arrives after the loading state is not a change: nothing had focus yet.
  const shownStatus = useRef(status);
  useEffect(() => {
    if (
      shownStatus.current !== undefined &&
      status !== undefined &&
      status !== shownStatus.current
    ) {
      titleRef.current?.focus();
    }
    shownStatus.current = status;
  }, [status]);

  if (!allowed) return <ForbiddenState message={ORDER_FORBIDDEN_MESSAGE} />;

  const block =
    order === undefined && query.isError ? orderBlock(query.error) : null;
  if (!validId || block === "not-found") {
    return (
      <NotFoundState
        title={ORDER_NOT_FOUND_TITLE}
        backHref={ORDERS_PATH}
        backLabel={BACK_TO_ORDERS}
      />
    );
  }
  if (block === "forbidden") {
    return <ForbiddenState message={ORDER_FORBIDDEN_MESSAGE} />;
  }

  const renderBody = () => {
    if (order !== undefined) return <OrderView order={order} />;
    if (query.isError) {
      return (
        <Card>
          <ErrorState
            error={query.error}
            title={ORDER_LOAD_FAILED_TITLE}
            onRetry={() => void query.refetch()}
          />
        </Card>
      );
    }
    return <OrderSkeleton />;
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titleRef={titleRef}
        breadcrumb={
          <BreadcrumbTrail
            parent={{ label: ORDERS_CRUMB, href: ORDERS_PATH }}
            current={ORDER_PAGE_TITLE}
          />
        }
        title={order ? ORDER_HEADING[order.status] : ORDER_PAGE_TITLE}
        description={order ? ORDER_DESCRIPTION[order.status] : undefined}
        actions={order && <OrderStatusBadge status={order.status} />}
      />
      {renderBody()}
    </div>
  );
}
