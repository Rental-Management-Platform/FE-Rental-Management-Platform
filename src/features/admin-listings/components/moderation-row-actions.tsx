import { EyeIcon, EyeOffIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ModerationListing } from "@/lib/api/types";
import {
  HIDE_BUTTON,
  UNHIDE_BUTTON,
  hideButtonName,
  unhideButtonName,
} from "../admin-listings-text";
import { moderationActionOf } from "../moderation-rule";

/**
 * The button of one row, as `moderationActionOf` decided it: "Ẩn" for a listing that shows or that
 * the landlord hid, "Gỡ ẩn" for one an admin hid. The name carries the title of the row, so a
 * screen reader that lists the buttons of the page can tell them apart. `data-moderation-actions`
 * is how a dialog finds the button of the same row to give focus back to when the one that opened
 * it is gone.
 */
export function ModerationRowActions({
  listing,
  size,
  onHide,
  onUnhide,
}: {
  listing: ModerationListing;
  /** 32 px in the table, 44 px in the blocks. */
  size: "sm" | "lg";
  onHide: (listing: ModerationListing) => void;
  onUnhide: (listing: ModerationListing) => void;
}) {
  const unhide = moderationActionOf(listing.status) === "unhide";
  return (
    <div
      data-moderation-actions={listing.id}
      className="flex flex-wrap items-center gap-2"
    >
      <Button
        type="button"
        variant="outline"
        size={size}
        aria-label={
          unhide
            ? unhideButtonName(listing.title)
            : hideButtonName(listing.title)
        }
        onClick={() => (unhide ? onUnhide(listing) : onHide(listing))}
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
