"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { isAbortError } from "@/lib/api/abort";
import type { AdminPlan } from "@/lib/api/types";
import { deletedToast, GONE_TOAST, turnedOffToast } from "../admin-plans-text";
import { classifyPlanError, type PlanFailure } from "../plan-failure";
import { usePlanMutations } from "./use-plan-mutations";

/**
 * The delete dialog of the plans page (scope #22): which plan it asks about, whether it is open,
 * what a failed delete says, and the two things the confirm button does.
 *
 * The dialog stays open while the request runs and closes only when the answer has come. A plan
 * that is already gone closes it too (another admin deleted it first). `PLAN_IN_USE` keeps it open
 * and turns it into the way to turn the plan off instead, which is what `turnOff` sends. One ref
 * guards both, because state lags a render behind a fast second press.
 */
export function useDeletePlanFlow() {
  const { remove, update } = usePlanMutations();
  const [target, setTarget] = useState<AdminPlan | null>(null);
  const [open, setOpen] = useState(false);
  const [failure, setFailure] = useState<PlanFailure | null>(null);
  const [pending, setPending] = useState<"delete" | "turn-off" | null>(null);
  const inFlight = useRef(false);

  const ask = (plan: AdminPlan) => {
    setTarget(plan);
    setFailure(null);
    setOpen(true);
  };

  // Escape and a click outside must not close it while a request runs.
  const onOpenChange = (next: boolean) => {
    if (pending !== null && !next) return;
    setOpen(next);
  };

  const run = async (
    kind: "delete" | "turn-off",
    send: (plan: AdminPlan) => Promise<unknown>,
    doneToast: (plan: AdminPlan) => string,
  ) => {
    if (target === null || inFlight.current) return;
    inFlight.current = true;
    setPending(kind);
    setFailure(null);
    try {
      await send(target);
      toast.success(doneToast(target));
      setOpen(false);
    } catch (error) {
      // The session changed under the request (a sign out in this tab): nothing to show.
      if (isAbortError(error)) return;
      const next = classifyPlanError(error);
      if (next.kind === "gone") {
        toast(GONE_TOAST);
        setOpen(false);
      } else {
        setFailure(next);
      }
    } finally {
      inFlight.current = false;
      setPending(null);
    }
  };

  return {
    target,
    open,
    failure,
    pending,
    ask,
    onOpenChange,
    confirm: () =>
      run(
        "delete",
        (plan) => remove.mutateAsync(plan.id),
        (plan) => deletedToast(plan.name),
      ),
    turnOff: () =>
      run(
        "turn-off",
        (plan) =>
          update.mutateAsync({ id: plan.id, patch: { isActive: false } }),
        (plan) => turnedOffToast(plan.name),
      ),
  };
}
