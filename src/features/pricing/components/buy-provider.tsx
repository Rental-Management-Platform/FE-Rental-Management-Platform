"use client";

import { createContext, use, useRef, type ReactNode } from "react";
import type { Uuid } from "@/lib/api/types";
import { useBuyPlan } from "../hooks/use-buy-plan";

type Buy = {
  /** A create is running, or it succeeded and the next page has not opened yet. */
  locked: boolean;
  /** The plan whose "Mua" was pressed while `locked`, else `null`. */
  busyPlanId: Uuid | null;
  buy: (planId: Uuid) => void;
};

const BuyContext = createContext<Buy | null>(null);

/**
 * The one place that creates an order, shared by every card (spec 0021, AC-5). The cards are
 * drawn on the server and each holds a small client control, so the lock that stops a second press
 * has to live above them. Nothing is sent again by itself: a press sends one request.
 */
export function BuyProvider({ children }: { children: ReactNode }) {
  const mutation = useBuyPlan();
  // `isPending` turns true a moment after the press, so a second press in the same instant would
  // still get through. The ref closes that gap at once. It stays closed after a success (the
  // next page is opening) and opens again after a failure.
  const sending = useRef(false);

  const locked = mutation.isPending || mutation.isSuccess;

  const buy = (planId: Uuid) => {
    if (sending.current || locked) return;
    sending.current = true;
    mutation.mutate(planId, {
      onError: () => {
        sending.current = false;
      },
    });
  };

  return (
    <BuyContext
      value={{
        locked,
        busyPlanId: locked ? (mutation.variables ?? null) : null,
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
