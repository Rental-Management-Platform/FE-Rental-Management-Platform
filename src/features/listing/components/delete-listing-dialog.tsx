"use client";

import { CircleAlertIcon } from "lucide-react";
import { RateLimitNotice } from "@/components/states/rate-limit-notice";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import type { DeleteFailure } from "../row-failure";

interface DeleteListingDialogProps {
  /** The title of the listing being asked about. It keeps showing while the dialog closes. */
  title: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** True while the request is in flight: the dialog cannot be closed or confirmed twice. */
  pending: boolean;
  failure: DeleteFailure | null;
  onConfirm: () => void;
  /** From `useReturnFocus`: the dialog has no trigger of its own, it opens from a row. */
  onCloseAutoFocus: (event: Event) => void;
}

/**
 * "Xóa tin “…”?" (spec 0019, AC-8). An `AlertDialog`, because a delete cannot be undone: the
 * first focus lands on the safe button. The confirm button never closes the dialog by itself:
 * the page closes it when the answer has come. A failure other than "already gone" is shown here
 * and the dialog stays; a 429 locks the button while the wait counts down.
 */
export function DeleteListingDialog({
  title,
  open,
  onOpenChange,
  pending,
  failure,
  onConfirm,
  onCloseAutoFocus,
}: DeleteListingDialogProps) {
  const waiting =
    useCountdown(failure?.kind === "rate-limited" ? failure.error : null) > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent onCloseAutoFocus={onCloseAutoFocus}>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa tin “{title}”?</AlertDialogTitle>
          <AlertDialogDescription>
            Tin sẽ biến khỏi danh sách của bạn và khỏi trang tìm trọ. Bạn không
            thể hoàn tác thao tác này.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {failure?.kind === "rate-limited" && (
          <RateLimitNotice error={failure.error} />
        )}
        {failure?.kind === "message" && (
          <Alert variant="destructive">
            <CircleAlertIcon aria-hidden="true" />
            <AlertDescription>{failure.message}</AlertDescription>
          </Alert>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel size="lg" disabled={pending}>
            Giữ lại
          </AlertDialogCancel>
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
            {pending ? "Đang xóa" : "Xóa tin"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
