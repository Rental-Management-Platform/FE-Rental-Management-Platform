import { EyeIcon, EyeOffIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  HIDE_BUTTON,
  UNHIDE_BUTTON,
  hideButtonName,
  unhideButtonName,
} from "../admin-reviews-text";
import type { ReviewRow } from "../review-row";
import { reviewActionOf } from "../review-rule";

/**
 * The button of one row, as `reviewActionOf` decided it: "Ẩn" for a review that shows, "Gỡ ẩn" for
 * one an admin hid. The name says whose review it is and about what (`about`), so a screen reader
 * that lists the buttons of the page can tell them apart. `data-review-actions` is how a dialog
 * finds the button of the same row to give focus back to when the one that opened it is gone.
 */
export function ReviewRowActions<Row extends ReviewRow>({
  review,
  about,
  size,
  onHide,
  onUnhide,
}: {
  review: Row;
  /** "của Bạn Lan về Anh Minh". */
  about: string;
  /** 32 px in the table, 44 px in the blocks. */
  size: "sm" | "lg";
  onHide: (review: Row) => void;
  onUnhide: (review: Row) => void;
}) {
  const unhide = reviewActionOf(review.status) === "unhide";
  return (
    <div
      data-review-actions={review.id}
      className="flex flex-wrap items-center gap-2"
    >
      <Button
        type="button"
        variant="outline"
        size={size}
        aria-label={unhide ? unhideButtonName(about) : hideButtonName(about)}
        onClick={() => (unhide ? onUnhide(review) : onHide(review))}
      >
        {unhide ? (
          <EyeIcon data-icon="inline-start" aria-hidden="true" />
        ) : (
          <EyeOffIcon data-icon="inline-start" aria-hidden="true" />
        )}
        {unhide ? UNHIDE_BUTTON : HIDE_BUTTON}
      </Button>
    </div>
  );
}
