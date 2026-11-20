"use client";

import { InfoIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const DETAIL_BUTTON = "Xem chi tiết";
const DETAIL_DESCRIPTION = "Thông tin đầy đủ của dòng này.";

interface RowDetailProps {
  /** Which row it is, for the accessible name of the button: "Xem chi tiết <name>". */
  name: string;
  /** The title of the dialog: "Chi tiết người dùng". */
  title: string;
  /** `sm` is the dense desktop row (32 px). `lg` is the phone block (44 px). */
  size: "sm" | "lg";
  /**
   * A square icon button with the same name, so the buttons of a dense row stay on one line. The
   * default follows `size`: an icon in the dense desktop row (`sm`), words in the phone block
   * (`lg`). A row whose other buttons are all icons passes `true` for both.
   */
  iconOnly?: boolean;
  /** A `DetailList`. */
  children: ReactNode;
}

/**
 * "Xem chi tiết" of one data row: a button that opens a dialog with everything the row leaves out.
 * A row of a list shows only what tells it apart and its short status. The long text (the reason
 * an admin gave, a comment, why a button is off, the full address) is read here, so no row grows
 * taller than the others and no small note sits under a row. The dialog has its own trigger, so
 * Radix gives focus back to the button when it closes.
 */
export function RowDetail({
  name,
  title,
  size,
  iconOnly = size === "sm",
  children,
}: RowDetailProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {iconOnly ? (
          <Button
            type="button"
            variant="ghost"
            size={size === "lg" ? "icon-lg" : "icon-sm"}
            aria-label={`${DETAIL_BUTTON} ${name}`}
            title={DETAIL_BUTTON}
          >
            <InfoIcon aria-hidden="true" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size={size}
            aria-label={`${DETAIL_BUTTON} ${name}`}
          >
            <InfoIcon data-icon="inline-start" aria-hidden="true" />
            {DETAIL_BUTTON}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">
            {DETAIL_DESCRIPTION}
          </DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

/** The facts inside a `RowDetail`, one under the other, each with its label above the value. */
export function DetailList({ children }: { children: ReactNode }) {
  return <dl className="flex flex-col gap-4 text-sm">{children}</dl>;
}

/**
 * One fact of a `RowDetail`. The value is plain text with its line breaks and a long word wraps
 * instead of widening the dialog, because it may be the words a person typed (a reason, a comment).
 */
export function DetailItem({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words whitespace-pre-line">{children}</dd>
    </div>
  );
}
