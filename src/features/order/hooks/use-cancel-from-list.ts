"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import type { Order } from "@/lib/api/types";
import { useCountdown } from "@/lib/use-countdown";
import { ordersKey } from "../api/order-keys";
import { classifyOrderError, type OrderFailure } from "../order-failure";
import { useCancelOrder } from "./use-cancel-order";

/**
 * The one cancel dialog of the history (spec 0022, AC-16). A single dialog serves every pending
 * row, so it is driven by state and has no trigger: the page remembers the opener with
 * `useReturnFocus`.
 *
 * It waits for the server and never changes the row first. A 200 closes the dialog, and the orders
 * are marked out of date, so the row shows "Đã hủy", or leaves the list under the "Chờ thanh toán"
 * tab. Any failure stays inside the dialog and the dialog stays open, except a 401, which belongs
 * to the session layer. A conflict or an order that is gone also reads the list again behind the
 * dialog, so the rows never disagree with the backend. Nothing is sent again by itself.
 */
export function useCancelFromList() {
  const queryClient = useQueryClient();
  const cancellation = useCancelOrder();
  const [target, setTarget] = useState<Order | null>(null);
  const [open, setOpen] = useState(false);
  const [failure, setFailure] = useState<OrderFailure | null>(null);
  // State is a render behind a fast double click, so a ref guards the request itself.
  const sending = useRef(false);
  // Set by a 200, read once when the dialog has closed: focus then goes to the list heading, not
  // back to a button that is about to leave.
  const cancelled = useRef(false);

  // The wait of a 429 counts down here too, so the confirm button comes back when it ends.
  const waitLeft = useCountdown(
    failure?.kind === "rate-limited" ? failure.error : null,
  );
  const pending = cancellation.isPending;

  const ask = (order: Order) => {
    setTarget(order);
    setFailure(null);
    setOpen(true);
  };

  // Escape and the backdrop must not close it while the request runs.
  const onOpenChange = (next: boolean) => {
    if (pending && !next) return;
    setOpen(next);
  };

  const confirm = () => {
    if (target === null || sending.current || waitLeft > 0) return;
    sending.current = true;
    setFailure(null);
    cancellation.mutate(target.id, {
      onSuccess: () => {
        sending.current = false;
        cancelled.current = true;
        setOpen(false);
      },
      onError: (error) => {
        sending.current = false;
        const next = classifyOrderError(error);
        if (next.kind === "session") {
          setOpen(false);
          return;
        }
        setFailure(next);
        if (next.kind === "conflict" || next.kind === "not-found") {
          void queryClient.invalidateQueries({ queryKey: ordersKey });
        }
      },
    });
  };

  return {
    target,
    open,
    pending,
    failure,
    /** The backend refused the permission: no "Hủy" button for the rest of this visit. */
    hidden: failure?.kind === "denied",
    /** The confirm button waits: a 429 wait is not over, or the permission was refused. */
    confirmLocked: waitLeft > 0 || failure?.kind === "denied",
    ask,
    onOpenChange,
    confirm,
    /** True once after a successful cancel, so the page can send focus to the list heading. */
    takeCancelled: () => {
      const was = cancelled.current;
      cancelled.current = false;
      return was;
    },
  };
}
