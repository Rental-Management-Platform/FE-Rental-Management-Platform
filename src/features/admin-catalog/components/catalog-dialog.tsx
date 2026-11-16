"use client";

import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * The frame of the four small forms of the catalog (scope #23): add or rename a ward, add or rename
 * an amenity. Each is a short form that needs its own frame. It has no trigger of its own, because
 * it opens from a toolbar button or from a row, so the page passes `onCloseAutoFocus` from
 * `useReturnFocus`. The title and the text stay set while the dialog closes, so they do not change
 * under the closing animation. The form inside is keyed by the row, so every opening starts from
 * the row's own values.
 */
export function CatalogDialog({
  open,
  onOpenChange,
  onCloseAutoFocus,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCloseAutoFocus: (event: Event) => void;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onCloseAutoFocus={onCloseAutoFocus}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
