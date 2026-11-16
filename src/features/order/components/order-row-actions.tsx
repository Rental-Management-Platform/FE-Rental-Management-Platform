import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Order } from "@/lib/api/types";
import { orderHref } from "../order-paths";
import { CONTINUE_PAYMENT } from "../order-text";

/**
 * What a row of the history offers (spec 0022, AC-15). Only a pending order has actions:
 * "Tiếp tục thanh toán" is a link to the order page, because payment happens only there, next to
 * the plan and the note that it is a test payment. Buttons are 32 px high in the table (`sm`) and
 * 44 px in the stacked blocks (`lg`).
 */
export function OrderRowActions({
  order,
  size,
}: {
  order: Order;
  size: "sm" | "lg";
}) {
  if (order.status !== "pending") return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button asChild size={size}>
        <Link href={orderHref(order.id)}>{CONTINUE_PAYMENT}</Link>
      </Button>
    </div>
  );
}
