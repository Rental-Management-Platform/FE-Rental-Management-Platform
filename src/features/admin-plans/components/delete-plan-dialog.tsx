"use client";

import { CircleAlertIcon, TriangleAlertIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { RateLimitNotice } from "@/components/states/rate-limit-notice";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";
import type { AdminPlan } from "@/lib/api/types";
import { useCountdown } from "@/lib/use-countdown";
import {
  CLOSE,
  DELETE_CONFIRM,
  DELETE_DESCRIPTION,
  DELETING,
  deleteTitle,
  IN_USE_ALREADY_OFF,
  IN_USE_ON_SALE,
  IN_USE_TITLE,
  KEEP_PLAN,
  TURN_OFF,
  TURNING_OFF,
} from "../admin-plans-text";
import type { PlanFailure } from "../plan-failure";

interface DeletePlanDialogProps {
  /** The plan being asked about. It keeps showing while the dialog closes. */
  plan: AdminPlan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** What the request in flight is, so the right button shows its spinner. */
  pending: "delete" | "turn-off" | null;
  failure: PlanFailure | null;
  /** The person may turn the plan off (`plan:update`). */
  canTurnOff: boolean;
  onConfirm: () => void;
  onTurnOff: () => void;
  /** From `useReturnFocus`: the dialog has no trigger of its own, it opens from a row. */
  onCloseAutoFocus: (event: Event) => void;
}

/**
 * "Xóa gói “…”?" (scope #22). An `AlertDialog`, because a delete cannot be undone: the first focus
 * lands on the safe button. The confirm button never closes the dialog by itself: the page closes
 * it when the answer has come.
 *
 * `PLAN_IN_USE` is not an error to retry: a plan that any order names can never be deleted. The
 * dialog says so and offers the way out the contract recommends, turning the plan off, which it
 * does with its own button. A plan that is already off gets the sentence and only "Đóng". Any
 * other failure is shown here and the dialog stays; a 429 locks the buttons while it counts down.
 */
export function DeletePlanDialog({
  plan,
  open,
  onOpenChange,
  pending,
  failure,
  canTurnOff,
  onConfirm,
  onTurnOff,
  onCloseAutoFocus,
}: DeletePlanDialogProps) {
  const waiting =
    useCountdown(failure?.kind === "rate-limited" ? failure.error : null) > 0;
  const inUse = failure?.kind === "in-use";

  // The press on "Xóa gói" turns the dialog into the in-use answer and that button leaves, so focus
  // would drop to the frame of the dialog. It goes to the safe button instead.
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (inUse) closeButton.current?.focus();
  }, [inUse]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent onCloseAutoFocus={onCloseAutoFocus}>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {plan === null ? "" : deleteTitle(plan.name)}
          </AlertDialogTitle>
          <AlertDialogDescription>{DELETE_DESCRIPTION}</AlertDialogDescription>
        </AlertDialogHeader>
        {failure?.kind === "rate-limited" && (
          <RateLimitNotice error={failure.error} />
        )}
        {failure?.kind === "in-use" && (
          <Alert variant="warning">
            <TriangleAlertIcon aria-hidden="true" />
            <AlertTitle>{IN_USE_TITLE}</AlertTitle>
            <AlertDescription>
              {plan?.isActive ? IN_USE_ON_SALE : IN_USE_ALREADY_OFF}
            </AlertDescription>
          </Alert>
        )}
        {failure?.kind === "message" && (
          <Alert variant="destructive">
            <CircleAlertIcon aria-hidden="true" />
            <AlertTitle>{failure.message}</AlertTitle>
            {failure.requestId && (
              <AlertDescription>
                Mã hỗ trợ: {failure.requestId}
              </AlertDescription>
            )}
          </Alert>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel
            ref={closeButton}
            size="lg"
            disabled={pending !== null}
          >
            {inUse ? CLOSE : KEEP_PLAN}
          </AlertDialogCancel>
          {inUse ? (
            plan?.isActive &&
            canTurnOff && (
              <AlertDialogAction
                size="lg"
                disabled={pending !== null || waiting}
                onClick={(event) => {
                  // The default of the action is to close; the page does that after the answer.
                  event.preventDefault();
                  onTurnOff();
                }}
              >
                {pending === "turn-off" && (
                  <Spinner size="sm" aria-hidden="true" />
                )}
                {pending === "turn-off" ? TURNING_OFF : TURN_OFF}
              </AlertDialogAction>
            )
          ) : (
            <AlertDialogAction
              variant="destructive"
              size="lg"
              disabled={pending !== null || waiting}
              onClick={(event) => {
                // The default of the action is to close; the page does that after the answer.
                event.preventDefault();
                onConfirm();
              }}
            >
              {pending === "delete" && <Spinner size="sm" aria-hidden="true" />}
              {pending === "delete" ? DELETING : DELETE_CONFIRM}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
