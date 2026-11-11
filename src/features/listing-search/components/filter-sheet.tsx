"use client";

import Link from "next/link";
import {
  useRef,
  useState,
  type FocusEvent,
  type FormEventHandler,
} from "react";
import type { Control } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import type { Ward } from "@/lib/api/types";
import type { FilterFormInput, FilterFormValues } from "../filter-form";
import { focusDraftField } from "../focus-draft-field";
import { SEARCH_BAR_TEXTS } from "../text";
import { FilterFields } from "./filter-fields";

/**
 * The filters on a phone (spec 0016, AC-6): a sheet that slides up from the bottom, with the
 * ward box and the two price boxes in a form of its own, "Xóa bộ lọc" (only when the address has
 * filters) and "Áp dụng" in a footer that stays at the bottom, and the fields scrolling above it.
 * The boxes read and write the draft of the bar through `control`, so the sheet only holds what
 * is on screen. `onSubmit` is the bar's own send.
 *
 * - It is at most 85% of the window high, counted in `dvh`, so the phone's address bar does not
 *   hide the footer, and the footer is never inside the scrolling part, so the keyboard cannot
 *   leave "Áp dụng" out of reach (iOS has no Return key on a numeric keyboard).
 * - On open, focus goes to the title, not the first box, so a screen reader reads the sheet from
 *   the top and no keyboard opens by itself. The one exception is a send the bar refused, which
 *   opens the sheet to show the first wrong box: `focusField` names it and focus goes there.
 * - The sheet is driven by state and sits beside the bar's form, not inside it: a `submit` event
 *   bubbles up the React tree, so a sheet inside the form would send the bar's form as well. It
 *   has no trigger of its own, so `onCloseAutoFocus` (from `useReturnFocus`) gives focus back to
 *   the "Bộ lọc" button when it closes.
 * - The ward list opens inside the sheet's own content (`portalContainer`), so the scroll lock of
 *   the dialog does not stop its 168 rows from scrolling by touch (spec 0015, AC-18).
 */
export function FilterSheet({
  open,
  onOpenChange,
  onCloseAutoFocus,
  control,
  initialWards,
  onSubmit,
  clearHref,
  onClear,
  pending,
  focusField,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCloseAutoFocus: (event: Event) => void;
  control: Control<FilterFormInput, unknown, FilterFormValues>;
  initialWards?: Ward[];
  onSubmit: FormEventHandler<HTMLFormElement>;
  /** The address without the ward and price, or `null` when the address has no filter. */
  clearHref: string | null;
  onClear: () => void;
  pending: boolean;
  /** The draft field to focus on open instead of the title, or `null`. */
  focusField: string | null;
}) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [content, setContent] = useState<HTMLElement | null>(null);

  const onOpenAutoFocus = (event: Event) => {
    event.preventDefault();
    if (focusField) focusDraftField(focusField);
    else titleRef.current?.focus();
  };

  // A box that takes focus is brought to the middle of the scrolling part, so the virtual
  // keyboard does not cover it. Only the draft boxes: the ward list has its own scroll.
  const keepInView = (event: FocusEvent<HTMLElement>) => {
    const target = event.target;
    if (target instanceof HTMLElement && target.matches("[data-draft-field]")) {
      target.scrollIntoView({ block: "center" });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        ref={setContent}
        onOpenAutoFocus={onOpenAutoFocus}
        onCloseAutoFocus={onCloseAutoFocus}
        className="max-h-[85dvh] gap-0 p-0"
      >
        <SheetHeader>
          <SheetTitle ref={titleRef} tabIndex={-1} className="outline-none">
            {SEARCH_BAR_TEXTS.sheetTitle}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {SEARCH_BAR_TEXTS.sheetDescription}
          </SheetDescription>
        </SheetHeader>
        <form
          noValidate
          onSubmit={onSubmit}
          aria-label={SEARCH_BAR_TEXTS.sheetTitle}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div
            onFocusCapture={keepInView}
            className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 pb-4"
          >
            <FilterFields
              control={control}
              initialWards={initialWards}
              portalContainer={content}
            />
          </div>
          <SheetFooter className="shrink-0 flex-row gap-3 border-t pb-[max(1rem,env(safe-area-inset-bottom))]">
            {clearHref !== null && (
              <Button asChild variant="outline" size="lg" className="flex-1">
                <Link href={clearHref} onClick={onClear}>
                  {SEARCH_BAR_TEXTS.clearFilters}
                </Link>
              </Button>
            )}
            <Button
              type="submit"
              size="lg"
              disabled={pending}
              className="flex-1"
            >
              {pending && <Spinner size="sm" data-icon="inline-start" />}
              {SEARCH_BAR_TEXTS.apply}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
