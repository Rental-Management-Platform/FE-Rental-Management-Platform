"use client";

import { FailureNotice } from "@/components/form/failure-notice";
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
import { describeError } from "@/lib/api/errors";

type DeleteReviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** True while the request, and the read that follows it, are running. */
  isDeleting: boolean;
  /** What the last attempt threw, or `null`. The dialog stays open and says it. */
  failure: unknown;
  /** Seconds left of a 429, or 0: the confirm button is off until it ends. */
  secondsLeft: number;
  onConfirm: () => void;
  /** From `useReturnFocus`: the dialog has no trigger of its own, it opens from the pinned row. */
  onCloseAutoFocus: (event: Event) => void;
};

/**
 * "Xóa đánh giá của bạn?" (spec 0013, AC-10). It deletes for good, so it is an `AlertDialog`: the
 * first focus lands on "Giữ lại", and a click outside does not close it. It is driven by state and
 * has no trigger, because the row it opens from is gone once the delete works: focus then goes to
 * the heading of the zone (`onCloseAutoFocus`). The confirm button is not allowed to close the
 * dialog by itself: the write block closes it when the review is gone and the next state is read.
 * While that runs the dialog cannot be closed or confirmed twice.
 */
export function DeleteReviewDialog({
  open,
  onOpenChange,
  isDeleting,
  failure,
  secondsLeft,
  onConfirm,
  onCloseAutoFocus,
}: DeleteReviewDialogProps) {
  return (
    <AlertDialog
      open={open}
      // Escape and the backdrop must not close it while the request runs.
      onOpenChange={(next) => {
        if (isDeleting && !next) return;
        onOpenChange(next);
      }}
    >
      <AlertDialogContent onCloseAutoFocus={onCloseAutoFocus}>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa đánh giá của bạn?</AlertDialogTitle>
          <AlertDialogDescription>
            Đánh giá sẽ bị xóa hẳn. Bạn có thể viết lại sau.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {failure !== null && (
          <FailureNotice
            failure={failure}
            message={describeError(failure).message}
          />
        )}
        <AlertDialogFooter>
          <AlertDialogCancel size="lg" disabled={isDeleting}>
            Giữ lại
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            size="lg"
            disabled={secondsLeft > 0}
            aria-disabled={isDeleting || undefined}
            onClick={(event) => {
              // The default of the action is to close; the write block does that after the answer.
              event.preventDefault();
              if (!isDeleting) onConfirm();
            }}
          >
            {isDeleting && <Spinner size="sm" aria-hidden="true" />}
            {isDeleting ? "Đang xóa" : "Xóa đánh giá"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
