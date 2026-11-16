"use client";

import { TriangleAlertIcon } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { orderHref } from "@/features/order/order-paths";
import { usePendingOrder } from "../hooks/use-pending-order";
import { CONTINUE_PAYMENT, pendingOrderMessage } from "../text";

/**
 * The reminder above the cards when the landlord has an unpaid order (spec 0021, AC-7): a new
 * order cancels it, so this is said before the press and not after. It is a quiet `warning`, with
 * a way on ("Tiếp tục thanh toán") that opens the order itself. It draws nothing when there is no
 * unpaid order or the read failed.
 */
export function PendingOrderNotice() {
  const order = usePendingOrder();
  if (order === null) return null;

  return (
    <Alert variant="warning">
      <TriangleAlertIcon aria-hidden="true" />
      <AlertDescription>
        <p>{pendingOrderMessage(order)}</p>
      </AlertDescription>
      <div className="col-start-2 mt-2 flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href={orderHref(order.id)}>{CONTINUE_PAYMENT}</Link>
        </Button>
      </div>
    </Alert>
  );
}
