import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Order } from "@/lib/api/types";
import { orderHref } from "../order-paths";
import {
  CANCEL_ROW,
  CONTINUE_PAYMENT,
  cancelRowLabel,
  continueRowLabel,
} from "../order-text";

/**
 * What a row of the history offers (spec 0022, AC-15 and AC-16). Only a pending order has actions.
 * "Tiếp tục thanh toán" is a link to the order page, because payment happens only there, next to
 * the plan and the note that it is a test payment. "Hủy" opens the one shared cancel dialog; it is
 * left out when `onCancel` is not given (no `order:cancel`, or the backend refused it). Buttons are
 * 32 px high in the table (`sm`) and 44 px in the stacked blocks (`lg`). Each button names its
 * order for a screen reader, because the same two words repeat in every row.
 */
export function OrderRowActions({
  order,
  size,
  onCancel,
}: {
  order: Order;
  size: "sm" | "lg";
  onCancel?: (order: Order) => void;
}) {
  if (order.status !== "pending") return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button asChild size={size}>
        <Link
          href={orderHref(order.id)}
          aria-label={continueRowLabel(order.code)}
        >
          {CONTINUE_PAYMENT}
        </Link>
      </Button>
      {onCancel && (
        <Button
          type="button"
          variant="outline"
          size={size}
          aria-label={cancelRowLabel(order.code)}
          onClick={() => onCancel(order)}
        >
          {CANCEL_ROW}
        </Button>
      )}
    </div>
  );
}
