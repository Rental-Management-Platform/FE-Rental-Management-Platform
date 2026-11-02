"use client";

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

export interface DeletePhotoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The photo is the first one, so deleting it makes the next photo the cover. */
  isCover: boolean;
  /** True while the request is in flight: the dialog cannot be closed or confirmed twice. */
  isDeleting: boolean;
  onConfirm: () => void;
  /** From `useReturnFocus`: the dialog has no trigger of its own, it opens from a tile. */
  onCloseAutoFocus: (event: Event) => void;
}

// "Xóa ảnh này?" (spec 0007, AC-6). One dialog serves every saved tile, so it has no trigger. The
// confirm button is not allowed to close the dialog by itself: the zone closes it when the
// answer has come, and until then the button shows a spinner and is off.
export function DeletePhotoDialog({
  open,
  onOpenChange,
  isCover,
  isDeleting,
  onConfirm,
  onCloseAutoFocus,
}: DeletePhotoDialogProps) {
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
          <AlertDialogTitle>Xóa ảnh này?</AlertDialogTitle>
          <AlertDialogDescription>
            Ảnh sẽ bị xóa khỏi tin và không khôi phục được.
            {isCover && " Đây là ảnh bìa, ảnh kế tiếp sẽ thành ảnh bìa."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel size="lg" disabled={isDeleting}>
            Giữ lại
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            size="lg"
            disabled={isDeleting}
            onClick={(event) => {
              // The default of the action is to close; the zone does that after the answer.
              event.preventDefault();
              onConfirm();
            }}
          >
            {isDeleting && <Spinner size="sm" aria-hidden="true" />}
            {isDeleting ? "Đang xóa" : "Xóa ảnh"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
