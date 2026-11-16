"use client";

import type { ReactNode } from "react";
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
import {
  CANCEL,
  CANCEL_DIALOG_DESCRIPTION,
  CANCEL_DIALOG_TITLE,
  CANCELLING,
  KEEP_ORDER,
} from "../order-text";

interface CancelOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  /** From `useReturnFocus`: the dialog has no trigger of its own, it opens from state. */
  onCloseAutoFocus: (event: Event) => void;
  /**
   * The confirm button closes the dialog by default, and the page then shows the result or the
   * failure itself (the order page). The history keeps the dialog open while the request runs and
   * shows a failure inside it, so it passes `keepOpen`, `pending` and a `notice`.
   */
  keepOpen?: boolean;
  /** True while the request is in flight: the dialog cannot be closed or confirmed twice. */
  pending?: boolean;
  /** A failure shown inside the dialog, between the text and the buttons. */
  notice?: ReactNode;
  /** Locks the confirm button, for a wait after a 429. */
  confirmLocked?: boolean;
}

/**
 * "Hủy đơn này?" (spec 0022, AC-7 and AC-16). An `AlertDialog`, because a cancelled order is final:
 * the first focus lands on the safe button "Giữ đơn", and a click outside does not close it. One
 * dialog serves the order page and, later, every row of the history.
 */
export function CancelOrderDialog({
  open,
  onOpenChange,
  onConfirm,
  onCloseAutoFocus,
  keepOpen = false,
  pending = false,
  notice,
  confirmLocked = false,
}: CancelOrderDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent onCloseAutoFocus={onCloseAutoFocus}>
        <AlertDialogHeader>
          <AlertDialogTitle>{CANCEL_DIALOG_TITLE}</AlertDialogTitle>
          <AlertDialogDescription>
            {CANCEL_DIALOG_DESCRIPTION}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {notice}
        <AlertDialogFooter>
          <AlertDialogCancel size="lg" disabled={pending}>
            {KEEP_ORDER}
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            size="lg"
            disabled={pending || confirmLocked}
            onClick={(event) => {
              // With `keepOpen` the caller closes the dialog when the answer has come.
              if (keepOpen) event.preventDefault();
              onConfirm();
            }}
          >
            {pending && <Spinner size="sm" aria-hidden="true" />}
            {pending ? CANCELLING : CANCEL}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
