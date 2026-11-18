"use client";

import { CircleAlertIcon } from "lucide-react";
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
import { useCountdown } from "@/lib/use-countdown";
import {
  REVOKE_CONFIRM,
  REVOKE_DESCRIPTION,
  REVOKE_KEEP,
  REVOKING,
} from "../admin-users-text";
import type { RevokeFailure } from "../user-failure";

/**
 * "Thu hồi mọi phiên của …?" (scope #20, spec 0023, AC-10). An `AlertDialog`: the first focus
 * lands on the safe button, "Hủy". The confirm button never closes the dialog by itself, the page
 * closes it when the answer has come. `title` is the words of the row being asked about and stays
 * set while the dialog closes. A failure is shown here and the dialog stays; a 429 keeps the
 * confirm button off while it counts down.
 */
export function RevokeDialog({
  title,
  open,
  onOpenChange,
  pending,
  failure,
  onConfirm,
  onCloseAutoFocus,
}: {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
  failure: RevokeFailure | null;
  onConfirm: () => void;
  /** From `useReturnFocus`: the dialog has no trigger of its own, it opens from a row. */
  onCloseAutoFocus: (event: Event) => void;
}) {
  const waiting =
    useCountdown(failure?.kind === "rate-limited" ? failure.error : null) > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent onCloseAutoFocus={onCloseAutoFocus}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{REVOKE_DESCRIPTION}</AlertDialogDescription>
        </AlertDialogHeader>
        {failure?.kind === "rate-limited" && (
          <RateLimitNotice error={failure.error} />
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
          <AlertDialogCancel size="lg" disabled={pending}>
            {REVOKE_KEEP}
          </AlertDialogCancel>
          <AlertDialogAction
            size="lg"
            disabled={pending || waiting}
            onClick={(event) => {
              // The default of the action is to close; the page does that after the answer.
              event.preventDefault();
              onConfirm();
            }}
          >
            {pending && <Spinner size="sm" aria-hidden="true" />}
            {pending ? REVOKING : REVOKE_CONFIRM}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
