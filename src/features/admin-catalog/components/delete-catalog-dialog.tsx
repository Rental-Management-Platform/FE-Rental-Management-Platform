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
import { useCountdown } from "@/lib/use-countdown";
import {
  CLOSE,
  DELETE_CONFIRM,
  DELETING,
  IN_USE_HINT,
  IN_USE_TITLE,
  KEEP,
} from "../admin-catalog-text";
import type { CatalogFailure } from "../catalog-failure";

/**
 * "Xóa “…”?" for a ward or an amenity (scope #23). An `AlertDialog`, because a delete cannot be
 * undone: the first focus lands on the safe button. The confirm button never closes the dialog by
 * itself: the page closes it when the answer has come. `title` and `description` are the words of
 * the row being asked about and stay set while the dialog closes.
 *
 * `CATALOG_IN_USE` is not an error to retry: an entry that any property names, a deleted property
 * too, can never be deleted. The dialog says so and gives the way out, renaming, and keeps only
 * "Đóng". Any other failure is shown here and the dialog stays; a 429 locks the button while it
 * counts down.
 */
export function DeleteCatalogDialog({
  title,
  description,
  open,
  onOpenChange,
  pending,
  failure,
  onConfirm,
  onCloseAutoFocus,
}: {
  title: string;
  description: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
  failure: CatalogFailure | null;
  onConfirm: () => void;
  /** From `useReturnFocus`: the dialog has no trigger of its own, it opens from a row. */
  onCloseAutoFocus: (event: Event) => void;
}) {
  const waiting =
    useCountdown(failure?.kind === "rate-limited" ? failure.error : null) > 0;
  const inUse = failure?.kind === "in-use";

  // The press on "Xóa" turns the dialog into the in-use answer and that button leaves, so focus
  // would drop to the frame of the dialog. It goes to the safe button instead.
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (inUse) closeButton.current?.focus();
  }, [inUse]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent onCloseAutoFocus={onCloseAutoFocus}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {failure?.kind === "rate-limited" && (
          <RateLimitNotice error={failure.error} />
        )}
        {failure?.kind === "in-use" && (
          <Alert variant="warning">
            <TriangleAlertIcon aria-hidden="true" />
            <AlertTitle>{IN_USE_TITLE}</AlertTitle>
            <AlertDescription>{IN_USE_HINT}</AlertDescription>
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
          <AlertDialogCancel ref={closeButton} size="lg" disabled={pending}>
            {inUse ? CLOSE : KEEP}
          </AlertDialogCancel>
          {!inUse && (
            <AlertDialogAction
              variant="destructive"
              size="lg"
              disabled={pending || waiting}
              onClick={(event) => {
                // The default of the action is to close; the page does that after the answer.
                event.preventDefault();
                onConfirm();
              }}
            >
              {pending && <Spinner size="sm" aria-hidden="true" />}
              {pending ? DELETING : DELETE_CONFIRM}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
