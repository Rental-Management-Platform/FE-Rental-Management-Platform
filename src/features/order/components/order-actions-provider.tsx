"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  use,
  useCallback,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { canBuyPlans } from "@/features/pricing/access";
import type { Uuid } from "@/lib/api/types";
import { useSession } from "@/lib/session/auth-provider";
import { can } from "@/lib/session/can";
import { useCountdown } from "@/lib/use-countdown";
import { useReturnFocus } from "@/lib/use-return-focus";
import { orderKey } from "../api/order-keys";
import { useCancelOrder } from "../hooks/use-cancel-order";
import { usePayOrder } from "../hooks/use-pay-order";
import { classifyOrderError, type OrderFailure } from "../order-failure";
import { CancelOrderDialog } from "./cancel-order-dialog";

type Busy = "pay" | "cancel";

type OrderActions = {
  /** The ref of the page `h1`: a view switch and a closed dialog move focus there. */
  titleRef: RefObject<HTMLHeadingElement | null>;
  /** The permissions of the person, as a convenience: the backend decides every press. */
  mayPay: boolean;
  mayCancel: boolean;
  /** The backend refused the permission on a press: no button for the rest of this visit. */
  hidden: boolean;
  /** Both buttons are locked: a pay or a cancel is running or done, or a 429 wait is not over. */
  locked: boolean;
  /** Which button was pressed while a request runs or is done, else `null`. */
  busy: Busy | null;
  /** The failure of the last press, or `null`. A new press clears it. */
  failure: OrderFailure | null;
  pay: () => void;
  /** Opens the cancel dialog. Cancelling happens only after the person confirms there. */
  askCancel: () => void;
};

const OrderActionsContext = createContext<OrderActions | null>(null);

/**
 * The one place that pays or cancels the order of the page, shared by the payment zone and the
 * notice area (spec 0022, AC-7 to AC-11). Both buttons share one lock, so only one request runs at
 * a time, and one failure notice shows at a time. Nothing is sent again by itself: a press sends
 * one request, and a failure waits for the person.
 *
 * It also owns the cancel dialog, because it opens from two places (the zone and the plan gone
 * notice) and has no trigger of its own.
 */
export function OrderActionsProvider({
  id,
  children,
}: {
  id: Uuid;
  children: ReactNode;
}) {
  const session = useSession();
  const queryClient = useQueryClient();
  const payment = usePayOrder(id);
  const cancellation = useCancelOrder();

  const titleRef = useRef<HTMLHeadingElement>(null);
  // `isPending` turns true a moment after the press, so a second press in the same instant would
  // still get through. The ref closes that gap at once. It stays closed after a success (the view
  // is changing) and opens again after a failure.
  const sending = useRef(false);
  const [failure, setFailure] = useState<OrderFailure | null>(null);
  const [asking, setAsking] = useState(false);

  const focusTitle = useCallback(() => titleRef.current, []);
  const { remember, onCloseAutoFocus } = useReturnFocus(focusTitle);

  // The wait of a 429 counts down here too, so the buttons come back when it ends. The notice
  // counts for the eyes on its own.
  const waitLeft = useCountdown(
    failure?.kind === "rate-limited" ? failure.error : null,
  );
  const busy: Busy | null =
    payment.isPending || payment.isSuccess
      ? "pay"
      : cancellation.isPending || cancellation.isSuccess
        ? "cancel"
        : null;
  const locked = busy !== null || waitLeft > 0;

  const run = (kind: Busy) => {
    if (sending.current || locked) return;
    sending.current = true;
    setFailure(null);
    const callbacks = {
      onError: (error: unknown) => {
        sending.current = false;
        const next = classifyOrderError(error);
        setFailure(next);
        // Paid or cancelled in another tab: read the order again, so the view shows its real
        // status and never disagrees with the backend.
        if (next.kind === "conflict") {
          void queryClient.invalidateQueries({ queryKey: orderKey(id) });
        }
      },
    };
    if (kind === "pay") payment.mutate(undefined, callbacks);
    else cancellation.mutate(id, callbacks);
  };

  const askCancel = () => {
    if (sending.current || locked) return;
    remember();
    setAsking(true);
  };

  return (
    <OrderActionsContext
      value={{
        titleRef,
        mayPay: canBuyPlans(session),
        mayCancel: can(session, "order:cancel"),
        hidden: failure?.kind === "denied",
        locked,
        busy,
        failure,
        pay: () => run("pay"),
        askCancel,
      }}
    >
      {children}
      <CancelOrderDialog
        open={asking}
        onOpenChange={setAsking}
        onConfirm={() => run("cancel")}
        onCloseAutoFocus={onCloseAutoFocus}
      />
    </OrderActionsContext>
  );
}

export function useOrderActions(): OrderActions {
  const actions = use(OrderActionsContext);
  if (actions === null) {
    throw new Error("useOrderActions needs an <OrderActionsProvider>");
  }
  return actions;
}
