"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  use,
  useMemo,
  useRef,
  useTransition,
  type ReactNode,
} from "react";
import type { Uuid } from "@/lib/api/types";
import { useCountdown } from "@/lib/use-countdown";
import { classifyBuyError, type BuyFailure } from "../buy-failure";
import { useBuyPlan } from "../hooks/use-buy-plan";

type Buy = {
  /** Every "Mua" button is disabled: a create is running or done, or a 429 wait is not over. */
  locked: boolean;
  /** The plan whose "Mua" was pressed while a create runs or is done, else `null`. */
  busyPlanId: Uuid | null;
  /** The failure of the last press, or `null`. A new press clears it. */
  failure: BuyFailure | null;
  /** The backend refused the permission: no "Mua" button for the rest of this visit. */
  hidden: boolean;
  buy: (planId: Uuid) => void;
};

const BuyContext = createContext<Buy | null>(null);

/**
 * The one place that creates an order, shared by every card (spec 0021, AC-5 and AC-8 to AC-11).
 * The cards are drawn on the server and each holds a small client control, so the lock that stops
 * a second press, and the failure the notice area shows, have to live above them. Nothing is sent
 * again by itself: a press sends one request, and a failure waits for the person.
 */
export function BuyProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const mutation = useBuyPlan();
  // `isPending` turns true a moment after the press, so a second press in the same instant would
  // still get through. The ref closes that gap at once. It stays closed after a success (the
  // next page is opening) and opens again after a failure.
  const sending = useRef(false);

  // The mutation clears its error when the next press starts, so "a new press clears the old
  // failure" needs no state of its own. The object is stable for one failure, so whoever reacts
  // to a new failure (the notice area moves focus) runs once for it and not on every render.
  const failure = useMemo(
    () => (mutation.isError ? classifyBuyError(mutation.error) : null),
    [mutation.isError, mutation.error],
  );
  // The wait of a 429 counts down here too, so the buttons come back when it ends. The notice
  // counts for the eyes on its own.
  const waitLeft = useCountdown(
    failure?.kind === "rate-limited" ? failure.error : null,
  );

  const creating = mutation.isPending || mutation.isSuccess;
  const locked = creating || waitLeft > 0;

  const buy = (planId: Uuid) => {
    if (sending.current || locked) return;
    sending.current = true;
    mutation.mutate(planId, {
      onError: (error) => {
        sending.current = false;
        // The plan left the list since the page loaded: read the plans again so its card goes.
        // Nothing is sent again, and the older unpaid order is untouched.
        if (classifyBuyError(error).kind === "plan-gone") {
          startTransition(() => router.refresh());
        }
      },
    });
  };

  return (
    <BuyContext
      value={{
        locked,
        busyPlanId: creating ? (mutation.variables ?? null) : null,
        failure,
        hidden: failure?.kind === "denied",
        buy,
      }}
    >
      {children}
    </BuyContext>
  );
}

export function useBuy(): Buy {
  const buy = use(BuyContext);
  if (buy === null) throw new Error("useBuy needs a <BuyProvider>");
  return buy;
}
